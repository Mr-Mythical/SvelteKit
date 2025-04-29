import type { RequestHandler } from '@sveltejs/kit';
import type { ApiResponse, FightsAndReportInfoResponse } from '$lib/types/apiTypes';
import { getValidAccessToken } from '$lib/utils/tokenCache';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { code } = await request.json();

		if (!code || typeof code !== 'string') {
			return new Response(JSON.stringify({ error: 'Invalid or missing report code.' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const accessToken = await getValidAccessToken();

		const query = `
			query FightsAndReportInfo($code: String!) {
				reportData {
					report(code: $code) {
						title # <-- Added
						owner { # <-- Added
							name
						}
						guild { # <-- Added
							name
						}
						fights { # <-- Existing
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

		const response = await fetch('https://www.warcraftlogs.com/api/v2/client', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${accessToken}`
			},
			body: JSON.stringify({ query, variables })
		});

		if (!response.ok) {
			console.error('Failed to fetch fights from API:', response.statusText);
			return new Response(JSON.stringify({ error: 'Failed to fetch fights from API.' }), {
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const json: ApiResponse<FightsAndReportInfoResponse> = await response.json();

		const reportData = json.data?.reportData?.report;

		if (!reportData) {
			console.error('Report data is missing in the response:', json);
			return new Response(
				JSON.stringify({ error: 'Could not parse report data from API response.' }),
				{
					status: 500,
					headers: { 'Content-Type': 'application/json' }
				}
			);
		}

		const fights = reportData.fights || [];
		const title = reportData.title || 'Untitled Report';
		const owner = reportData.owner || null;
		const guild = reportData.guild || null;

		return new Response(JSON.stringify({ title, owner, guild, fights }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Server Error in /api/fights:', error);
		return new Response(JSON.stringify({ error: 'Internal Server Error.' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
