import type { RequestHandler } from '@sveltejs/kit';
import { getBlizzardValidAccessToken } from '$lib/utils/blizzardTokenCache';
import type { BlizzardCharacterFull } from '$lib/types/blizzardFull';

export const GET: RequestHandler = async ({ url }) => {
	const name = url.searchParams.get('name');
	const region = url.searchParams.get('region');
	const realm = url.searchParams.get('realm');

	if (!name || !region || !realm) {
		return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
	}

	try {
		const token = await getBlizzardValidAccessToken();

		const summaryUrl = `https://${encodeURIComponent(region)}.api.blizzard.com/profile/wow/character/${encodeURIComponent(realm)}/${encodeURIComponent(name)}?namespace=profile-${encodeURIComponent(region)}&locale=en_US`;
		const mediaUrl = `https://${encodeURIComponent(region)}.api.blizzard.com/profile/wow/character/${encodeURIComponent(realm)}/${encodeURIComponent(name)}/character-media?namespace=profile-${encodeURIComponent(region)}&locale=en_US`;

		const [summaryResponse, mediaResponse] = await Promise.all([
			fetch(summaryUrl, { headers: { Authorization: `Bearer ${token}` } }),
			fetch(mediaUrl, { headers: { Authorization: `Bearer ${token}` } })
		]);

		if (!summaryResponse.ok) {
			const errorBody = await summaryResponse.text();
			throw new Error(`Summary endpoint error: ${errorBody}`);
		}
		if (!mediaResponse.ok) {
			const errorBody = await mediaResponse.text();
			throw new Error(`Media endpoint error: ${errorBody}`);
		}

		const summaryData = await summaryResponse.json();
		const mediaData = await mediaResponse.json();

		const combinedData: BlizzardCharacterFull = { ...summaryData, media: mediaData };

		return new Response(JSON.stringify(combinedData), { status: 200 });
	} catch (error: any) {
		console.error('Error in /api/blizzard:', error);
		return new Response(JSON.stringify({ error: error.message }), { status: 500 });
	}
};
