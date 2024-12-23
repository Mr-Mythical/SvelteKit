<script lang="ts">
	import * as Table from '$lib/components/ui/table';
	import ArrowUp from 'lucide-svelte/icons/chevron-up';
	import ArrowDown from 'lucide-svelte/icons/chevron-down';
	import Star from 'lucide-svelte/icons/star';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button/';
	import { dungeonCount } from '$lib/models/dungeons';
	import { apiPopup } from '../stores.js';
	import { dungeonData } from '../stores.js';

	let edit = false;
	let scoreGoal: number;
	let totalScore: number;

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
		// example: compute score for run[i] based on your formula
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
	}

	function scoreFormula(keyLevel: number, star: number): number {
		if (keyLevel < 2) {
			return 0;
		}

		const affixBreakpoints: Record<number, number> = {
			4: 10, // +4 adds +10
			7: 15, // +7 adds +15
			10: 10, // +10 adds +10
			12: 15 // +12 adds +15
		};

		// Starting par score at +2
		let parScore = 165;

		for (let current = 2; current < keyLevel; current++) {
			// Normal increment per level
			parScore += 15;

			const nextLevel = current + 1;
			if (affixBreakpoints[nextLevel]) {
				parScore += affixBreakpoints[nextLevel];
			}
		}

		let timeAdjustment = 0;
		switch (star) {
			case 1:
				timeAdjustment = 0; // par or slower
				break;
			case 2:
				timeAdjustment = 7.5; // ~20% faster
				break;
			case 3:
				timeAdjustment = 15; // ~40% faster
				break;
		}

		return parScore + timeAdjustment;
	}

	function calculateScore() {
		resetRuns();

		let scorePerDungeon = scoreGoal / dungeonCount;
		let runScore;
		if (scoreGoal >= 1320) {
			for (let i = 0; i < 20; i++) {
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
					tempScore -= 165;
					$dungeonData.runs[i].mythic_level = 2;
					$dungeonData.runs[i].score += 165;
				}
			}
		}
	}
</script>

<div
	class="container mx-auto flex flex-col items-center justify-center p-0 md:px-16 lg:px-52 xl:px-80"
>
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

	<div class="flex items-center space-x-2">
		<Button class="w-48 text-lg" on:click={() => (edit = !edit)}>Manual Edit</Button>
		<Button class="w-48 text-lg" on:click={() => ($apiPopup = !$apiPopup)}>Import Character</Button>
	</div>

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
					<Table.Cell class="py-0 text-xl">{$dungeonData.runs[i].dungeon}</Table.Cell>
					<Table.Cell class="py-0 text-xl">
						<div class="grid grid-cols-1 items-center">
							<Button
								class="h-6 w-6 {edit ? '' : 'hidden'}"
								variant="ghost"
								size="icon"
								on:click={() => incrementKeyLevel(i)}><ArrowUp color="#E11D48" /></Button
							>
							<span
								>{$dungeonData.runs[i].mythic_level}
								{#each Array(3) as _, j}
									{#if j < $dungeonData.runs[i].num_keystone_upgrades}
										<Button
											class="h-5 w-5"
											variant="ghost"
											size="icon"
											on:click={() => setStars(i, j)}
											><Star color="#E11D48" fill="#E11D48" /></Button
										>
									{:else if edit}
										<Button
											class="h-5 w-5"
											variant="ghost"
											size="icon"
											on:click={() => setStars(i, j)}><Star color="#E11D48" fill="None" /></Button
										>
									{/if}
								{/each}</span
							>
							<Button
								class="h-6 w-6 {edit ? '' : 'hidden'}"
								variant="ghost"
								size="icon"
								on:click={() => decrementKeyLevel(i)}><ArrowDown color="#E11D48" /></Button
							>
						</div>
					</Table.Cell>

					<Table.Cell class="py-0 text-right text-xl"
						>{($dungeonData.runs[i].score ?? 0).toFixed(1)}</Table.Cell
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
