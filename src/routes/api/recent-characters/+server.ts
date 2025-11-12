import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getUserRecents, addUserRecent } from '$lib/db/userRecents.js';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			return json([]);
		}

		const recentCharacters = await getUserRecents(session.user.id, 'character', 10);

		const characters = recentCharacters.map((recent) => ({
			region: recent.entityData.region,
			realm: recent.entityData.realm,
			characterName: recent.entityData.characterName
		}));

		return json(characters);
	} catch (error) {
		console.error('Error fetching recent characters:', error);
		return json([]);
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		const { characterName, realm, region } = await request.json();

		await addUserRecent(
			session.user.id,
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

		return json({ success: true });
	} catch (error) {
		console.error('Error adding recent character:', error);
		return json({ error: 'Failed to add character' }, { status: 500 });
	}
};
