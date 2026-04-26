<script lang="ts">
	import { run as run_1 } from 'svelte/legacy';

	import DungeonCombobox from './dungeonCombobox.svelte';
	import * as Table from '$lib/components/ui/table';
	import ArrowUp from '@lucide/svelte/icons/chevron-up';
	import ArrowDown from '@lucide/svelte/icons/chevron-down';
	import Star from '@lucide/svelte/icons/star';
	import UserRound from '@lucide/svelte/icons/user-round';
	import LinkIcon from '@lucide/svelte/icons/link';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button/';
	import { dungeonCount } from '$lib/types/dungeons';
	import { dungeons } from '$lib/types/dungeons';
	import { apiPopup } from '../stores';
	import { dungeonData } from '../stores';
	import { wowSummaryStore } from '../stores';
	import { scoreFormula, computeRunLevelsForScore } from '$lib/utils/keystoneCalculations';
	import { logClientError } from '$lib/utils/clientLog';

	let edit = true;
	let scoreGoal: number | undefined = $state();
	let totalScore: number = $derived($dungeonData.runs.reduce((sum, r) => sum + r.score, 0));
	let scoreUpdateTimeout: NodeJS.Timeout | undefined = $state();
	let isResetting = false; // Flag to prevent URL updates during reset
	let isCalculatingFromScore = false; // Flag to prevent URL updates during score calculation

	let showTooltip = $state(false);
	let tooltipX = $state(0);
	let tooltipY = $state(0);
	let feedbackRow = $state<number | null>(null);
	let totalPulse = $state(false);
	let listPulse = $state(false);
	let rowFeedbackTimeout: ReturnType<typeof setTimeout> | undefined = $state();
	let totalPulseTimeout: ReturnType<typeof setTimeout> | undefined = $state();
	let listPulseTimeout: ReturnType<typeof setTimeout> | undefined = $state();

	import { fetchRuns, fetchWowSummary, emptyDungeonRuns } from '$lib/utils/characterData';
	import type { BlizzardCharacterFull } from '$lib/types/blizzardFull';
	import { recentCharacters } from '$lib/utils/recentCharacters';
	import RecentCharacters from './recentCharacters.svelte';
	import { goto, replaceState, afterNavigate } from '$app/navigation';
	import { page } from '$app/stores';
	import { currentState } from '$lib/utils/currentState';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	let currentCharacter: { characterName: string; region: string; realm: string } | null = null;

	function loadCharacter(char: { characterName: string; region: string; realm: string }) {
		isLoadingCharacter = true;
		scoreGoal = undefined;
		updateUrlWithCharacter(char);

		loadCharacterData(char.characterName, char.region, char.realm).finally(() => {
			setTimeout(() => (isLoadingCharacter = false), 100);
		});
	}

	let isLoadingFromUrl = false;
	let isLoadingCharacter = false;
	let lastUrlRuns = '';
	let lastUrlCharacter = '';
	let lastUrlScore = '';
	let isMounted = $state(false);

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
			logClientError('keystoneTable', `Failed to update URL for ${context}`, err);
		}
	}

	async function loadCharacterData(name: string, region: string, realm: string) {
		currentCharacter = { characterName: name, region, realm };

		dungeonData.set({ runs: emptyDungeonRuns() });

		const [runsResult, summaryResult] = await Promise.all([
			fetchRuns(region, realm, name),
			fetchWowSummary<BlizzardCharacterFull>(region, realm, name)
		]);

		if (runsResult.kind === 'ok') {
			dungeonData.set({ runs: runsResult.runs });
			toast.success('Runs fetched successfully.');
			apiPopup.set(false);
		} else if (runsResult.kind === 'empty') {
			toast.error('No runs found for this character.');
			apiPopup.set(false);
		} else {
			logClientError('keystoneTable', 'Failed to fetch Raider.io runs', runsResult.status);
			toast.error('Failed to fetch data from Raider.io');
		}

		if (summaryResult.kind === 'ok') {
			wowSummaryStore.set(summaryResult.summary);
		} else {
			logClientError(
				'keystoneTable',
				'Failed to fetch WoW character summary',
				summaryResult.status
			);
		}

		if ($page.data.session?.user) {
			try {
				await recentCharacters.add({ characterName: name, region, realm });
			} catch (error) {
				logClientError('keystoneTable', 'Failed to add character to recent list', error);
			}
		}
	} // Helper function to get character info from URL
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
			logClientError('keystoneTable', 'Failed to update URL with character', err);
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
			logClientError('keystoneTable', 'Failed to load from URL', error);
		}
	}

	function buildCompactRunsData(): string {
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
				if (Math.abs(run.score - expectedScore) > 0.1) {
					// Small tolerance for floating point comparison
					const fractionalScore = run.score - expectedScore;
					if (fractionalScore >= 0 && fractionalScore <= 7.5) {
						runData += `-${fractionalScore.toFixed(1)}`;
					}
				}

				compactData += runData;
			}
		}

		return compactData;
	}

	function updateUrlWithCurrentData() {
		if (isLoadingFromUrl || isResetting || isCalculatingFromScore || typeof window === 'undefined')
			return;

		try {
			const compactData = buildCompactRunsData();

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
			logClientError('keystoneTable', 'Failed to update URL', err);
		}
	}

	// Update URL with score goal and include generated runs breakdown when available.
	function updateUrlWithScore(score: number) {
		if (isLoadingFromUrl || isResetting || typeof window === 'undefined') return;

		try {
			const currentUrl = new URL(window.location.href);
			// Clear character parameters when switching to score mode
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

			const compactData = buildCompactRunsData();
			if (compactData.length > 0) {
				currentUrl.searchParams.set('runs', compactData);
				lastUrlRuns = compactData;
			} else {
				currentUrl.searchParams.delete('runs');
				lastUrlRuns = '';
			}

			// Update tracking variables BEFORE URL change to prevent reactive interference
			lastUrlCharacter = '';

			updateAndSaveUrl(currentUrl, 'score data');
		} catch (err) {
			logClientError('keystoneTable', 'Failed to update URL with score', err);
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

							const params = new URLSearchParams(savedState.urlParams);

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
				logClientError('keystoneTable', 'Failed to load saved state', error);
				toast.error('Failed to load saved state');
			}
		}

		// Enable reactive URL handling now that component is mounted
		isMounted = true;
	});

	let previousAuthState = $state(false);
	let hasLoadedSavedState = $state(false);


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
			logClientError('keystoneTable', 'Failed to load saved state on sign in', error);
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
			logClientError('keystoneTable', 'Failed to copy shareable URL', err);
			alert('Failed to copy shareable URL.');
		}
	}

	function triggerRowFeedback(i: number) {
		feedbackRow = i;
		totalPulse = true;
		if (rowFeedbackTimeout) clearTimeout(rowFeedbackTimeout);
		if (totalPulseTimeout) clearTimeout(totalPulseTimeout);
		rowFeedbackTimeout = setTimeout(() => {
			feedbackRow = null;
		}, 180);
		totalPulseTimeout = setTimeout(() => {
			totalPulse = false;
		}, 200);
	}

	function triggerPlanFeedback() {
		listPulse = true;
		totalPulse = true;
		if (listPulseTimeout) clearTimeout(listPulseTimeout);
		if (totalPulseTimeout) clearTimeout(totalPulseTimeout);
		listPulseTimeout = setTimeout(() => {
			listPulse = false;
		}, 220);
		totalPulseTimeout = setTimeout(() => {
			totalPulse = false;
		}, 220);
	}

	function incrementKeyLevel(i: number) {
		dungeonData.update((data) => {
			const run = data.runs[i];
			const newLevel = run.mythic_level === 0 ? 2 : run.mythic_level + 1;
			data.runs[i] = {
				...run,
				mythic_level: newLevel,
				score: scoreFormula(newLevel, run.num_keystone_upgrades)
			};
			data.runs = [...data.runs];
			return data;
		});
		triggerRowFeedback(i);
		scoreGoal = undefined;
		updateUrlWithCurrentData();
	}

	function decrementKeyLevel(i: number) {
		dungeonData.update((data) => {
			const run = data.runs[i];
			let newLevel = run.mythic_level;
			if (run.mythic_level === 2) newLevel = 0;
			else if (run.mythic_level > 0) newLevel = run.mythic_level - 1;
			data.runs[i] = {
				...run,
				mythic_level: newLevel,
				score: newLevel > 0 ? scoreFormula(newLevel, run.num_keystone_upgrades) : 0
			};
			data.runs = [...data.runs];
			return data;
		});
		triggerRowFeedback(i);
		scoreGoal = undefined;
		updateUrlWithCurrentData();
	}

	function setStars(i: number, newStars: number) {
		dungeonData.update((data) => {
			const run = data.runs[i];
			const stars = newStars + 1;
			data.runs[i] = {
				...run,
				num_keystone_upgrades: stars,
				score: scoreFormula(run.mythic_level, stars)
			};
			data.runs = [...data.runs];
			return data;
		});
		triggerRowFeedback(i);
		scoreGoal = undefined;
		updateUrlWithCurrentData();
	}


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

			// Persist a cleared state so saved-state restore doesn't resurrect
			// previous runs/character after reset.
			if ($page.data.session?.user) {
				currentState.save('');
			}

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

	function calculateScore() {
		// Return early if scoreGoal is undefined or not a valid positive number
		const target = typeof scoreGoal === 'string' ? parseInt(scoreGoal as unknown as string) : scoreGoal;
		if (target === undefined || !Number.isFinite(target) || target <= 0) return;

		// Set flag to prevent URL updates during score calculation
		isCalculatingFromScore = true;

		// Compute run levels before the store update so they're available inside the callback
		const runLevels = computeRunLevelsForScore(target, dungeonCount);

		// Apply everything in a single store update so Svelte notifies subscribers once
		dungeonData.update((data) => {
			const newRuns = [];
			for (let i = 0; i < dungeonCount; i++) {
				const lvl = runLevels[i] ?? 0;
				newRuns.push({
					...data.runs[i],
					dungeon: dungeons[i].value,
					short_name: dungeons[i].short_name,
					mythic_level: lvl,
					num_keystone_upgrades: 1,
					score: lvl > 0 ? scoreFormula(lvl, 1) : 0
				});
			}
			data.runs = newRuns;
			return data;
		});
		triggerPlanFeedback();

		isCalculatingFromScore = false;
		updateUrlWithScore(target);
	}
	run_1(() => {
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
	});

	// React to client-side navigation that changes `?score=N` so clicking a
	// score-target pill updates the calculator without a full reload.
	afterNavigate(({ to, type }) => {
		if (!to || type === 'enter') return;

		// Handle `?char=...&region=...&realm=...` changes so the "Your characters"
		// quick-pick on the page can load a character without a full reload.
		const charName = to.url.searchParams.get('char') ?? '';
		const charRegion = to.url.searchParams.get('region') ?? '';
		const charRealm = to.url.searchParams.get('realm') ?? '';
		const charKey = charName && charRegion && charRealm
			? `${charName}-${charRegion}-${charRealm}`
			: '';
		if (charKey && charKey !== lastUrlCharacter) {
			lastUrlCharacter = charKey;
			if (!isLoadingFromUrl && !isLoadingCharacter) {
				isLoadingCharacter = true;
				loadCharacterData(charName, charRegion, charRealm).finally(() => {
					setTimeout(() => (isLoadingCharacter = false), 100);
				});
			}
		}

		const scoreParam = to.url.searchParams.get('score') ?? '';
		if (scoreParam === lastUrlScore) return;
		lastUrlScore = scoreParam;
		if (isLoadingFromUrl || isCalculatingFromScore) return;
		if (scoreParam) {
			const parsed = parseInt(scoreParam);
			if (!isNaN(parsed) && parsed > 0) {
				scoreGoal = parsed;
				calculateScore();
			}
		} else if (scoreGoal !== undefined) {
			// Navigated away from a score target; clear the goal.
			scoreGoal = undefined;
		}
	});

	// Derived UI state
	const scoreDelta = $derived.by(() => {
		if (scoreGoal === undefined || !Number.isFinite(scoreGoal)) return null;
		return Math.round(totalScore - scoreGoal);
	});
	const hasCharacter = $derived(!!$wowSummaryStore);
	const activeRunCount = $derived($dungeonData.runs.filter((r) => r.mythic_level > 0).length);
	const hasAnyRun = $derived(activeRunCount > 0);
	const keyLevelSummary = $derived.by(() => {
		const counts = new Map<number, number>();
		for (const run of $dungeonData.runs) {
			if (run.mythic_level <= 0) continue;
			counts.set(run.mythic_level, (counts.get(run.mythic_level) ?? 0) + 1);
		}

		return Array.from(counts.entries())
			.sort((a, b) => b[0] - a[0])
			.map(([level, count]) => ({ level, count }));
	});
</script>

<section class="workspace" aria-label="Score calculator">
	<!-- LEFT: table -->
	<div class="table-column">
		<div class="table-head">
			<h2 class="col-label">Dungeon plan</h2>
		</div>

		<div class="row-labels" aria-hidden="true">
			<span>Dungeon</span>
			<span>Level</span>
			<span>Timer</span>
			<span>Score</span>
		</div>

		<div class="rows" role="list" class:list-pulse={listPulse}>
			{#each $dungeonData.runs as run, i (i)}
				{@const active = run.mythic_level > 0}
				<div class="row" class:active class:feedback={feedbackRow === i} style={`--row-index: ${i};`} role="listitem">
					<div class="row-dungeon">
						<DungeonCombobox
							{dungeons}
							selectedValue={run.dungeon}
							triggerId={`dungeon-combobox-trigger-${i}`}
							onSelect={(newValue) => {
								dungeonData.update((data) => {
									data.runs[i] = { ...data.runs[i], dungeon: newValue };
									data.runs = [...data.runs];
									return data;
								});
								triggerRowFeedback(i);
								scoreGoal = undefined;
								updateUrlWithCurrentData();
							}}
						/>
					</div>

					<div class="row-stepper">
						<button
							type="button"
							class="step-btn"
							onclick={() => decrementKeyLevel(i)}
							aria-label="Decrease key level"
							disabled={run.mythic_level === 0}
						>
							<ArrowDown class="h-5 w-5" />
						</button>
						<span class="step-value tabular" aria-live="polite">
							{#if run.mythic_level > 0}+{run.mythic_level}{:else}—{/if}
						</span>
						<button
							type="button"
							class="step-btn"
							onclick={() => incrementKeyLevel(i)}
							aria-label="Increase key level"
						>
							<ArrowUp class="h-5 w-5" />
						</button>
					</div>

					<div class="row-stars" role="group" aria-label="Stars">
						{#each Array(3) as _, j}
							<button
								type="button"
								class="star-btn"
								class:filled={j < run.num_keystone_upgrades && active}
								onclick={() => setStars(i, j)}
								aria-label={`Set ${j + 1} stars`}
								aria-pressed={j < run.num_keystone_upgrades && active}
								disabled={!active}
							>
								<Star class="h-5 w-5" />
							</button>
						{/each}
					</div>

					<div class="row-score tabular">
						{(run.score ?? 0).toFixed(0)}
					</div>
				</div>
			{/each}
		</div>

		<nav class="reward-targets" aria-label="Common score targets">
			<span class="reward-targets-label">Score targets</span>
			<ol class="reward-targets-list">
				<li>
					<a href="/rating-calculator?score=1500">
						<span class="tabular">1500</span>
						<span class="reward-targets-tier">Keystone Conqueror</span>
					</a>
				</li>
				<li>
					<a href="/rating-calculator?score=2000">
						<span class="tabular">2000</span>
						<span class="reward-targets-tier">Keystone Master</span>
					</a>
				</li>
				<li>
					<a href="/rating-calculator?score=2500">
						<span class="tabular">2500</span>
						<span class="reward-targets-tier">Keystone Hero</span>
					</a>
				</li>
				<li>
					<a href="/rating-calculator?score=3000">
						<span class="tabular">3000</span>
						<span class="reward-targets-tier">Keystone Legend</span>
					</a>
				</li>
				<li>
					<a href="/rating-calculator?score=3400">
						<span class="tabular">3400</span>
						<span class="reward-targets-tier">Keystone Myth</span>
					</a>
				</li>
			</ol>
		</nav>
	</div>

	<!-- RIGHT: readout + controls -->
	<aside class="readout">
		<div class="readout-sticky">
			<div class="score-block" class:pulse={totalPulse}>
				<div class="score-top">
					<div class="score-main">
						<div class="score-label-row">
							<span class="field-label">Total score</span>
						</div>
						<div class="score-value tabular">{totalScore.toFixed(0)}</div>
						{#if scoreDelta !== null && hasAnyRun}
							<div class="score-delta" class:positive={scoreDelta >= 0} class:negative={scoreDelta < 0}>
								{#if scoreDelta >= 0}
									Exceeds goal by +{scoreDelta}
								{:else}
									{scoreDelta} to goal
								{/if}
							</div>
						{/if}
					</div>

					{#if keyLevelSummary.length > 0}
						<div class="score-breakdown" aria-label="Keystone breakdown">
							{#each keyLevelSummary as item (`${item.level}-${item.count}`)}
								<div class="score-breakdown-row">
									<span class="score-breakdown-level tabular">+{item.level}</span>
									<span class="score-breakdown-bar" aria-hidden="true">
										{#each Array(item.count) as _, j (j)}
											<span class="score-breakdown-tick"></span>
										{/each}
									</span>
									<span class="score-breakdown-count tabular">x {item.count}</span>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<div class="target-block">
				<label for="scoreTarget" class="field-label">Target score</label>
				<input
					class="target-input tabular"
					type="text"
					inputmode="numeric"
					pattern="[0-9]*"
					id="scoreTarget"
					placeholder="e.g. 3200"
					value={scoreGoal ?? ''}
					oninput={(e) => {
						const val = parseInt((e.target as HTMLInputElement).value);
						scoreGoal = Number.isFinite(val) && val > 0 ? val : undefined;
						calculateScore();
						if (scoreUpdateTimeout) clearTimeout(scoreUpdateTimeout);
						scoreUpdateTimeout = setTimeout(() => {
							if (scoreGoal !== undefined) {
								updateUrlWithScore(scoreGoal);
							}
						}, 1000);
					}}
					aria-label="Target score"
				/>
				<p class="field-hint">
					{#if scoreGoal === undefined && !hasAnyRun && !hasCharacter}
						Set a target or import a character to begin.
					{:else if scoreGoal !== undefined}
						Plan auto-generated for the current dungeon pool.
					{:else}
						Edit rows to tune, or set a target to auto-plan.
					{/if}
				</p>
			</div>

			<div class="actions">
				<button
					type="button"
					class="btn btn-primary"
					onclick={() => ($apiPopup = !$apiPopup)}
					aria-label="Import character"
				>
					<UserRound class="h-4 w-4" />
					{hasCharacter ? 'Re-import character' : 'Import character'}
				</button>
				<button
					type="button"
					class="btn btn-ghost"
					onclick={(e) => shareRuns(e)}
					aria-label="Copy share link"
				>
					<LinkIcon class="h-4 w-4" />
					Copy share link
				</button>
				<button
					type="button"
					class="btn btn-quiet"
					onclick={() => resetRuns()}
					aria-label="Reset runs"
				>
					<RotateCcw class="h-4 w-4" />
					Reset
				</button>
			</div>

			<div class="character-panel">
				{#if $wowSummaryStore}
					<div class="character">
						{#each $wowSummaryStore.media.assets as asset}
							{#if asset.key === 'inset'}
								<img
									src={asset.value}
									alt={`${$wowSummaryStore.name} character portrait`}
									class="character-portrait"
								/>
							{/if}
						{/each}
						<div class="character-meta">
							<div class="character-name">{$wowSummaryStore.name}</div>
							<div class="character-sub">
								{$wowSummaryStore.race.name}
								{$wowSummaryStore.active_spec?.name}
								{$wowSummaryStore.character_class.name}
							</div>
							<div class="character-sub">
								{#if $wowSummaryStore.guild?.name}&lt;{$wowSummaryStore.guild.name}&gt;, {/if}{$wowSummaryStore.realm.name}
							</div>
						</div>
					</div>
				{:else}
					<RecentCharacters {loadCharacter} />
				{/if}
			</div>

			{#if showTooltip}
				<div
					class="copied-toast"
					style="top: {tooltipY - 30}px; left: {tooltipX}px;"
					role="status"
					aria-live="polite"
				>
					Link copied
				</div>
			{/if}
		</div>
	</aside>
</section>

<style>
	.workspace {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
		gap: clamp(24px, 3vw, 48px);
		align-items: start;
	}

	@media (max-width: 960px) {
		.workspace {
			grid-template-columns: 1fr;
		}

		.readout {
			order: -1;
		}
	}

	/* ---- Table column ---- */

	.table-column {
		min-width: 0;
		--level-col: 128px;
		--timer-col: 118px;
		--score-col: 72px;
	}

	.table-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 16px;
		padding-bottom: 12px;
		border-bottom: 1px solid hsl(var(--border));
		margin-bottom: 8px;
	}

	.col-label {
		font-family: var(--font-body);
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	.row-labels {
		display: grid;
		grid-template-columns: minmax(0, 1fr) var(--level-col) var(--timer-col) var(--score-col);
		align-items: center;
		gap: clamp(10px, 1.4vw, 16px);
		padding: 8px 0 4px;
		font-family: var(--font-body);
		font-size: 0.6875rem;
		font-weight: 500;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground));
	}

	.row-labels span:not(:first-child) {
		text-align: center;
	}

	.row-labels span:last-child {
		text-align: right;
	}

	.rows {
		display: flex;
		flex-direction: column;
	}

	.reward-targets {
		margin-top: clamp(12px, 2vw, 18px);
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.reward-targets-label {
		font-family: var(--font-body);
		font-size: 0.6875rem;
		font-weight: 500;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground));
	}

	.reward-targets-list {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.reward-targets-list a {
		display: inline-flex;
		align-items: baseline;
		gap: 8px;
		padding: 8px 14px;
		border: 1px solid hsl(var(--border));
		border-radius: 999px;
		font-family: var(--font-body);
		font-size: 0.875rem;
		color: hsl(var(--foreground));
		text-decoration: none;
		transition: border-color 120ms ease, background-color 120ms ease;
	}

	.reward-targets-list a:hover,
	.reward-targets-list a:focus-visible {
		border-color: hsl(var(--primary));
		background: hsl(var(--primary) / 0.08);
		outline: none;
	}

	.reward-targets-tier {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	.row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) var(--level-col) var(--timer-col) var(--score-col);
		align-items: center;
		gap: clamp(10px, 1.4vw, 16px);
		padding: 9px 0;
		border-bottom: 1px solid hsl(var(--border));
		transition: background-color 120ms cubic-bezier(0.25, 1, 0.5, 1),
			border-color 180ms cubic-bezier(0.25, 1, 0.5, 1);
	}

	.row.active {
		background-color: transparent;
	}

	.row.feedback {
		border-bottom-color: hsl(var(--primary) / 0.35);
	}

	.rows.list-pulse .row {
		border-bottom-color: hsl(var(--primary) / 0.22);
	}

	@media (max-width: 560px) {
		.table-head {
			align-items: flex-start;
			flex-direction: column;
			gap: 4px;
		}

		.row-labels {
			display: none;
		}

		.row {
			grid-template-columns: minmax(0, 1fr) auto;
			grid-template-areas:
				'dungeon score'
				'stepper stars';
			gap: 10px 16px;
			padding: 12px 0;
		}
		.row-dungeon {
			grid-area: dungeon;
		}
		.row-score {
			grid-area: score;
		}
		.row-stepper {
			grid-area: stepper;
		}
		.row-stars {
			grid-area: stars;
			justify-self: end;
		}
	}

	.row-dungeon :global(button) {
		width: 100%;
		justify-content: flex-start;
	}

	.row-stepper {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 2px;
		border: 1px solid hsl(var(--border));
		border-radius: 6px;
		background: hsl(var(--muted) / 0.28);
	}

	.step-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 38px;
		height: 38px;
		border: none;
		background: transparent;
		color: hsl(var(--muted-foreground));
		border-radius: 4px;
		cursor: pointer;
		transition: background-color 120ms cubic-bezier(0.25, 1, 0.5, 1),
			color 120ms cubic-bezier(0.25, 1, 0.5, 1);
	}

	.step-btn:hover:not(:disabled) {
		background: hsl(var(--muted));
		color: hsl(var(--foreground));
	}

	.step-btn:focus-visible {
		outline: 2px solid hsl(var(--ring));
		outline-offset: 2px;
	}

	.step-btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.step-value {
		min-width: 38px;
		text-align: center;
		font-family: var(--font-heading);
		font-size: 1.2rem;
		font-weight: 700;
		color: hsl(var(--foreground));
		font-variant-numeric: tabular-nums;
	}

	.row-stars {
		display: inline-flex;
		gap: 2px;
	}

	.star-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 38px;
		height: 38px;
		border: none;
		background: transparent;
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		border-radius: 4px;
		transition: color 120ms cubic-bezier(0.25, 1, 0.5, 1),
			transform 160ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	.star-btn:hover:not(:disabled) {
		color: hsl(var(--foreground));
	}

	.star-btn.filled {
		color: hsl(var(--primary));
	}

	.star-btn.filled :global(svg) {
		fill: hsl(var(--primary));
	}

	.star-btn:focus-visible {
		outline: 2px solid hsl(var(--ring));
		outline-offset: 2px;
	}

	.star-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.row-score {
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: 1.25rem;
		color: hsl(var(--foreground));
		text-align: right;
		font-variant-numeric: tabular-nums;
		transition: color 180ms cubic-bezier(0.25, 1, 0.5, 1);
	}

	.row:not(.active) .row-score {
		color: hsl(var(--muted-foreground));
		font-weight: 500;
	}

	/* ---- Readout column ---- */

	.readout {
		position: relative;
	}

	.readout-sticky {
		position: sticky;
		top: 24px;
		display: flex;
		flex-direction: column;
		gap: 20px;
		padding: clamp(20px, 2.5vw, 28px);
		border: 1px solid hsl(var(--border));
		border-radius: 8px;
		background: hsl(var(--card));
		transition: border-color 180ms cubic-bezier(0.25, 1, 0.5, 1);
	}

	.readout-sticky:focus-within {
		border-color: hsl(var(--primary) / 0.4);
	}

	@media (max-width: 960px) {
		.readout-sticky {
			position: static;
		}
	}

	.character-panel {
		padding-top: 16px;
		border-top: 1px solid hsl(var(--border));
	}

	.character {
		display: flex;
		gap: 12px;
		align-items: center;
	}

	.character-portrait {
		width: 56px;
		height: 56px;
		border-radius: 6px;
		object-fit: cover;
	}

	.character-meta {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.character-name {
		font-family: var(--font-heading);
		font-size: 1.125rem;
		font-weight: 700;
		color: hsl(var(--foreground));
		line-height: 1.1;
	}

	.character-sub {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.score-block {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.score-top {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 180px);
		align-items: start;
		gap: 12px;
	}

	.score-main {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}

	.score-label-row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 12px;
	}

	.field-label {
		font-family: var(--font-body);
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground));
	}

	.score-value {
		font-family: var(--font-heading);
		font-size: clamp(2.4rem, 4.5vw, 3rem);
		font-weight: 700;
		line-height: 1;
		letter-spacing: 0;
		color: hsl(var(--foreground));
		font-variant-numeric: tabular-nums;
		transform-origin: left center;
	}

	.score-delta {
		font-family: var(--font-body);
		font-size: 0.875rem;
		font-weight: 500;
		margin-top: 4px;
	}

	.score-delta.positive {
		color: hsl(var(--primary));
	}

	.score-delta.negative {
		color: hsl(var(--muted-foreground));
	}

	.score-block.pulse .score-value,
	.score-block.pulse .score-delta {
		color: hsl(var(--primary));
	}

	.score-breakdown {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding-top: 2px;
	}

	.score-breakdown-row {
		display: grid;
		grid-template-columns: 40px 1fr auto;
		align-items: center;
		gap: 10px;
	}

	.score-breakdown-level {
		font-family: var(--font-heading);
		font-size: 0.95rem;
		font-weight: 700;
		color: hsl(var(--foreground));
	}

	.score-breakdown-bar {
		display: inline-flex;
		gap: 3px;
		flex-wrap: wrap;
	}

	.score-breakdown-tick {
		display: inline-block;
		width: 14px;
		height: 7px;
		border-radius: 2px;
		background: hsl(var(--primary));
	}

	.score-breakdown-count {
		font-family: var(--font-body);
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		white-space: nowrap;
	}

	@media (max-width: 1180px) {
		.score-top {
			grid-template-columns: 1fr;
			gap: 10px;
		}
	}

	.target-block {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding-top: 16px;
		border-top: 1px solid hsl(var(--border));
	}

	.target-input {
		font-family: var(--font-heading);
		font-size: 1.75rem;
		font-weight: 700;
		line-height: 1;
		letter-spacing: 0;
		color: hsl(var(--foreground));
		background: transparent;
		border: none;
		border-bottom: 2px solid hsl(var(--border));
		min-height: 44px;
		padding: 6px 0;
		width: 100%;
		outline: none;
		transition: border-color 150ms cubic-bezier(0.25, 1, 0.5, 1);
		font-variant-numeric: tabular-nums;
	}

	.target-input:focus-visible {
		border-bottom-color: hsl(var(--primary));
	}

	.target-input::placeholder {
		color: hsl(var(--muted-foreground));
		font-weight: 500;
	}

	.field-hint {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		margin: 0;
		line-height: 1.4;
	}

	.actions {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding-top: 16px;
		border-top: 1px solid hsl(var(--border));
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		min-height: 44px;
		padding: 10px 14px;
		border-radius: 6px;
		font-family: var(--font-body);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		border: 1px solid transparent;
		transition: background-color 150ms cubic-bezier(0.25, 1, 0.5, 1),
			color 150ms cubic-bezier(0.25, 1, 0.5, 1),
			border-color 150ms cubic-bezier(0.25, 1, 0.5, 1);
	}

	.btn:focus-visible {
		outline: 2px solid hsl(var(--ring));
		outline-offset: 2px;
	}

	.btn-primary {
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
	}

	.btn-primary:hover {
		background: hsl(var(--primary) / 0.9);
	}

	.btn-ghost {
		background: transparent;
		color: hsl(var(--foreground));
		border-color: hsl(var(--border));
	}

	.btn-ghost:hover {
		border-color: hsl(var(--foreground));
	}

	.btn-quiet {
		background: transparent;
		color: hsl(var(--muted-foreground));
		padding: 8px 10px;
		font-size: 0.8125rem;
	}

	.btn-quiet:hover {
		color: hsl(var(--foreground));
	}

	.tabular {
		font-variant-numeric: tabular-nums;
	}

	.copied-toast {
		position: fixed;
		z-index: 50;
		padding: 6px 10px;
		border-radius: 4px;
		background: hsl(var(--foreground));
		color: hsl(var(--background));
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: 500;
		pointer-events: none;
		transform: translateX(-50%);
		animation: toast-in 180ms cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes toast-in {
		0% {
			transform: translate(-50%, 6px);
			opacity: 0;
		}
		100% {
			transform: translate(-50%, 0);
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.row,
		.readout-sticky,
		.step-btn,
		.star-btn,
		.btn,
		.target-input,
		.row-score,
		.copied-toast {
			transition: none;
			animation: none;
		}
	}
</style>
