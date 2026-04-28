import type { RequestHandler } from './$types';
import { getUserRecents, addUserRecent, type ReportRecentData } from '$lib/db/userRecents.js';
import { apiOk } from '$lib/server/apiResponses';
import { requireSession } from '$lib/server/requireSession';
import { handleApiError } from '$lib/server/logger';
import { parseJsonBody, parseRecentReportBody } from '$lib/server/requestBody';

// GET: Fetch user's recent reports
export const GET: RequestHandler = async ({ locals }) => {
	const auth = await requireSession(locals);
	if ('response' in auth) return auth.response;

	try {
		const recentReports = await getUserRecents<ReportRecentData>(auth.session.user.id, 'report', 6);

		// Transform to match the expected RecentReport format
		const reports = recentReports.map((recent) => ({
			code: recent.entityData.code,
			timestamp: new Date(recent.lastAccessedAt).getTime(),
			title: recent.entityData.title || recent.title,
			guild: recent.entityData.guild ? { name: recent.entityData.guild } : undefined,
			owner: { name: recent.entityData.owner || 'Unknown' }
		}));

		return apiOk(reports);
	} catch (error) {
		return handleApiError('api/recent-reports', error, 'Failed to fetch recent reports');
	}
};

// POST: Add a report to recent list
export const POST: RequestHandler = async ({ request, locals }) => {
	const auth = await requireSession(locals);
	if ('response' in auth) return auth.response;

	try {
		const parsed = await parseJsonBody(request, parseRecentReportBody);
		if (parsed instanceof Response) return parsed;
		const { code, title, guild, owner } = parsed;

		await addUserRecent(
			auth.session.user.id,
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

		return apiOk({ success: true });
	} catch (error) {
		return handleApiError('api/recent-reports', error, 'Failed to add report');
	}
};
