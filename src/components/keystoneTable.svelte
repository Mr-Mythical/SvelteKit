<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import ArrowUp from 'lucide-svelte/icons/chevron-up';
	import ArrowDown from 'lucide-svelte/icons/chevron-down';
	import Star from 'lucide-svelte/icons/star';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button/';
	import { Dungeons, type Run, dungeonCount } from '$lib/models/dungeons';

	let edit = false;
	let scoreGoal: number;
	let totalScore: number;

	$: totalScore =
		dungeons.fortified.map((run) => run.score).reduce((sum, val) => sum + val, 0) +
		dungeons.tyrannical.map((run) => run.score).reduce((sum, val) => sum + val, 0);

	const dungeons = new Dungeons();

	function resetRuns() {
		for (var i = 0; i < dungeonCount; i++) {
			let num = i + 1;
			dungeons.fortified[i].dungeon = num.toString();
			dungeons.fortified[i].score = 0;
			dungeons.fortified[i].mythicLevel = 0;
			dungeons.fortified[i].numKeystoneUpgrades = 1;
			dungeons.tyrannical[i].dungeon = num.toString();
			dungeons.tyrannical[i].score = 0;
			dungeons.tyrannical[i].mythicLevel = 0;
			dungeons.tyrannical[i].numKeystoneUpgrades = 1;
		}
	}

	function scoreFormula(keyLevel: number, star: number = 1): number {
		var time = 20 * (star - 1);

		let baseScore: number;

		if (keyLevel < 2) {
			return 0;
		} else if (keyLevel < 7) {
			baseScore = (6 + keyLevel) * 5 + (time / 40) * 5;
		} else if (keyLevel < 11) {
			baseScore = (8 + keyLevel) * 5 + (time / 40) * 5;
		} else if (keyLevel < 14) {
			baseScore = (keyLevel - 10) * 7 + 90 + (time / 40) * 5;
		} else {
			baseScore = (keyLevel - 10) * 7 + 100 + (time / 40) * 5;
		}
		return Math.round(baseScore * 10) / 10;
	}

	function calculateScore() {
		resetRuns();

		let scorePerDungeon = scoreGoal / dungeonCount;
		let bestAndAlternate;
		if (scoreGoal >= 640) {
			for (let i = 0; i < 40; i++) {
				bestAndAlternate = Math.round(scoreFormula(i) * 1.5 + scoreFormula(i) * 0.5);

				if (scorePerDungeon === bestAndAlternate) {
					for (let j = 0; j < dungeonCount; j++) {
						dungeons.fortified[j].mythicLevel = i;
						dungeons.tyrannical[j].mythicLevel = i;

						dungeons.fortified[j].score = bestAndAlternate / 2;
						dungeons.tyrannical[j].score = bestAndAlternate / 2;
					}
					break;
				} else if (bestAndAlternate > scorePerDungeon) {
					bestAndAlternate = Math.round(scoreFormula(i - 1) * 1.5 + scoreFormula(i - 1) * 0.5);
					let scoreDifference = Math.round(scoreGoal - bestAndAlternate * dungeonCount);

					for (let j = 0; j < dungeonCount; j++) {
						if (scoreDifference > 0) {
							scoreDifference -= scoreFormula(i) * 1.5 - scoreFormula(i - 1) * 1.5;
							dungeons.fortified[j].mythicLevel = i;
							dungeons.fortified[j].score = scoreFormula(i) * 1.5;
						} else {
							dungeons.fortified[j].mythicLevel = i - 1;
							dungeons.fortified[j].score = scoreFormula(i - 1) * 1.5;
						}
					}
					for (let j = 0; j < dungeonCount; j++) {
						if (scoreDifference > 0) {
							scoreDifference -= scoreFormula(i) * 0.5 - scoreFormula(i - 1) * 0.5;
							dungeons.tyrannical[j].mythicLevel = i;
							dungeons.tyrannical[j].score = scoreFormula(i) * 0.5;
						} else if (
							scoreDifference / (scoreFormula(i) * 0.5 - scoreFormula(i - 1) * 0.5) <=
							j - dungeonCount
						) {
							if (i != 3) {
								scoreDifference += scoreFormula(i, 0) * 0.5 - scoreFormula(i - 1) * 0.5;
								dungeons.tyrannical[j].mythicLevel = i - 2;
								dungeons.tyrannical[j].score = scoreFormula(i - 2) * 0.5;
							} else {
								dungeons.tyrannical[j].mythicLevel = i - 1;
								dungeons.tyrannical[j].score = scoreFormula(i - 1) * 0.5;
							}
						} else {
							dungeons.tyrannical[j].mythicLevel = i - 1;
							dungeons.tyrannical[j].score = scoreFormula(i - 1) * 0.5;
						}
					}
					break;
				}
			}
		} else {
			let tempScore = scoreGoal;
			for (let i = 0; i < dungeonCount; i++) {
				if (tempScore > 0) {
					tempScore -= 60;
					dungeons.fortified[i].mythicLevel = 2;
					dungeons.fortified[i].score += 60;
				}
			}
			for (let i = 0; i < dungeonCount; i++) {
				if (tempScore > 0) {
					tempScore -= 20;
					dungeons.tyrannical[i].mythicLevel = 2;
					dungeons.tyrannical[i].score += 20;
				}
			}
		}
	}

	function adjustScores(currentDungeon: Run, otherDungeon: Run) {
		let currentScore = scoreFormula(currentDungeon.mythicLevel, currentDungeon.numKeystoneUpgrades);
		let otherScore = scoreFormula(otherDungeon.mythicLevel, otherDungeon.numKeystoneUpgrades);

		if (
			currentDungeon.mythicLevel > otherDungeon.mythicLevel ||
			(currentDungeon.mythicLevel === otherDungeon.mythicLevel &&
				currentDungeon.numKeystoneUpgrades >= otherDungeon.numKeystoneUpgrades)
		) {
			currentDungeon.score = currentScore * 1.5;
			otherDungeon.score = otherScore * 0.5;
		} else {
			currentDungeon.score = currentScore * 0.5;
			otherDungeon.score = otherScore * 1.5;
		}
	}

	function editKeyLevel(dungeon: number, affix: string, direction: string) {
		let currentDungeon = dungeons[affix]![dungeon];
		var otherAffix = affix === 'fortified' ? 'tyrannical' : 'fortified';
		let otherDungeon = dungeons[otherAffix]![dungeon];

		if (currentDungeon.mythicLevel < 2 && direction === 'up') {
			currentDungeon.mythicLevel = 2;
		} else if (currentDungeon.mythicLevel === 2 && direction === 'down') {
			currentDungeon.mythicLevel = 0;
			currentDungeon.score = 0;
		} else if (currentDungeon.mythicLevel >= 2) {
			if (direction === 'up') {
				currentDungeon.mythicLevel++;
			} else {
				currentDungeon.mythicLevel--;
			}
		}

		adjustScores(currentDungeon, otherDungeon);

		dungeons[affix]![dungeon] = currentDungeon;
		dungeons[otherAffix]![dungeon] = otherDungeon;
	}

	function editStars(dungeon: number, affix: string, star: number) {
		var currentDungeon = dungeons[affix]![dungeon];
		var otherAffix = affix === 'fortified' ? 'tyrannical' : 'fortified';
		var otherDungeon = dungeons[otherAffix]![dungeon];
		currentDungeon.numKeystoneUpgrades = star + 1;

		adjustScores(currentDungeon, otherDungeon);

		dungeons[affix]![dungeon] = currentDungeon;
		dungeons[otherAffix]![dungeon] = otherDungeon;
	}
</script>

<div class="container mx-auto flex flex-col items-center justify-center p-0 md:px-16 lg:px-52">
	<div class="mb-2 mt-6 flex flex-col items-center md:flex-row">
		<Label class="mr-2 text-lg md:mb-0 md:mr-2" for="scoreTarget">Score Target:</Label>
		<Input
			class="w-48 text-lg"
			type="number"
			id="scoreTarget"
			placeholder="Score Target"
			bind:value={scoreGoal}
			min="0"
			on:input={calculateScore}
		/>
	</div>

	<Button class="my-2 w-48 text-lg" on:click={() => (edit = !edit)}>Manual Edit</Button>
	<Button class="my-2 w-48 text-lg">Import Character</Button>

	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head class="text-semibold w-2/5 text-xl">Keystone</Table.Head>
				<Table.Head class="text-semibold w-1/4 text-xl">Fortified</Table.Head>
				<Table.Head class="text-semibold w-1/4 text-xl">Tyrannical</Table.Head>
				<Table.Head class="w-1/10 text-semibold text-right text-xl">Score</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each Array(dungeonCount) as _, i}
				<Table.Row class="h-12">
					<Table.Cell class="py-0 text-xl"
						>{dungeons.fortified[i].dungeon}</Table.Cell
					>
					<Table.Cell class="py-0 text-xl">
						<div class="grid grid-cols-1 items-center">
							<Button
								class="h-6 w-6 {edit ? '' : 'hidden'}"
								variant="ghost"
								size="icon"
								on:click={() => editKeyLevel(i, 'fortified', 'up')}
								><ArrowUp color="#E11D48" /></Button
							>
							<span
								>{dungeons.fortified[i].mythicLevel}
								{#each Array(3) as _, j}
									{#if j < dungeons.fortified[i].numKeystoneUpgrades}
										<Button
											class="h-5 w-5"
											variant="ghost"
											size="icon"
											on:click={() => editStars(i, 'fortified', j)}
											><Star color="#E11D48" fill="#E11D48" /></Button
										>
									{:else if edit}
										<Button
											class="h-5 w-5"
											variant="ghost"
											size="icon"
											on:click={() => editStars(i, 'fortified', j)}
											><Star color="#E11D48" fill="None" /></Button
										>
									{/if}
								{/each}</span
							>
							<Button
								class="h-6 w-6 {edit ? '' : 'hidden'}"
								variant="ghost"
								size="icon"
								on:click={() => editKeyLevel(i, 'fortified', 'down')}
								><ArrowDown color="#E11D48" /></Button
							>
						</div>
					</Table.Cell>

					<Table.Cell class="py-0 text-xl">
						<div class="grid grid-cols-1 items-center">
							<Button
								class="h-6 w-6 {edit ? '' : 'hidden'}"
								variant="ghost"
								size="icon"
								on:click={() => editKeyLevel(i, 'tyrannical', 'up')}
								><ArrowUp color="#E11D48" /></Button
							>
							<span
								>{dungeons.tyrannical[i].mythicLevel}
								{#each Array(3) as _, j}
									{#if j < dungeons.tyrannical[i].numKeystoneUpgrades}
										<Button
											class="h-5 w-5"
											variant="ghost"
											size="icon"
											on:click={() => editStars(i, 'tyrannical', j)}
											><Star color="#E11D48" fill="#E11D48" /></Button
										>
									{:else if edit}
										<Button
											class="h-5 w-5"
											variant="ghost"
											size="icon"
											on:click={() => editStars(i, 'tyrannical', j)}
											><Star color="#E11D48" fill="None" /></Button
										>
									{/if}
								{/each}</span
							>
							<Button
								class="h-6 w-6 {edit ? '' : 'hidden'}"
								variant="ghost"
								size="icon"
								on:click={() => editKeyLevel(i, 'tyrannical', 'down')}
								><ArrowDown color="#E11D48" /></Button
							>
						</div></Table.Cell
					>
					<Table.Cell class="py-0 text-right text-xl"
						>{((dungeons.fortified[i].score) ?? 0) +
							((dungeons.tyrannical[i].score) ?? 0)}</Table.Cell
					>
				</Table.Row>
			{/each}
			<Table.Row>
				<Table.Cell colspan={4} class="py-2 font-semibold text-right text-xl"> Total Score: {totalScore}
				</Table.Cell> 
			</Table.Row>
		</Table.Body>
	</Table.Root>
</div>
