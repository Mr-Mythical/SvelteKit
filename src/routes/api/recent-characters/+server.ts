import type { RequestHandler } from './$types';
import {
	getUserRecents,
	addUserRecent,
	type CharacterRecentData
} from '$lib/db/userRecents.js';
import { apiError, apiOk } from '$lib/server/apiResponses';
import { requireSession } from '$lib/server/requireSession';
import { handleApiError } from '$lib/server/logger';
import { parseJsonBody, parseRecentCharacterBody } from '$lib/server/requestBody';
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

export const GET: RequestHandler = async ({ locals }) => {
	const auth = await requireSession(locals);
	if ('response' in auth) return auth.response;

	try {
		const recentCharacters = await getUserRecents<CharacterRecentData>(
			auth.session.user.id,
			'character',
			6
		);

		const characters = recentCharacters.map((recent) => ({
			region: recent.entityData.region,
			realm: recent.entityData.realm,
			characterName: recent.entityData.characterName
		}));

		return apiOk(characters);
	} catch (error) {
		return handleApiError('api/recent-characters', error, 'Failed to fetch recent characters');
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const auth = await requireSession(locals);
	if ('response' in auth) return auth.response;

	try {
		const parsed = await parseJsonBody(request, parseRecentCharacterBody);
		if (parsed instanceof Response) return parsed;
		const { characterName, realm, region } = parsed;

		const level = await fetchCharacterLevel(region, realm, characterName);
		if (level === null) {
			return apiError('Unable to verify character level', 502);
		}
		if (level < MIN_CHARACTER_LEVEL) {
			return apiError('Only endgame characters can be saved', 422);
		}

		await addUserRecent(
			auth.session.user.id,
			'character',
			`${characterName}-${realm}`,
			{
				characterName,
				realm,
				region
			},
			characterName,
			`${realm} - ${region}`,
			{
				class: null,
				level,
				timestamp: Date.now()
			}
		);

		return apiOk({ success: true });
	} catch (error) {
		return handleApiError('api/recent-characters', error, 'Failed to add character');
	}
};
