import type { RequestHandler } from '@sveltejs/kit';
import { getOrRefreshBlizzardAccessToken } from '$lib/auth/blizzardTokenCache';
import type { BlizzardCharacterFull } from '$lib/types/blizzardFull';
import { apiError, apiOk } from '$lib/server/apiResponses';
import { logServerError } from '$lib/server/logger';

export const GET: RequestHandler = async ({ url }) => {
	const name = url.searchParams.get('name');
	const region = url.searchParams.get('region');
	const realm = url.searchParams.get('realm');

	if (!name || !region || !realm) {
		return apiError('Missing parameters', 400);
	}

	// Blizzard profile API requires lowercased name and realm slug.
	const regionLc = region.toLowerCase();
	const realmLc = realm.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
	const nameLc = name.toLowerCase();

	try {
		const token = await getOrRefreshBlizzardAccessToken();

		const summaryUrl = `https://${encodeURIComponent(regionLc)}.api.blizzard.com/profile/wow/character/${encodeURIComponent(realmLc)}/${encodeURIComponent(nameLc)}?namespace=profile-${encodeURIComponent(regionLc)}&locale=en_US`;
		const mediaUrl = `https://${encodeURIComponent(regionLc)}.api.blizzard.com/profile/wow/character/${encodeURIComponent(realmLc)}/${encodeURIComponent(nameLc)}/character-media?namespace=profile-${encodeURIComponent(regionLc)}&locale=en_US`;

		const [summaryResponse, mediaResponse] = await Promise.all([
			fetch(summaryUrl, { headers: { Authorization: `Bearer ${token}` } }),
			fetch(mediaUrl, { headers: { Authorization: `Bearer ${token}` } })
		]);

		if (!summaryResponse.ok) {
			throw new Error(`Summary endpoint error: ${await summaryResponse.text()}`);
		}
		if (!mediaResponse.ok) {
			throw new Error(`Media endpoint error: ${await mediaResponse.text()}`);
		}

		const summaryData = await summaryResponse.json();
		const mediaData = await mediaResponse.json();

		const combinedData: BlizzardCharacterFull = { ...summaryData, media: mediaData };

		return apiOk(combinedData);
	} catch (error) {
		logServerError('api/blizzard', 'request failed', error);
		return apiError(error instanceof Error ? error.message : 'Internal Server Error.');
	}
};
