import type { RequestHandler } from './$types';
import {
	getUserRecents,
	addUserRecent,
	type CharacterRecentData
} from '$lib/db/userRecents.js';
import { apiError, apiOk } from '$lib/server/apiResponses';
import { requireSession } from '$lib/server/requireSession';

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
		console.error('Error fetching recent characters:', error);
		return apiError('Failed to fetch recent characters');
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const auth = await requireSession(locals);
	if ('response' in auth) return auth.response;

	try {
		const { characterName, realm, region } = await request.json();

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
				level: null,
				timestamp: Date.now()
			}
		);

		return apiOk({ success: true });
	} catch (error) {
		console.error('Error adding recent character:', error);
		return apiError('Failed to add character');
	}
};
