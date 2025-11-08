import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getUserRecents, addUserRecent } from '$lib/db/userRecents.js';

// GET: Fetch user's recent reports
export const GET: RequestHandler = async ({ locals }) => {
	try {
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			return json([]);
		}

		const recentReports = await getUserRecents(session.user.id, 'report', 6);

		// Transform to match the expected RecentReport format
		const reports = recentReports.map((recent) => ({
			code: recent.entityData.reportCode,
			timestamp: new Date(recent.lastAccessedAt).getTime(),
			title: recent.entityData.title || recent.title,
			guild: recent.entityData.guildName ? { name: recent.entityData.guildName } : undefined,
			owner: { name: recent.entityData.owner || 'Unknown' }
		}));

		return json(reports);
	} catch (error) {
		console.error('Error fetching recent reports:', error);
		return json([]);
	}
};

// POST: Add a report to recent list
export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		const { code, title, guild, owner } = await request.json();

		await addUserRecent(
			session.user.id,
			'report',
			code,
			{
				code,
				title,
				guild: guild?.name,
				owner: owner?.name || 'Unknown'
			},
			title,
			guild?.name,
			{
				owner: owner?.name || 'Unknown',
				timestamp: Date.now()
			}
		);

		return json({ success: true });
	} catch (error) {
		console.error('Error adding recent report:', error);
		return json({ error: 'Failed to add report' }, { status: 500 });
	}
};
