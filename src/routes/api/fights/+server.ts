// src/routes/api/fights/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import type { FightsResponse, Fight } from '$lib/types/apiTypes';
import { getValidAccessToken } from '../../../lib/utils/tokenCache';

export const POST: RequestHandler = async ({ request }: { request: Request }) => {
  try {
    // Parse the JSON body to get the report code
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid or missing report code.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get a valid Access Token
    const accessToken = await getValidAccessToken();

    // Define the GraphQL query
    const query = `
      query FightsInReport($code: String!) {
        reportData {
          report(code: $code) {
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

    const variables = { code };

    // Make the API request to Warcraft Logs
    const response = await fetch('https://www.warcraftlogs.com/api/v2/client', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ query, variables })
    });

    const json: FightsResponse = await response.json();

    if (json.errors) {
      console.error('GraphQL Errors:', json.errors);
      return new Response(JSON.stringify({ error: 'Failed to fetch fights from API.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const fights = json.data.reportData.report.fights;

    return new Response(JSON.stringify({ fights }), {
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
