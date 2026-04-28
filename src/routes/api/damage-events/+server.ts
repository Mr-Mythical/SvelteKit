import type { RequestHandler } from './$types';
import type { Series } from '$lib/types/apiTypes';
import { handleWclFightRequest } from '$lib/server/wclGraphQL';

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

export const POST: RequestHandler = ({ request }) =>
	handleWclFightRequest<DamageGraphData, { seriesData: Series[] }>(request, {
		query: QUERY,
		operation: 'api/damage-events',
		fetchErrorMessage: 'Failed to fetch damage data from API.',
		transform: (data) => ({
			seriesData: data.reportData.report.graph.data.series.filter((s) => s.name === 'Total')
		})
	});
