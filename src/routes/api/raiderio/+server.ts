import type { RequestHandler } from '@sveltejs/kit';
import { apiError, apiOk } from '$lib/server/apiResponses';
import { handleApiError } from '$lib/server/logger';
import { getOrRefreshBlizzardAccessToken } from '$lib/auth/blizzardTokenCache';

const MIN_CHARACTER_LEVEL = 90;

async function fetchCharacterLevel(
	region: string,
	realm: string,
	characterName: string
): Promise<number | null> {
	const regionLc = region.toLowerCase();
	const realmLc = realm.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
	const nameLc = characterName.toLowerCase();

	const token = await getOrRefreshBlizzardAccessToken();
	const summaryUrl = `https://${encodeURIComponent(regionLc)}.api.blizzard.com/profile/wow/character/${encodeURIComponent(realmLc)}/${encodeURIComponent(nameLc)}?namespace=profile-${encodeURIComponent(regionLc)}&locale=en_US`;
	const summaryResponse = await fetch(summaryUrl, {
		headers: { Authorization: `Bearer ${token}` }
	});

	if (!summaryResponse.ok) return null;

	const summaryData = (await summaryResponse.json()) as { level?: number };
	return typeof summaryData.level === 'number' ? summaryData.level : null;
}

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

	try {
		const level = await fetchCharacterLevel(region, realm, name);
		if (level === null) {
			return apiError('Unable to verify character level', 502);
		}
		if (level < MIN_CHARACTER_LEVEL) {
			return apiError('Only endgame characters can be imported', 422);
		}

		const response = await fetch(apiUrl);
		if (!response.ok) {
			return apiError('Failed to fetch data', response.status);
		}

		const rawData: RaiderIoResponse = await response.json();
		const bestRuns = rawData.mythic_plus_best_runs ?? [];
		bestRuns.sort((a, b) => b.score - a.score);

		return apiOk({ runs: bestRuns });
	} catch (error) {
		return handleApiError('api/raiderio', error, 'Failed to fetch data');
	}
};
