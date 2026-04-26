import type { RequestHandler } from '@sveltejs/kit';
import { apiError, apiOk } from '$lib/server/apiResponses';

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
		return apiError('Missing parameters', 400);
	}

	const apiUrl =
		`https://raider.io/api/v1/characters/profile?region=${encodeURIComponent(region)}` +
		`&realm=${encodeURIComponent(realm)}` +
		`&name=${encodeURIComponent(name)}` +
		`&fields=mythic_plus_best_runs`;

	const response = await fetch(apiUrl);
	if (!response.ok) {
		return apiError('Failed to fetch data', response.status);
	}

	const rawData: RaiderIoResponse = await response.json();
	const bestRuns = rawData.mythic_plus_best_runs ?? [];
	bestRuns.sort((a, b) => b.score - a.score);

	return apiOk({ runs: bestRuns });
};
