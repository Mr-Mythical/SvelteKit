import type { RequestHandler } from './$types';
import { getValidAccessToken } from '$lib/utils/tokenCache';
import type { ApiResponse, PlayerDetailsResponse, Player } from '$lib/types/apiTypes';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { code, fightID } = await request.json();

		if (!code || typeof code !== 'string' || !fightID || typeof fightID !== 'number') {
			return new Response(
				JSON.stringify({ error: 'Invalid or missing report code and/or fight ID.' }),
				{
					status: 400,
					headers: { 'Content-Type': 'application/json' }
				}
			);
		}

		const accessToken = await getValidAccessToken();

		const query = `
      query GetPlayerDetails($code: String!, $fightID: Int!) {
        reportData {
          report(code: $code) {
            playerDetails(fightIDs: [$fightID]) # Fetches details for the specified fight
          }
        }
      }
    `;

		const variables = { code, fightID };

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
			return new Response(JSON.stringify({ error: 'Failed to fetch healing data from API.' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		let healerData: Player[] = json.data.reportData.report.playerDetails.data.playerDetails.healers;

		return new Response(JSON.stringify({ healerData }), {
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
