import type { RequestHandler } from './$types';
import type { Player } from '$lib/types/apiTypes';
import { apiError, apiOk } from '$lib/server/apiResponses';
import { executeWclQuery, WclQueryError } from '$lib/server/wclGraphQL';

const QUERY = `
	query GetPlayerDetails($code: String!, $fightID: Int!) {
		reportData {
			report(code: $code) {
				playerDetails(fightIDs: [$fightID])
			}
		}
	}
`;

interface PlayerDetailsData {
	reportData: {
		report: {
			playerDetails: { data: { playerDetails: { healers: Player[] } } };
		};
	};
}

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json().catch(() => null)) as
		| { code?: unknown; fightID?: unknown }
		| null;
	const { code, fightID } = body ?? {};
	if (typeof code !== 'string' || !code || typeof fightID !== 'number') {
		return apiError('Invalid or missing report code and/or fight ID.', 400);
	}

	try {
		const data = await executeWclQuery<PlayerDetailsData>(QUERY, { code, fightID });
		const healerData = data.reportData.report.playerDetails.data.playerDetails.healers;
		return apiOk({ healerData });
	} catch (error) {
		if (error instanceof WclQueryError) {
			return apiError('Failed to fetch healing data from API.');
		}
		console.error('player-details: failed', error);
		return apiError('Internal Server Error.');
	}
};
