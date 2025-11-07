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
	let scoreGoal: number;
	let totalScore: number;

	let showTooltip = false;
	let tooltipX = 0;
	let tooltipY = 0;

	import RecentCharacters from './recentCharacters.svelte';
	import { fetchRuns, fetchWowSummary } from '$lib/utils/characterData';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	function loadCharacter(char: { characterName: string; region: string; realm: string }) {
		fetchRuns(char.characterName, char.region, char.realm);
		fetchWowSummary(char.characterName, char.region, char.realm);
	}

	let isLoadingFromUrl = false;
	let lastUrlRuns = '';

	// Only load from URL when the runs parameter actually changes
	$: {
		const currentUrlRuns = $page.url.searchParams.get('runs') || '';
		if (currentUrlRuns !== lastUrlRuns && !isLoadingFromUrl) {
			lastUrlRuns = currentUrlRuns;
			if (currentUrlRuns) {
				loadFromUrl();
			}
		}
	}

	function loadFromUrl() {
		if (isLoadingFromUrl) return; // Prevent infinite loop

		try {
			const runsParam = $page.url.searchParams.get('runs');
			if (runsParam) {
				console.log('Loading from URL:', runsParam);
				isLoadingFromUrl = true;

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

							const level = parseInt(levelStr) || 0;
							const stars = parseInt(starsStr) || 1;

							if (level > 0 && stars >= 1 && stars <= 3) {
								// Apply to the next available run slot
								data.runs[appliedCount].dungeon = foundDungeon.value;
								data.runs[appliedCount].short_name = foundDungeon.short_name;
								data.runs[appliedCount].mythic_level = level;
								data.runs[appliedCount].num_keystone_upgrades = stars;
								data.runs[appliedCount].score = scoreFormula(level, stars);
								console.log(
									`Set slot ${appliedCount} to ${foundDungeon.short_name}: level ${level}, stars ${stars}`
								);
								appliedCount++;
							}

							i = shortNameEnd + 3; // Move past this entry
						} else {
							// If we can't find a valid dungeon name, move forward one character
							i++;
						}
					}
					return data;
				});

				console.log('Successfully loaded runs from URL');
				isLoadingFromUrl = false;
			}
		} catch (err) {
			console.error('Failed to load runs from URL:', err);
			isLoadingFromUrl = false;
		}
	}

	function updateUrlWithCurrentData() {
		if (isLoadingFromUrl || typeof window === 'undefined') return;

		try {
			// Create compact format without separators: ARAK152EDA121...
			let compactData = '';
			for (let i = 0; i < $dungeonData.runs.length; i++) {
				const run = $dungeonData.runs[i];

				// Find the dungeon that matches the current run's dungeon value
				const selectedDungeon = dungeons.find((d) => d.value === run.dungeon);

				// Only include runs with meaningful data (level > 0) and valid dungeon
				if (run.mythic_level > 0 && selectedDungeon) {
					// Format: shortname + level (2 digits) + stars (1 digit)
					const levelPadded = run.mythic_level.toString().padStart(2, '0');
					compactData += `${selectedDungeon.short_name}${levelPadded}${run.num_keystone_upgrades}`;
				}
			}

			const currentUrl = new URL(window.location.href);
			if (compactData.length > 0) {
				console.log('Updating URL with:', compactData);
				currentUrl.searchParams.set('runs', compactData);
				lastUrlRuns = compactData; // Update our tracking variable
			} else {
				currentUrl.searchParams.delete('runs');
				lastUrlRuns = ''; // Update our tracking variable
			}

			goto(currentUrl.pathname + currentUrl.search, { replaceState: true, noScroll: true });
		} catch (err) {
			console.error('Failed to update URL:', err);
		}
	}

	async function shareRuns(event: MouseEvent) {
		try {
			const shareableUrl = window.location.href;
			await navigator.clipboard.writeText(shareableUrl);
			console.log('Shareable URL copied to clipboard:', shareableUrl);
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
		updateUrlWithCurrentData();
	}

	function setStars(i: number, newStars: number) {
		$dungeonData.runs[i].num_keystone_upgrades = newStars + 1;
		recalcScore(i);
		updateUrlWithCurrentData();
	}

	function recalcScore(i: number) {
		let run = $dungeonData.runs[i];
		run.score = scoreFormula(run.mythic_level, run.num_keystone_upgrades);
	}

	$: totalScore = $dungeonData.runs.reduce((sum, r) => sum + r.score, 0);

	function resetRuns() {
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
		wowSummaryStore.set(null);
		updateUrlWithCurrentData();
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
		resetRuns();

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
		updateUrlWithCurrentData();
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
				on:input={calculateScore}
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
				Your current setup is automatically saved in the URL. Click "Share Current Setup" to copy
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
									updateUrlWithCurrentData();
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
