import type { RequestHandler } from './$types';
import type { FightsAndReportInfoResponse } from '$lib/types/apiTypes';
import { apiError, apiOk } from '$lib/server/apiResponses';
import { executeWclQuery, WclQueryError } from '$lib/server/wclGraphQL';

const QUERY = `
	query FightsAndReportInfo($code: String!) {
		reportData {
			report(code: $code) {
				title
				owner {
					name
				}
				guild {
					name
				}
				fights {
					id
					name
					startTime
					endTime
					encounterID
					kill
					bossPercentage
					difficulty
				}
			}
		}
	}
`;

interface FightsData {
	reportData: { report: FightsAndReportInfoResponse | null };
}

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json().catch(() => null)) as { code?: unknown } | null;
	const code = body?.code;
	if (typeof code !== 'string' || !code) {
		return apiError('Invalid or missing report code.', 400);
	}

	try {
		const data = await executeWclQuery<FightsData>(QUERY, { code });
		const reportData = data.reportData?.report;
		if (!reportData) {
			console.error('fights: report data missing');
			return apiError('Could not parse report data from API response.');
		}
		return apiOk({
			title: reportData.title || 'Untitled Report',
			owner: reportData.owner || null,
			guild: reportData.guild || null,
			fights: reportData.fights || []
		});
	} catch (error) {
		if (error instanceof WclQueryError) {
			console.error('fights: WCL error', error.detail);
			return apiError('Failed to fetch fights from API.');
		}
		console.error('fights: failed', error);
		return apiError('Internal Server Error.');
	}
};
