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

	let expImData = '';

	let showTooltip = false;
	let tooltipX = 0;
	let tooltipY = 0;

	import RecentCharacters from './recentCharacters.svelte';
	import { fetchRuns, fetchWowSummary } from '$lib/utils/characterData';

	function loadCharacter(char: { characterName: string; region: string; realm: string }) {
		fetchRuns(char.characterName, char.region, char.realm);
		fetchWowSummary(char.characterName, char.region, char.realm);
	}

	async function exportRuns(event: MouseEvent) {
		const json = JSON.stringify($dungeonData.runs);
		expImData = btoa(json);

		try {
			await navigator.clipboard.writeText(expImData);
			console.log('Export data copied to clipboard:', expImData);
			tooltipX = event.clientX;
			tooltipY = event.clientY;
			showTooltip = true;
			setTimeout(() => {
				showTooltip = false;
			}, 1000);
		} catch (err) {
			console.error('Failed to copy Export data:', err);
			alert('Failed to copy Export data.');
		}
	}

	function importRuns() {
		if (!expImData) {
			alert('No data to import');
			return;
		}
		try {
			const decodedJson = atob(expImData);
			const parsed = JSON.parse(decodedJson);
			$dungeonData.runs = parsed;
			console.log('Imported runs:', parsed);
		} catch (err) {
			console.error('Failed to import runs:', err);
			alert('Failed to import. Check your string.');
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
	}

	function decrementKeyLevel(i: number) {
		if ($dungeonData.runs[i].mythic_level === 2) {
			$dungeonData.runs[i].mythic_level = 0;
			recalcScore(i);
		} else if ($dungeonData.runs[i].mythic_level > 0) {
			$dungeonData.runs[i].mythic_level--;
			recalcScore(i);
		}
	}

	function setStars(i: number, newStars: number) {
		$dungeonData.runs[i].num_keystone_upgrades = newStars + 1;
		recalcScore(i);
	}

	function recalcScore(i: number) {
		let run = $dungeonData.runs[i];
		run.score = scoreFormula(run.mythic_level, run.num_keystone_upgrades);
	}

	$: totalScore = $dungeonData.runs.reduce((sum, r) => sum + r.score, 0);

	function resetRuns() {
		for (let i = 0; i < dungeonCount; i++) {
			$dungeonData.runs[i].mythic_level = 0;
			$dungeonData.runs[i].num_keystone_upgrades = 1;
			$dungeonData.runs[i].score = 0;
		}
		wowSummaryStore.set(null);
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
			<div class="mb-2 flex space-x-2">
				<Button class="w-full" on:click={(e) => exportRuns(e)} aria-label="Export Runs"
					>Export Runs</Button
				>
				<Button class="w-full" on:click={importRuns} aria-label="Import Runs">Import Runs</Button>
			</div>
			<Label class="mb-2 block font-semibold" for="dataInput">Export/Import Data:</Label>
			<Input
				class="w-full"
				id="dataInput"
				placeholder="Paste or view Base64 data..."
				bind:value={expImData}
			/>
			<small class="mt-1 block text-sm text-muted-foreground">
				Click Export to copy data. Paste data here, then click Import to load.
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
