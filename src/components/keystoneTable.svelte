<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import ArrowUp from 'lucide-svelte/icons/chevron-up';
	import ArrowDown from 'lucide-svelte/icons/chevron-down';
	import Star from 'lucide-svelte/icons/star';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button/';

	let edit = false;
	let scoreGoal: number;
	const dungeonCount = 8;

	interface Run {
		dungeon: string;
		mythicLevel: number;
		clearTime: number;
		parTime: number;
		numKeystoneUpgrades: number;
		score: number;
	}

	interface Dungeons {
		fortified: Run[] | null;
		tyrannical: Run[] | null;
	}

	class Dungeons {
		constructor() {
			this.fortified = [];
			this.tyrannical = [];

			for (let i = 0; i < dungeonCount; i++) {
				this.fortified.push({
					dungeon: String(i + 1),
					mythicLevel: 0,
					clearTime: 0,
					parTime: 0,
					numKeystoneUpgrades: 1,
					score: 0
				});

				this.tyrannical.push({
					dungeon: String(i + 1),
					mythicLevel: 0,
					clearTime: 0,
					parTime: 0,
					numKeystoneUpgrades: 1,
					score: 0
				});
			}
		}
	}

	const dungeons = new Dungeons();

	function resetRuns() {
		for (var i = 0; i < dungeonCount; i++) {
			let num = i + 1;
			dungeons.fortified![i].dungeon = num.toString();
			dungeons.fortified![i].score = 0;
			dungeons.fortified![i].mythicLevel = 0;
			dungeons.fortified![i].numKeystoneUpgrades = 1;
			dungeons.tyrannical![i].dungeon = num.toString();
			dungeons.tyrannical![i].score = 0;
			dungeons.tyrannical![i].mythicLevel = 0;
			dungeons.tyrannical![i].numKeystoneUpgrades = 1;
		}
	}

	function scoreFormula(keyLevel: number, star: number): number {
		star *= 20;

		let baseScore: number;

		if (keyLevel < 2) {
			return 0;
		} else if (keyLevel < 7) {
			baseScore = (6 + keyLevel) * 5 + (star / 40) * 5;
		} else if (keyLevel < 11) {
			baseScore = (8 + keyLevel) * 5 + (star / 40) * 5;
		} else if (keyLevel < 14) {
			baseScore = (keyLevel - 10) * 7 + 90 + (star / 40) * 5;
		} else {
			baseScore = (keyLevel - 10) * 7 + 100 + (star / 40) * 5;
		}
		return Math.round(baseScore * 10) / 10;
	}

	function calculateScore() {
		resetRuns();

		let scorePerDungeon = scoreGoal / dungeonCount;
		let bestAndAlternate;
		if (scoreGoal >= 640) {
			for (let i = 0; i < 40; i++) {
				bestAndAlternate = Math.round(scoreFormula(i, 0) * 1.5 + scoreFormula(i, 0) * 0.5);

				if (scorePerDungeon === bestAndAlternate) {
					for (let j = 0; j < dungeonCount; j++) {
						dungeons.fortified![j].mythicLevel = i;
						dungeons.tyrannical![j].mythicLevel = i;

						dungeons.fortified![j].score = bestAndAlternate / 2;
						dungeons.tyrannical![j].score = bestAndAlternate / 2;
					}
					break;
				} else if (bestAndAlternate > scorePerDungeon) {
					bestAndAlternate = Math.round(
						scoreFormula(i - 1, 0) * 1.5 + scoreFormula(i - 1, 0) * 0.5
					);
					let scoreDifference = Math.round(scoreGoal - bestAndAlternate * dungeonCount);

					for (let j = 0; j < dungeonCount; j++) {
						if (scoreDifference > 0) {
							scoreDifference -= scoreFormula(i, 0) * 1.5 - scoreFormula(i - 1, 0) * 1.5;
							dungeons.fortified![j].mythicLevel = i;
							dungeons.fortified![j].score = scoreFormula(i, 0) * 1.5;
						} else {
							dungeons.fortified![j].mythicLevel = i - 1;
							dungeons.fortified![j].score = scoreFormula(i - 1, 0) * 1.5;
						}
					}
					for (let j = 0; j < dungeonCount; j++) {
						if (scoreDifference > 0) {
							scoreDifference -= scoreFormula(i, 0) * 0.5 - scoreFormula(i - 1, 0) * 0.5;
							dungeons.tyrannical![j].mythicLevel = i;
							dungeons.tyrannical![j].score = scoreFormula(i, 0) * 0.5;
						} else if (
							scoreDifference / (scoreFormula(i, 0) * 0.5 - scoreFormula(i - 1, 0) * 0.5) <=
							j - dungeonCount
						) {
							if (i != 3) {
								scoreDifference += scoreFormula(i, 0) * 0.5 - scoreFormula(i - 1, 0) * 0.5;
								dungeons.tyrannical![j].mythicLevel = i - 2;
								dungeons.tyrannical![j].score = scoreFormula(i - 2, 0) * 0.5;
							} else {
								dungeons.tyrannical![j].mythicLevel = i - 1;
								dungeons.tyrannical![j].score = scoreFormula(i - 1, 0) * 0.5;
							}
						} else {
							dungeons.tyrannical![j].mythicLevel = i - 1;
							dungeons.tyrannical![j].score = scoreFormula(i - 1, 0) * 0.5;
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
					dungeons.fortified![i].mythicLevel = 2;
					dungeons.fortified![i].score += 60;
				}
			}
			for (let i = 0; i < dungeonCount; i++) {
				if (tempScore > 0) {
					tempScore -= 20;
					dungeons.tyrannical![i].mythicLevel = 2;
					dungeons.tyrannical![i].score += 20;
				}
			}
		}
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
				<Table.Row class="h-14">
					<Table.Cell class="py-0 text-xl">{i + 1}</Table.Cell>
					<Table.Cell class="py-0 text-xl">
						<div class="grid grid-cols-1 items-center">
							<Button class="h-6 w-6 {edit ? '' : 'hidden'}" variant="ghost" size="icon"
								><ArrowUp color="#E11D48" /></Button
							>
							<span
								>{dungeons.fortified && dungeons.fortified[i]?.mythicLevel}
								{#each Array(3) as _, i}
									<Button class="h-5 w-5 {edit ? '' : 'hidden'}" variant="ghost" size="icon"
										><Star color="#E11D48" /></Button
									>
								{/each}</span
							>
							<Button class="h-6 w-6 {edit ? '' : 'hidden'}" variant="ghost" size="icon"
								><ArrowDown color="#E11D48" /></Button
							>
						</div>
					</Table.Cell>

					<Table.Cell class="py-0 text-xl">
						<div class="grid grid-cols-1 items-center">
							<Button class="h-6 w-6 {edit ? '' : 'hidden'}" variant="ghost" size="icon"
								><ArrowUp color="#E11D48" /></Button
							>
							<span
								>{dungeons.tyrannical && dungeons.tyrannical[i]?.mythicLevel}
								{#each Array(3) as _, i}
									<Button class="h-5 w-5 {edit ? '' : 'hidden'}" variant="ghost" size="icon"
										><Star color="#E11D48" /></Button
									>
								{/each}</span
							>
							<Button class="h-6 w-6 {edit ? '' : 'hidden'}" variant="ghost" size="icon"
								><ArrowDown color="#E11D48" /></Button
							>
						</div></Table.Cell
					>
					<Table.Cell class="py-0 text-right text-xl"
						>{((dungeons.fortified && dungeons.fortified[i]?.score) ?? 0) +
							((dungeons.tyrannical && dungeons.tyrannical[i]?.score) ?? 0)}</Table.Cell
					>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
