<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import ArrowUp from 'lucide-svelte/icons/chevron-up';
	import ArrowDown from 'lucide-svelte/icons/chevron-down';
	import Star from 'lucide-svelte/icons/star';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button/';
	import { Dungeons, type Run, dungeonCount } from '$lib/models/dungeons';
	import { apiPopup } from '../stores.js';
	import { dungeonData } from '../stores.js';

	let edit = false;
	let scoreGoal: number;
	let totalScore: number;

	$: totalScore =
		$dungeonData.fortified.map((run) => run.score).reduce((sum, val) => sum + val, 0) +
		$dungeonData.tyrannical.map((run) => run.score).reduce((sum, val) => sum + val, 0);

	function resetRuns() {
		for (var i = 0; i < dungeonCount; i++) {
			let num = i + 1;
			$dungeonData.fortified[i].dungeon = num.toString();
			$dungeonData.fortified[i].score = 0;
			$dungeonData.fortified[i].mythic_level = 0;
			$dungeonData.fortified[i].num_keystone_upgrades = 1;
			$dungeonData.tyrannical[i].dungeon = num.toString();
			$dungeonData.tyrannical[i].score = 0;
			$dungeonData.tyrannical[i].mythic_level = 0;
			$dungeonData.tyrannical[i].num_keystone_upgrades = 1;
		}
	}

	function scoreFormula(keyLevel: number, star: number = 1): number {
		var time = 20 * (star - 1);

		let baseScore: number;

		if (keyLevel < 2) {
			return 0;
		} else if (keyLevel < 5) {
			baseScore = 80 + keyLevel * 7 + (time / 40) * 5;
		} else if (keyLevel < 10) {
			baseScore = 90 + keyLevel * 7 + (time / 40) * 5;
		} else {
			baseScore = 100 + keyLevel * 7 + (time / 40) * 5;
		}
		return Math.round(baseScore * 10) / 10;
	}

	function calculateScore() {
		resetRuns();

		let scorePerDungeon = scoreGoal / dungeonCount;
		let bestAndAlternate;
		if (scoreGoal >= 1504) {
			for (let i = 0; i < 20; i++) {
				bestAndAlternate = Math.round(scoreFormula(i) * 1.5 + scoreFormula(i) * 0.5);

				if (scorePerDungeon === bestAndAlternate) {
					for (let j = 0; j < dungeonCount; j++) {
						$dungeonData.fortified[j].mythic_level = i;
						$dungeonData.tyrannical[j].mythic_level = i;

						$dungeonData.fortified[j].score = bestAndAlternate / 2;
						$dungeonData.tyrannical[j].score = bestAndAlternate / 2;
					}
					break;
				} else if (bestAndAlternate > scorePerDungeon) {
					bestAndAlternate = Math.round(scoreFormula(i - 1) * 1.5 + scoreFormula(i - 1) * 0.5);
					let scoreDifference = Math.round(scoreGoal - bestAndAlternate * dungeonCount);

					for (let j = 0; j < dungeonCount; j++) {
						if (scoreDifference > 0) {
							scoreDifference -= scoreFormula(i) * 1.5 - scoreFormula(i - 1) * 1.5;
							$dungeonData.fortified[j].mythic_level = i;
							$dungeonData.fortified[j].score = scoreFormula(i) * 1.5;
						} else {
							$dungeonData.fortified[j].mythic_level = i - 1;
							$dungeonData.fortified[j].score = scoreFormula(i - 1) * 1.5;
						}
					}
					for (let j = 0; j < dungeonCount; j++) {
						if (scoreDifference > 0) {
							scoreDifference -= scoreFormula(i) * 0.5 - scoreFormula(i - 1) * 0.5;
							$dungeonData.tyrannical[j].mythic_level = i;
							$dungeonData.tyrannical[j].score = scoreFormula(i) * 0.5;
						} else if (
							scoreDifference / (scoreFormula(i) * 0.5 - scoreFormula(i - 1) * 0.5) <=
							j - dungeonCount
						) {
							if (i != 3) {
								scoreDifference += scoreFormula(i, 0) * 0.5 - scoreFormula(i - 1) * 0.5;
								$dungeonData.tyrannical[j].mythic_level = i - 2;
								$dungeonData.tyrannical[j].score = scoreFormula(i - 2) * 0.5;
							} else {
								$dungeonData.tyrannical[j].mythic_level = i - 1;
								$dungeonData.tyrannical[j].score = scoreFormula(i - 1) * 0.5;
							}
						} else {
							$dungeonData.tyrannical[j].mythic_level = i - 1;
							$dungeonData.tyrannical[j].score = scoreFormula(i - 1) * 0.5;
						}
					}
					break;
				}
			}
		} else {
			let tempScore = scoreGoal;
			for (let i = 0; i < dungeonCount; i++) {
				if (tempScore > 0) {
					tempScore -= 141;
					$dungeonData.fortified[i].mythic_level = 2;
					$dungeonData.fortified[i].score += 141;
				}
			}
			for (let i = 0; i < dungeonCount; i++) {
				if (tempScore > 0) {
					tempScore -= 47;
					$dungeonData.tyrannical[i].mythic_level = 2;
					$dungeonData.tyrannical[i].score += 47;
				}
			}
		}
	}

	function adjustScores(currentDungeon: Run, otherDungeon: Run) {
		let currentScore = scoreFormula(
			currentDungeon.mythic_level,
			currentDungeon.num_keystone_upgrades
		);
		let otherScore = scoreFormula(otherDungeon.mythic_level, otherDungeon.num_keystone_upgrades);

		if (
			currentDungeon.mythic_level > otherDungeon.mythic_level ||
			(currentDungeon.mythic_level === otherDungeon.mythic_level &&
				currentDungeon.num_keystone_upgrades >= otherDungeon.num_keystone_upgrades)
		) {
			currentDungeon.score = currentScore * 1.5;
			otherDungeon.score = otherScore * 0.5;
		} else {
			currentDungeon.score = currentScore * 0.5;
			otherDungeon.score = otherScore * 1.5;
		}
	}

	function editKeyLevel(dungeon: number, affix: string, direction: string) {
		let currentDungeon = $dungeonData[affix]![dungeon];
		var otherAffix = affix === 'fortified' ? 'tyrannical' : 'fortified';
		let otherDungeon = $dungeonData[otherAffix]![dungeon];

		if (currentDungeon.mythic_level < 2 && direction === 'up') {
			currentDungeon.mythic_level = 2;
		} else if (currentDungeon.mythic_level === 2 && direction === 'down') {
			currentDungeon.mythic_level = 0;
			currentDungeon.score = 0;
		} else if (currentDungeon.mythic_level >= 2) {
			if (direction === 'up') {
				currentDungeon.mythic_level++;
			} else {
				currentDungeon.mythic_level--;
			}
		}

		adjustScores(currentDungeon, otherDungeon);

		$dungeonData[affix]![dungeon] = currentDungeon;
		$dungeonData[otherAffix]![dungeon] = otherDungeon;
	}

	function editStars(dungeon: number, affix: string, star: number) {
		var currentDungeon = $dungeonData[affix]![dungeon];
		var otherAffix = affix === 'fortified' ? 'tyrannical' : 'fortified';
		var otherDungeon = $dungeonData[otherAffix]![dungeon];
		currentDungeon.num_keystone_upgrades = star + 1;

		adjustScores(currentDungeon, otherDungeon);

		$dungeonData[affix]![dungeon] = currentDungeon;
		$dungeonData[otherAffix]![dungeon] = otherDungeon;
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

	<Button class="my-2 w-48 text-lg" on:click={() => ($apiPopup = !$apiPopup)}
		>Import Character</Button
	>

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
					<Table.Cell class="py-0 text-xl">{$dungeonData.fortified[i].dungeon}</Table.Cell>
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
								>{$dungeonData.fortified[i].mythic_level}
								{#each Array(3) as _, j}
									{#if j < $dungeonData.fortified[i].num_keystone_upgrades}
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
								>{$dungeonData.tyrannical[i].mythic_level}
								{#each Array(3) as _, j}
									{#if j < $dungeonData.tyrannical[i].num_keystone_upgrades}
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
						>{(
							($dungeonData.fortified[i].score ?? 0) + ($dungeonData.tyrannical[i].score ?? 0)
						).toFixed(1)}</Table.Cell
					>
				</Table.Row>
			{/each}
			<Table.Row>
				<Table.Cell colspan={4} class="py-2 text-right text-xl font-semibold">
					Total Score: {totalScore.toFixed(1)}
				</Table.Cell>
			</Table.Row>
		</Table.Body>
	</Table.Root>
</div>
