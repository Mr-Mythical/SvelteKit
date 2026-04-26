import type { RequestHandler } from './$types';
import type { Series } from '$lib/types/apiTypes';
import { apiError, apiOk } from '$lib/server/apiResponses';
import { executeWclQuery, parseFightRequestBody, WclQueryError } from '$lib/server/wclGraphQL';

const QUERY = `
	query GetHealingSeries($code: String!, $fightID: Int!, $start: Float!, $end: Float!) {
		reportData {
			report(code: $code) {
				graph(
					dataType: Healing,
					fightIDs: [$fightID],
					startTime: $start,
					endTime: $end,
					hostilityType: Friendlies
				)
			}
		}
	}
`;

interface HealingGraphData {
	reportData: {
		report: { graph: { data: { series: Series[] } } };
	};
}

export const POST: RequestHandler = async ({ request }) => {
	const body = parseFightRequestBody(await request.json().catch(() => null));
	if (!body) return apiError('Invalid or missing fight ID and/or report code.', 400);

	try {
		const data = await executeWclQuery<HealingGraphData>(QUERY, {
			code: body.code,
			fightID: body.fightID,
			start: body.startTime,
			end: body.endTime
		});
		return apiOk({ seriesData: data.reportData.report.graph.data.series });
	} catch (error) {
		if (error instanceof WclQueryError) {
			return apiError('Failed to fetch healing data from API.');
		}
		console.error('healing-events: failed', error);
		return apiError('Internal Server Error.');
	}
};
