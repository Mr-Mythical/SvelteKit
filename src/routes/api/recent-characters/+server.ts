import type { RequestHandler } from './$types';
import {
	getUserRecents,
	addUserRecent,
	type CharacterRecentData
} from '$lib/db/userRecents.js';
import { apiOk } from '$lib/server/apiResponses';
import { requireSession } from '$lib/server/requireSession';
import { handleApiError } from '$lib/server/logger';
import { parseJsonBody, parseRecentCharacterBody } from '$lib/server/requestBody';

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
		return handleApiError('api/recent-characters', error, 'Failed to add character');
	}
};
