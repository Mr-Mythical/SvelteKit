import type { RequestHandler } from './$types';
import type { Series } from '$lib/types/types';
import { getValidAccessToken } from '$lib/utils/tokenCache';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { fightID, code, startTime, endTime } = await request.json();

		if (!fightID || typeof fightID !== 'number' || !code || typeof code !== 'string') {
			return new Response(
				JSON.stringify({ error: 'Invalid or missing fight ID and/or report code.' }),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' }
				}
			);
		}

		const accessToken = await getValidAccessToken();

		const query = `
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

		const variables = { code, fightID, start: startTime, end: endTime };

		const response = await fetch('https://www.warcraftlogs.com/api/v2/client', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${accessToken}`
			},
			body: JSON.stringify({ query, variables })
		});

		const json = await response.json();

		if (json.errors) {
			console.error('GraphQL Errors:', json.errors);
			return new Response(JSON.stringify({ error: 'Failed to fetch damage data from API.' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const seriesData: Series[] = json.data.reportData.report.graph.data.series;

		return new Response(JSON.stringify({ seriesData }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Server Error:', error);
		return new Response(JSON.stringify({ error: 'Internal Server Error.' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
