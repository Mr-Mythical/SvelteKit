import type { RequestHandler } from '@sveltejs/kit';

interface RaiderIoResponse {
	name: string;
	region: string;
	realm: string;
	mythic_plus_best_runs?: RaiderIoRun[];
}

interface RaiderIoRun {
	dungeon: string;
	short_name: string;
	mythic_level: number;
	par_time_ms: number;
	num_keystone_upgrades: number;
	score: number;
	affixes: Affix[];
}

interface Affix {
	id: number;
	name: string;
}

export const GET: RequestHandler = async ({ url }) => {
	const name = url.searchParams.get('name');
	const region = url.searchParams.get('region');
	const realm = url.searchParams.get('realm');

	if (!name || !region || !realm) {
		return new Response(JSON.stringify({ error: 'Missing parameters' }), {
			status: 400
		});
	}

	const apiUrl = `https://raider.io/api/v1/characters/profile?region=${region}&realm=${realm}&name=${name}&fields=mythic_plus_best_runs`;

	const response = await fetch(apiUrl);
	if (!response.ok) {
		return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
			status: response.status
		});
	}

	const rawData: RaiderIoResponse = await response.json();
	const bestRuns = rawData.mythic_plus_best_runs ?? [];

	bestRuns.sort((a, b) => b.score - a.score);

	return new Response(JSON.stringify({ runs: bestRuns }), { status: 200 });
};
