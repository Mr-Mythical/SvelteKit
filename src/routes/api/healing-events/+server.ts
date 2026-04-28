import type { RequestHandler } from './$types';
import type { Series } from '$lib/types/apiTypes';
import { handleWclFightRequest } from '$lib/server/wclGraphQL';

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

export const POST: RequestHandler = ({ request }) =>
	handleWclFightRequest<HealingGraphData, { seriesData: Series[] }>(request, {
		query: QUERY,
		operation: 'api/healing-events',
		fetchErrorMessage: 'Failed to fetch healing data from API.',
		transform: (data) => ({ seriesData: data.reportData.report.graph.data.series })
	});
