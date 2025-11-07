import type { RequestHandler } from './$types';
import { getUserById } from '$lib/db/users.js';
import { getUserRecents, addUserRecent, createCharacterRecent } from '$lib/db/recents.js';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		const session = await locals.getSession?.();
		
		if (!session?.user?.id) {
			return new Response(JSON.stringify({ error: 'Not authenticated' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Get user from database
		const user = await getUserById(session.user.id);
		
		if (!user) {
			return new Response(JSON.stringify({ error: 'User not found in database' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Get user's recent activity
		const recents = await getUserRecents(session.user.id, undefined, 10);

		// Test adding a recent item
		try {
			const testRecent = createCharacterRecent(
				'TestCharacter',
				'Stormrage',
				'us',
				{ class: 'Paladin', level: 80 }
			);
			await addUserRecent(session.user.id, testRecent);
		} catch (recentError) {
			console.error('Error adding test recent:', recentError);
		}

		// Get recents again after adding test item
		const updatedRecents = await getUserRecents(session.user.id, undefined, 10);

		return new Response(JSON.stringify({
			success: true,
			user: {
				id: user.id,
				battletag: user.battletag,
				name: user.name,
				createdAt: user.createdAt,
				lastSeenAt: user.lastSeenAt,
				isActive: user.isActive,
				preferences: user.preferences
			},
			recents: updatedRecents.length,
			recentItems: updatedRecents
		}), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Database test error:', error);
		return new Response(JSON.stringify({ 
			error: 'Database connection failed',
			details: error instanceof Error ? error.message : 'Unknown error'
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};