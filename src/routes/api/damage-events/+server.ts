import type { RequestHandler } from './$types';
import type { Series } from '$lib/types/apiTypes';
import { apiError, apiOk } from '$lib/server/apiResponses';
import { executeWclQuery, parseFightRequestBody, WclQueryError } from '$lib/server/wclGraphQL';
import { logServerError } from '$lib/server/logger';

const QUERY = `
	query DamageTakenSeries($code: String!, $fightID: Int!, $start: Float!, $end: Float!) {
		reportData {
			report(code: $code) {
				graph(
					dataType: DamageTaken,
					fightIDs: [$fightID],
					startTime: $start,
					endTime: $end,
					hostilityType: Friendlies
				)
			}
		}
	}
`;

interface DamageGraphData {
	reportData: {
		report: { graph: { data: { series: Series[] } } };
	};
}

export const POST: RequestHandler = async ({ request }) => {
	const body = parseFightRequestBody(await request.json().catch(() => null));
	if (!body) return apiError('Invalid or missing fight ID and/or report code.', 400);

	try {
		const data = await executeWclQuery<DamageGraphData>(QUERY, {
			code: body.code,
			fightID: body.fightID,
			start: body.startTime,
			end: body.endTime
		});
		const seriesData = data.reportData.report.graph.data.series.filter((s) => s.name === 'Total');
		return apiOk({ seriesData });
	} catch (error) {
		if (error instanceof WclQueryError) {
			return apiError('Failed to fetch damage data from API.');
		}
		logServerError('api/damage-events', 'request failed', error);
		return apiError('Internal Server Error.');
	}
};
