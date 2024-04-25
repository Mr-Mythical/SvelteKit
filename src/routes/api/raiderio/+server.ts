import type { RequestHandler } from '@sveltejs/kit';
import { Dungeons, type Run } from '$lib/models/dungeons';

interface RaiderIoResponse {
	name: string;
	race: string;
	class: string;
	region: string;
	realm: string;
	mythic_plus_best_runs: MythicPlusRun[];
	mythic_plus_alternate_runs: MythicPlusRun[];
}

interface MythicPlusRun {
	affixes: Affix[];
	dungeon: string;
	short_name: string;
	mythic_level: number;
	par_time_ms: number;
	num_keystone_upgrades: number;
	score: number;
}

interface Affix {
	name: string;
}

export const GET: RequestHandler = async ({ url }) => {
	const name = url.searchParams.get('name');
	const region = url.searchParams.get('region');
	const realm = url.searchParams.get('realm');

	const apiUrl = `https://raider.io/api/v1/characters/profile?region=${region}&realm=${realm}&name=${name}&fields=mythic_plus_best_runs%2Cmythic_plus_alternate_runs`;

	const response = await fetch(apiUrl);

	if (!response.ok) {
		return new Response(JSON.stringify({ error: 'Failed to fetch data' }), { status: 500 });
	}

	const rawData: RaiderIoResponse = await response.json();

	const bestRuns = rawData.mythic_plus_best_runs || [];
	const alternateRuns = rawData.mythic_plus_alternate_runs || [];

	const sortedCombinations = calculateAndSortCombinations(bestRuns, alternateRuns);

	const dungeons = new Dungeons();
	populateDungeons(dungeons, sortedCombinations);

	return new Response(JSON.stringify(dungeons));
};

function calculateAndSortCombinations(list1: MythicPlusRun[], list2: MythicPlusRun[]): Run[][] {
	if (!list1.length || !list2.length) {
		return list1.concat(list2).map((run) => {
		  return [ 
			{ 
			  ...run, 
			  score: run.score * 1.5 
			} 
		  ]; 
		}); 
	  }

	const fortifiedRuns: Run[] = [];
	const tyrannicalRuns: Run[] = [];

	for (const run of list1.concat(list2)) {
		if (run.affixes[0].name === 'Fortified') {
			fortifiedRuns.push(run);
		} else if (run.affixes[0].name === 'Tyrannical') {
			tyrannicalRuns.push(run);
		}
	}

	const combinations: Run[][] = [];
	for (let i = 0; i < fortifiedRuns.length; i++) {
		const matchingTyrannical = tyrannicalRuns.find(
			(run) => run.dungeon === fortifiedRuns[i].dungeon
		);
		if (matchingTyrannical) {
			const [higherScoreRun, lowerScoreRun] =
				fortifiedRuns[i].score > matchingTyrannical.score
					? [fortifiedRuns[i], matchingTyrannical]
					: [matchingTyrannical, fortifiedRuns[i]];

			combinations.push([
				{ ...higherScoreRun, score: higherScoreRun.score * 1.5 },
				{ ...lowerScoreRun, score: lowerScoreRun.score * 0.5 }
			]);
		}
	}

	combinations.sort((a, b) => {
		const scoreA = calculateCombinedScore(a);
		const scoreB = calculateCombinedScore(b);
		return scoreB - scoreA;
	});

	return combinations;
}

function populateDungeons(dungeons: Dungeons, sortedCombinations: Run[][]) {
	dungeons.fortified = [];
	dungeons.tyrannical = [];

	for (const combination of sortedCombinations) {
		dungeons.fortified.push(
			...combination.filter((run) => run.affixes[0].name === 'Fortified').map(roundScore)
		);
		dungeons.tyrannical.push(
			...combination.filter((run) => run.affixes[0].name === 'Tyrannical').map(roundScore)
		);
	}
}

function calculateCombinedScore(combination: Run[]): number {
	return combination[0].score + combination[1].score;
}

function roundScore(run: Run): Run {
	return {
		...run,
		score: Math.round(run.score * 10) / 10
	};
}
