<script lang="ts">
	import DungeonCombobox from './dungeonCombobox.svelte';
	import * as Table from '$lib/components/ui/table';
	import ArrowUp from 'lucide-svelte/icons/chevron-up';
	import ArrowDown from 'lucide-svelte/icons/chevron-down';
	import Star from 'lucide-svelte/icons/star';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button/';
	import { dungeonCount } from '$lib/types/dungeons';
	import { dungeons } from '$lib/types/dungeons';
	import { apiPopup } from '../stores';
	import { dungeonData } from '../stores';
	import { wowSummaryStore } from '../stores';

	let edit = true;
	let scoreGoal: number | undefined;
	let totalScore: number;
	let scoreUpdateTimeout: NodeJS.Timeout;
	let isResetting = false; // Flag to prevent URL updates during reset
	let isCalculatingFromScore = false; // Flag to prevent URL updates during score calculation

	let showTooltip = false;
	let tooltipX = 0;
	let tooltipY = 0;

	import RecentCharacters from './recentCharacters.svelte';
	import { fetchRuns, fetchWowSummary } from '$lib/utils/characterData';
	import { recentCharacters } from '$lib/utils/recentCharacters';
	import { goto, replaceState } from '$app/navigation';
	import { page } from '$app/stores';
	import { currentState } from '$lib/utils/currentState';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	let currentCharacter: { characterName: string; region: string; realm: string } | null = null;

	function loadCharacter(char: { characterName: string; region: string; realm: string }) {
		isLoadingCharacter = true;
		scoreGoal = undefined;
		updateUrlWithCharacter(char);
		
		loadCharacterData(char.characterName, char.region, char.realm)
			.finally(() => {
				setTimeout(() => isLoadingCharacter = false, 100);
			});
	}

	let isLoadingFromUrl = false;
	let isLoadingCharacter = false;
	let lastUrlRuns = '';
	let lastUrlCharacter = '';
	let lastUrlScore = '';
	let isMounted = false;

	function updateAndSaveUrl(currentUrl: URL, context: string) {
		try {
			replaceState(currentUrl.pathname + currentUrl.search, {});
			
			if ($page.data.session?.user) {
				const newUrlParams = currentUrl.search.substring(1);
				if (newUrlParams.length > 0) {
					currentState.save(newUrlParams);
				}
			}
		} catch (err) {
			console.error(`Failed to update URL for ${context}:`, err);
		}
	}

	async function loadCharacterData(name: string, region: string, realm: string) {
		currentCharacter = { characterName: name, region, realm };
		
		await Promise.all([
			fetchRuns(name, region, realm),
			fetchWowSummary(name, region, realm)
		]);
		
		if ($page.data.session?.user) {
			try {
				await recentCharacters.add({ characterName: name, region, realm });
			} catch (error) {
				console.error('Failed to add character to recent list:', error);
			}
		}
	}	// Helper function to get character info from URL
	function getCharacterFromUrl(): string {
		const name = $page.url.searchParams.get('char');
		const region = $page.url.searchParams.get('region');
		const realm = $page.url.searchParams.get('realm');
		
		if (name && region && realm) {
			return `${name}-${region}-${realm}`;
		}
		return '';
	}

	async function loadCharacterFromUrl() {
		const name = $page.url.searchParams.get('char');
		const region = $page.url.searchParams.get('region');
		const realm = $page.url.searchParams.get('realm');

		if (name && region && realm) {
			await loadCharacterData(name, region, realm);
		}
	}

	// Load score goal from URL parameters
	function loadScoreFromUrl() {
		const scoreParam = $page.url.searchParams.get('score');
		if (scoreParam) {
			const score = parseInt(scoreParam);
			if (!isNaN(score) && score > 0) {
				// Set the score goal and trigger calculation
				scoreGoal = score;
				calculateScore();
			}
		}
	}

	// Update URL with character information (clears runs and score)
	function updateUrlWithCharacter(char: { characterName: string; region: string; realm: string }) {
		if (isLoadingFromUrl || isResetting || typeof window === 'undefined') return;

		try {
			const currentUrl = new URL(window.location.href);
			// Clear other parameters
			currentUrl.searchParams.delete('runs');
			currentUrl.searchParams.delete('score');
			// Set character parameters
			currentUrl.searchParams.set('char', char.characterName);
			currentUrl.searchParams.set('region', char.region);
			currentUrl.searchParams.set('realm', char.realm);

			// Update tracking variables BEFORE URL change to prevent reactive interference
			lastUrlRuns = '';
			lastUrlScore = '';
			lastUrlCharacter = `${char.characterName}-${char.region}-${char.realm}`;

			updateAndSaveUrl(currentUrl, 'character data');
		} catch (err) {
			console.error('Failed to update URL with character:', err);
		}
	}

	// Update URL with score goal (clears runs and character)
	function updateUrlWithScore(score: number) {
		if (isLoadingFromUrl || isResetting || typeof window === 'undefined') return;

		try {
			const currentUrl = new URL(window.location.href);
			// Clear other parameters
			currentUrl.searchParams.delete('runs');
			currentUrl.searchParams.delete('char');
			currentUrl.searchParams.delete('region');
			currentUrl.searchParams.delete('realm');
			
			if (score && score > 0) {
				currentUrl.searchParams.set('score', score.toString());
				lastUrlScore = score.toString();
			} else {
				currentUrl.searchParams.delete('score');
				lastUrlScore = '';
			}

			// Update tracking variables BEFORE URL change to prevent reactive interference
			lastUrlRuns = '';
			lastUrlCharacter = '';

			updateAndSaveUrl(currentUrl, 'score data');
		} catch (err) {
			console.error('Failed to update URL with score:', err);
		}
	}

	// Load runs from a parameter string (used for saved state loading)
	function loadRunsFromParam(runsParam: string) {
		if (!runsParam) return;
		
		// Reset all runs to default first
		dungeonData.update((data) => {
			// Reset all runs
			for (let i = 0; i < data.runs.length; i++) {
				data.runs[i].mythic_level = 0;
				data.runs[i].num_keystone_upgrades = 1;
				data.runs[i].score = 0;
			}

			// Parse compact format without separators: ARAK152EDA121...
			let appliedCount = 0;
			let i = 0;
			while (i < runsParam.length && appliedCount < data.runs.length) {
				// Find the next dungeon short name
				let foundDungeon = null;
				let shortNameEnd = -1;

				for (const dungeon of dungeons) {
					const shortName = dungeon.short_name;
					if (runsParam.startsWith(shortName, i)) {
						foundDungeon = dungeon;
						shortNameEnd = i + shortName.length;
						break;
					}
				}

				if (foundDungeon && shortNameEnd !== -1) {
					// Extract level (2 digits) and stars (1 digit)
					const levelStr = runsParam.substring(shortNameEnd, shortNameEnd + 2);
					const starsStr = runsParam.substring(shortNameEnd + 2, shortNameEnd + 3);
					
					let nextIndex = shortNameEnd + 3; // Default position after stars
					let fractionalScore = 0;
					
					// Check for fractional score (starts with '-')
					if (nextIndex < runsParam.length && runsParam.charAt(nextIndex) === '-') {
						nextIndex++; // Skip the '-'
						let scoreEnd = nextIndex;
						
						// Find the end of the score number (digits and one decimal point)
						while (scoreEnd < runsParam.length) {
							const char = runsParam.charAt(scoreEnd);
							if (char >= '0' && char <= '9') {
								scoreEnd++;
							} else if (char === '.' && !runsParam.substring(nextIndex, scoreEnd).includes('.')) {
								scoreEnd++; // Include decimal point (only one allowed)
							} else {
								break; // Stop at any non-digit, non-decimal character
							}
						}
						
						const scoreStr = runsParam.substring(nextIndex, scoreEnd);
						fractionalScore = parseFloat(scoreStr) || 0;
						nextIndex = scoreEnd;
					}

					const level = parseInt(levelStr) || 0;
					const stars = parseInt(starsStr) || 1;

					if (level > 0 && stars >= 1 && stars <= 3) {
						// Calculate base score and add fractional score
						const baseScore = scoreFormula(level, stars);
						const totalScore = baseScore + fractionalScore;
						
						// Apply to the next available run slot
						data.runs[appliedCount].dungeon = foundDungeon.value;
						data.runs[appliedCount].mythic_level = level;
						data.runs[appliedCount].num_keystone_upgrades = stars;
						data.runs[appliedCount].score = totalScore;
						appliedCount++;
					}

					i = nextIndex; // Move to next segment
				} else {
					// Skip unrecognized character
					i++;
				}
			}

			return data;
		});
	}

	function loadFromUrl() {
		try {
			const runsParam = $page.url.searchParams.get('runs');
			if (runsParam) {
				loadRunsFromParam(runsParam);
			}
		} catch (error) {
			console.error('Failed to load from URL:', error);
		}
	}

	function updateUrlWithCurrentData() {
		if (isLoadingFromUrl || isResetting || isCalculatingFromScore || typeof window === 'undefined') return;

		try {
			// Create compact format without separators: ARAK152EDA121...
			let compactData = '';
			for (let i = 0; i < $dungeonData.runs.length; i++) {
				const run = $dungeonData.runs[i];

				// Find the dungeon that matches the current run's dungeon value
				const selectedDungeon = dungeons.find((d) => d.value === run.dungeon);

				// Only include runs with meaningful data (level > 0) and valid dungeon
				if (run.mythic_level > 0 && selectedDungeon) {
					// Calculate expected score from level and stars
					const expectedScore = scoreFormula(run.mythic_level, run.num_keystone_upgrades);
					
					// Format: shortname + level (2 digits) + stars (1 digit)
					const levelPadded = run.mythic_level.toString().padStart(2, '0');
					let runData = `${selectedDungeon.short_name}${levelPadded}${run.num_keystone_upgrades}`;
					
					// Only add fractional score if actual score differs from expected
					if (Math.abs(run.score - expectedScore) > 0.1) { // Small tolerance for floating point comparison
						const fractionalScore = run.score - expectedScore;
						if (fractionalScore >= 0 && fractionalScore <= 7.5) {
							runData += `-${fractionalScore.toFixed(1)}`;
						}
					}
					
					compactData += runData;
				}
			}

			const currentUrl = new URL(window.location.href);
			
			// Clear other parameters when switching to runs mode (single parameter constraint)
			currentUrl.searchParams.delete('char');
			currentUrl.searchParams.delete('region');
			currentUrl.searchParams.delete('realm');
			currentUrl.searchParams.delete('score');
			
			// Update tracking variables for cleared parameters
			lastUrlCharacter = '';
			lastUrlScore = '';
			
			if (compactData.length > 0) {
				currentUrl.searchParams.set('runs', compactData);
				lastUrlRuns = compactData; // Update our tracking variable BEFORE URL change
			} else {
				currentUrl.searchParams.delete('runs');
				lastUrlRuns = ''; // Update our tracking variable BEFORE URL change
			}

			updateAndSaveUrl(currentUrl, 'runs data');
		} catch (err) {
			console.error('Failed to update URL:', err);
		}
	}

	// Load saved state when component mounts
	onMount(async () => {
		// First, check for URL parameters (takes priority)
		const urlChar = getCharacterFromUrl();
		const urlRuns = $page.url.searchParams.get('runs');
		const urlScore = $page.url.searchParams.get('score');
		
		// If we have URL parameters, load them instead of saved state
		if (urlChar || urlRuns || urlScore) {
			isLoadingFromUrl = true;
			
			try {
				// Load URL parameters
				if (urlChar) {
					await loadCharacterFromUrl();
				}
				if (urlRuns) {
					await loadFromUrl();
				}
				if (urlScore) {
					await loadScoreFromUrl();
				}
			} finally {
				setTimeout(() => {
					isLoadingFromUrl = false;
				}, 200);
			}
			return;
		}
		
		if ($page.data.session?.user) {
			try {
				const savedState = await currentState.load();
				if (savedState) {
					// Temporarily set loading flag to prevent reactive interference
					isLoadingFromUrl = true;
					
					try {
						if (savedState.urlParams) {
							// Simply update the URL parameters using replaceState (consistent with other URL updates)
							const newUrl = new URL(window.location.href);
							newUrl.search = savedState.urlParams;
							replaceState(newUrl.pathname + newUrl.search, {});
							
							// Parse the saved parameters and update the component state directly
							const params = new URLSearchParams(savedState.urlParams);
							
							// Process character parameters
							const char = params.get('char');
							const region = params.get('region');
							const realm = params.get('realm');
							if (char && region && realm) {
								await loadCharacterData(char, region, realm);
							}
							
							// Process runs parameter directly
							const runs = params.get('runs');
							if (runs) {
								loadRunsFromParam(runs);
							}
							
							// Process score parameter
							const score = params.get('score');
							if (score) {
								scoreGoal = parseInt(score);
							}
							
							toast.success('Restored saved state');
						} else {
							toast.info('No saved state found');
						}
					} finally {
						// Clear loading flag after a delay to ensure everything is settled
						setTimeout(() => {
							isLoadingFromUrl = false;
						}, 200);
					}
				}
			} catch (error) {
				console.error('Failed to load saved state:', error);
				toast.error('Failed to load saved state');
			}
		}

		// Enable reactive URL handling now that component is mounted
		isMounted = true;
	});

	let previousAuthState = false;
	let hasLoadedSavedState = false;
	
	$: {
		const isAuthenticated = !!$page.data.session?.user;
		const justSignedIn = !previousAuthState && isAuthenticated && isMounted && !hasLoadedSavedState;
		
		if (justSignedIn) {
			// Check if we have URL parameters - if so, don't load saved state
			const urlChar = getCharacterFromUrl();
			const urlRuns = $page.url.searchParams.get('runs');
			const urlScore = $page.url.searchParams.get('score');
			
			if (!urlChar && !urlRuns && !urlScore) {
				// No URL parameters, load saved state
				hasLoadedSavedState = true;
				loadSavedStateOnSignIn();
			}
		}
		
		// Reset the flag when user signs out
		if (!isAuthenticated && previousAuthState) {
			hasLoadedSavedState = false;
		}
		
		previousAuthState = isAuthenticated;
	}

	// Function to load saved state when user signs in
	async function loadSavedStateOnSignIn() {
		try {
			const savedState = await currentState.load();
			
			if (savedState) {
				isLoadingFromUrl = true;
				
				try {
					if (savedState.urlParams) {
						// Simply navigate to the saved URL parameters
						const newUrl = new URL(window.location.href);
						newUrl.search = savedState.urlParams;
						await goto(newUrl.pathname + newUrl.search, { replaceState: true, noScroll: true });
						
						// After URL navigation, manually process the URL parameters to update DOM
						const params = new URLSearchParams(savedState.urlParams);
						
						// Process character parameters
						const char = params.get('char');
						const region = params.get('region');
						const realm = params.get('realm');
						if (char && region && realm) {
							await loadCharacterFromUrl();
						}
						
						// Process runs parameter
						const runs = params.get('runs');
						if (runs) {
							await loadFromUrl();
						}
						
						// Process score parameter
						const score = params.get('score');
						if (score) {
							await loadScoreFromUrl();
						}
						
						toast.success('Welcome back! Restored your previous state');
					} else {
						console.log('No saved URL parameters found');
					}
				} finally {
					setTimeout(() => {
						isLoadingFromUrl = false;
					}, 200);
				}
				} else {
					console.log('No saved state found');
				}
		} catch (error) {
			console.error('Failed to load saved state on sign in:', error);
		}
	}

	async function shareRuns(event: MouseEvent) {
		try {
			const shareableUrl = window.location.href;
			await navigator.clipboard.writeText(shareableUrl);
			tooltipX = event.clientX;
			tooltipY = event.clientY;
			showTooltip = true;
			setTimeout(() => {
				showTooltip = false;
			}, 1000);
		} catch (err) {
			console.error('Failed to copy shareable URL:', err);
			alert('Failed to copy shareable URL.');
		}
	}

	function incrementKeyLevel(i: number) {
		if ($dungeonData.runs[i].mythic_level === 0) {
			$dungeonData.runs[i].mythic_level = 2;
			recalcScore(i);
		} else {
			$dungeonData.runs[i].mythic_level++;
			recalcScore(i);
		}
		scoreGoal = undefined;
		updateUrlWithCurrentData();
	}

	function decrementKeyLevel(i: number) {
		if ($dungeonData.runs[i].mythic_level === 2) {
			$dungeonData.runs[i].mythic_level = 0;
			recalcScore(i);
		} else if ($dungeonData.runs[i].mythic_level > 0) {
			$dungeonData.runs[i].mythic_level--;
			recalcScore(i);
		}
		scoreGoal = undefined;
		updateUrlWithCurrentData();
	}

	function setStars(i: number, newStars: number) {
		$dungeonData.runs[i].num_keystone_upgrades = newStars + 1;
		recalcScore(i);
		scoreGoal = undefined;
		updateUrlWithCurrentData();
	}

	function recalcScore(i: number) {
		let run = $dungeonData.runs[i];
		run.score = scoreFormula(run.mythic_level, run.num_keystone_upgrades);
	}

	$: totalScore = $dungeonData.runs.reduce((sum, r) => sum + r.score, 0);

	function resetRuns() {
		// Set flags to prevent URL reactive interference and URL updates
		isLoadingFromUrl = true;
		isResetting = true;
		
		// Clear any pending score update timeouts
		if (scoreUpdateTimeout) clearTimeout(scoreUpdateTimeout);
		
		dungeonData.update((data) => {
			for (let i = 0; i < dungeonCount; i++) {
				// Reset to original dungeon names and clear run data
				data.runs[i].dungeon = dungeons[i].value;
				data.runs[i].short_name = dungeons[i].short_name;
				data.runs[i].mythic_level = 0;
				data.runs[i].num_keystone_upgrades = 1;
				data.runs[i].score = 0;
			}
			return data;
		});
		
		// Clear character data and score
		currentCharacter = null;
		wowSummaryStore.set(null);
		scoreGoal = undefined; // Reset score goal
		
		// Update tracking variables to match cleared state FIRST
		lastUrlRuns = '';
		lastUrlCharacter = '';
		lastUrlScore = '';
		
		// Clear all parameters from URL
		if (typeof window !== 'undefined') {
			const currentUrl = new URL(window.location.href);
			currentUrl.searchParams.delete('runs');
			currentUrl.searchParams.delete('char');
			currentUrl.searchParams.delete('region');
			currentUrl.searchParams.delete('realm');
			currentUrl.searchParams.delete('score');
			
			// Navigate to clean URL
			goto(currentUrl.pathname + currentUrl.search, { replaceState: true, noScroll: true });
		}
		
		// Clear the loading flags and recalculate after a shorter delay
		setTimeout(() => {
			calculateScore();
			isLoadingFromUrl = false;
			isResetting = false; // Clear reset flag
			// URL save will happen automatically via reactive statement
		}, 100);
	}

	function scoreFormula(keyLevel: number, star: number): number {
		if (keyLevel < 2) {
			return 0;
		}

		const affixBreakpoints: Record<number, number> = {
			4: 15,
			7: 15,
			10: 15,
			12: 15
		};

		let parScore = 155;
		for (let current = 2; current < keyLevel; current++) {
			parScore += 15;
			const nextLevel = current + 1;
			if (affixBreakpoints[nextLevel]) {
				parScore += affixBreakpoints[nextLevel];
			}
		}

		let timeAdjustment = 0;
		switch (star) {
			case 1:
				timeAdjustment = 0;
				break;
			case 2:
				timeAdjustment = 7.5;
				break;
			case 3:
				timeAdjustment = 15;
				break;
		}
		return parScore + timeAdjustment;
	}

	function calculateScore() {
		// Return early if scoreGoal is undefined
		if (scoreGoal === undefined) return;
		
		// Set flag to prevent URL updates during score calculation
		isCalculatingFromScore = true;
		
		// Reset runs data directly instead of calling resetRuns()
		dungeonData.update((data) => {
			for (let i = 0; i < dungeonCount; i++) {
				// Reset to original dungeon names and clear run data
				data.runs[i].dungeon = dungeons[i].value;
				data.runs[i].short_name = dungeons[i].short_name;
				data.runs[i].mythic_level = 0;
				data.runs[i].num_keystone_upgrades = 1;
				data.runs[i].score = 0;
			}
			return data;
		});

		let scorePerDungeon = scoreGoal / dungeonCount;
		let runScore;
		if (scoreGoal >= 1240) {
			for (let i = 0; i < 30; i++) {
				runScore = Math.round(scoreFormula(i, 1));
				if (scorePerDungeon === runScore) {
					for (let j = 0; j < dungeonCount; j++) {
						$dungeonData.runs[j].mythic_level = i;
						$dungeonData.runs[j].score = runScore;
					}
					break;
				} else if (runScore > scorePerDungeon) {
					runScore = Math.round(scoreFormula(i - 1, 1));
					let scoreDifference = Math.round(scoreGoal - runScore * dungeonCount);

					for (let j = 0; j < dungeonCount; j++) {
						if (scoreDifference > 0) {
							scoreDifference -= scoreFormula(i, 1) - scoreFormula(i - 1, 1);
							$dungeonData.runs[j].mythic_level = i;
							$dungeonData.runs[j].score = scoreFormula(i, 1);
						} else {
							$dungeonData.runs[j].mythic_level = i - 1;
							$dungeonData.runs[j].score = scoreFormula(i - 1, 1);
						}
					}
					break;
				}
			}
		} else {
			let tempScore = scoreGoal;
			for (let i = 0; i < dungeonCount; i++) {
				if (tempScore > 0) {
					tempScore -= 155;
					$dungeonData.runs[i].mythic_level = 2;
					$dungeonData.runs[i].score += 155;
				}
			}
		}
		// Don't call updateUrlWithCurrentData() during score calculation
		// The score input will handle URL updates and saving
		isCalculatingFromScore = false;
	}
</script>

<div class="container flex flex-col gap-8 p-4 md:flex-row md:px-8 xl:px-40 2xl:px-72">
	<div class="flex w-full flex-col space-y-6 md:w-64">
		<div class="character-container">
			<RecentCharacters {loadCharacter} />
		</div>
		{#if $wowSummaryStore}
			<div class="w-full">
				{#each $wowSummaryStore.media.assets as asset}
					{#if asset.key === 'inset'}
						<img src={asset.value} alt="Character media" class="my-2" />
					{/if}
				{/each}
				<h2 class="text-lg font-semibold">{$wowSummaryStore.name}</h2>
				<p class="text-sm text-muted-foreground">
					&lt;{$wowSummaryStore.guild?.name}&gt; — {$wowSummaryStore.realm.name}
				</p>
				<p class="text-sm">
					{$wowSummaryStore.race.name}
					{$wowSummaryStore.active_spec?.name}
					{$wowSummaryStore.character_class.name}
				</p>
			</div>
		{/if}
		<div>
			<Label class="mb-2 block text-lg" for="scoreTarget">Score Target:</Label>
			<Input
				class="w-full"
				type="number"
				id="scoreTarget"
				placeholder="Enter your target Mythic+ score"
				bind:value={scoreGoal}
				min="0"
				on:input={() => {
					calculateScore();
					// Debounce URL update to avoid conflicts while typing
					if (scoreUpdateTimeout) clearTimeout(scoreUpdateTimeout);
					scoreUpdateTimeout = setTimeout(() => {
						if (scoreGoal !== undefined) {
							updateUrlWithScore(scoreGoal);
							// URL save will happen automatically via reactive statement
						}
					}, 1000);
				}}
				aria-label="Score Target"
			/>
		</div>

		<div class="flex flex-col space-y-2">
			<Button class="w-full" on:click={() => ($apiPopup = !$apiPopup)} aria-label="Import Character"
				>Import Character</Button
			>
			<Button class="w-full" on:click={() => resetRuns()}>Reset Runs</Button>
		</div>

		<div class="border-t pt-4">
			<div class="mb-2">
				<Button class="w-full" on:click={(e) => shareRuns(e)} aria-label="Share Runs">
					Share Current Setup
				</Button>
			</div>
			<small class="block text-sm text-muted-foreground">
				Your current setup is saved in the URL. Click "Copy Current Setup" to copy
				the link.
			</small>
		</div>
	</div>
	<div class="relative flex w-full flex-col items-center">
		<h2 class="mb-2 text-xl font-bold">Dungeon Runs &amp; Score Table</h2>
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="text-semibold w-2/5 text-xl">Keystone</Table.Head>
					<Table.Head class="text-semibold w-1/4 text-xl">Level</Table.Head>
					<Table.Head class="w-1/10 text-semibold text-right text-xl">Score</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each Array(dungeonCount) as _, i}
					<Table.Row class="h-12">
						<Table.Cell class="py-0 text-xl">
							<DungeonCombobox
								{dungeons}
								selectedValue={$dungeonData.runs[i].dungeon}
								triggerId={`dungeon-combobox-trigger-${i}`}
								onSelect={(newValue) => {
									dungeonData.update((data) => {
										data.runs[i].dungeon = newValue;
										return data;
									});
									scoreGoal = undefined;
									updateUrlWithCurrentData();
									// URL save will happen automatically via reactive statement
								}}
							/>
						</Table.Cell>
						<Table.Cell class="py-0 text-xl">
							<div class="grid grid-cols-1 items-center">
								<Button
									class="h-6 w-6"
									variant="ghost"
									size="icon"
									on:click={() => incrementKeyLevel(i)}
									aria-label="Increase Mythic Level"
								>
									<ArrowUp class="text-foreground" />
								</Button>
								<span>
									{$dungeonData.runs[i].mythic_level}
									{#each Array(3) as _, j}
										{#if j < $dungeonData.runs[i].num_keystone_upgrades}
											<Button
												class="h-5 w-5"
												variant="ghost"
												size="icon"
												on:click={() => setStars(i, j)}
												aria-label="Set Stars"
											>
												<Star class="fill-foreground text-foreground" />
											</Button>
										{:else if edit}
											<Button
												class="h-5 w-5"
												variant="ghost"
												size="icon"
												on:click={() => setStars(i, j)}
												aria-label="Set Stars"
											>
												<Star class="text-foreground" />
											</Button>
										{/if}
									{/each}
								</span>
								<Button
									class="h-6 w-6"
									variant="ghost"
									size="icon"
									on:click={() => decrementKeyLevel(i)}
									aria-label="Decrease Mythic Level"
								>
									<ArrowDown class="text-foreground" />
								</Button>
							</div>
						</Table.Cell>
						<Table.Cell class="py-0 text-right text-xl">
							{($dungeonData.runs[i].score ?? 0).toFixed(1)}
						</Table.Cell>
					</Table.Row>
				{/each}
				<Table.Row>
					<Table.Cell colspan={4} class="py-2 text-right text-xl font-semibold">
						Total Score: {totalScore.toFixed(1)}
					</Table.Cell>
				</Table.Row>
			</Table.Body>
		</Table.Root>
		{#if showTooltip}
			<div
				class="pointer-events-none z-50 rounded bg-muted px-2 py-1 text-sm"
				style="
          position: fixed;   
          top: {tooltipY - 30}px;  /* 30px above the cursor */
          left: {tooltipX}px;
          transform: translateX(-50%);
        "
				role="status"
				aria-live="polite"
			>
				Copied!
			</div>
		{/if}
	</div>
</div>

<div class="container mx-auto mt-8 px-4">
	<div class="flex flex-col items-start justify-center gap-8 md:flex-row">
		<div class="w-full max-w-xl rounded-lg bg-card p-6 text-center shadow-md">
			<h3 class="mb-4 text-2xl font-semibold">Mythic+ Rewards and Score Tooltip Addon</h3>
			<p class="mb-6">
				The Mr. Mythical addon gives you enhanced and customizable Mythic+ keystone tooltips with
				instant, detailed information, see dungeon rewards, crest earnings, and your potential score
				directly in tooltips and chat.
			</p>
			<Button class="mr-2 mt-2">
				<a
					href="https://www.curseforge.com/wow/addons/mr-mythical"
					target="_blank"
					class="px-6 py-3"
				>
					Download on CurseForge
				</a>
			</Button>
			<Button class="ml-2 mt-2">
				<a href="https://addons.wago.io/addons/mr-mythical" target="_blank" class="px-6 py-3">
					Download on Wago Addons
				</a>
			</Button>
		</div>

		<div class="w-full max-w-xl rounded-lg bg-card p-6 text-center shadow-md">
			<h3 class="mb-4 text-2xl font-semibold">Support on Patreon</h3>
			<p class="mb-6">
				Enjoying these tools? Support MrMythical.com on Patreon to help keep these free, open-source
				WoW utilities accurate and up-to-date. Your contribution enables new features and ongoing
				improvements for the Mythic+ and raid community.
			</p>
			<Button>
				<a href="https://www.patreon.com/MrMythical" target="_blank" class="px-6 py-3">
					Support on Patreon
				</a>
			</Button>
		</div>
	</div>
</div>
