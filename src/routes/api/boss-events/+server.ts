import type { RequestHandler } from './$types';
import type { CastEvent } from '$lib/types/apiTypes';
import { getValidAccessToken } from '$lib/utils/tokenCache';
import { bosses } from '$lib/types/bossData';

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

		// Extract all ability IDs from bosses
		const abilityIDs = bosses
			.flatMap((boss) => boss.abilities.map((ability) => ability.id))
			.filter((id) => id !== undefined && id !== null);

		// Build filter expression based on ability IDs
		const filter =
			abilityIDs.length > 0
				? `ability.id IN (${abilityIDs.join(', ')})`
				: '';

		const query = `
		  query ResourcesBySource($code: String!, $fightID: Int!, $start: Float!, $end: Float!, $filter: String!) {
			reportData {
			  report(code: $code) {
				events(
				  filterExpression: $filter,
				  dataType: Casts,
				  fightIDs: [$fightID],
				  startTime: $start,
				  endTime: $end,
				  hostilityType: Enemies
				) {
				  data
				  nextPageTimestamp
				}
			  }
			}
		  }
		`;

		const variables = { code, fightID, start: startTime, end: endTime, filter };

		const accessToken = await getValidAccessToken();

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
			return new Response(
				JSON.stringify({ error: 'Failed to fetch cast events from API.' }),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' }
				}
			);
		}

		const castEvents: CastEvent[] = json.data.reportData.report.events.data.filter(
			(event: any) => event.type === 'cast'
		);

		return new Response(JSON.stringify({ castEvents }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Internal Server Error.' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
