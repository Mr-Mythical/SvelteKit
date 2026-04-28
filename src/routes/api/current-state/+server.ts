import type { RequestHandler } from './$types';
import { getUserRecents, addUserRecent, type CurrentStateRecentData } from '$lib/db/userRecents.js';
import { apiOk } from '$lib/server/apiResponses';
import { requireSession } from '$lib/server/requireSession';
import { handleApiError } from '$lib/server/logger';
import { parseJsonBody, parseCurrentStateBody } from '$lib/server/requestBody';

export interface CurrentState {
	urlParams: string;
	timestamp: number;
}

// GET: Fetch user's current state
export const GET: RequestHandler = async ({ locals }) => {
	const auth = await requireSession(locals);
	if ('response' in auth) return auth.response;

	try {
		const recentStates = await getUserRecents<CurrentStateRecentData>(
			auth.session.user.id,
			'current_state',
			1
		);

		if (recentStates.length === 0) {
			return apiOk(null);
		}

		const latestState = recentStates[0];

		return apiOk({
			urlParams: latestState.entityData.urlParams,
			timestamp: latestState.entityData.timestamp
		});
	} catch (error) {
		return handleApiError('api/current-state', error, 'Failed to fetch current state');
	}
};

// POST: Save user's current state
export const POST: RequestHandler = async ({ request, locals }) => {
	const auth = await requireSession(locals);
	if ('response' in auth) return auth.response;

	try {
		const parsed = await parseJsonBody(request, parseCurrentStateBody);
		if (parsed instanceof Response) return parsed;
		const { urlParams } = parsed;

		const timestamp = Date.now();

		// Create a simple title based on the URL parameters
		let title = 'Calculator State';
		let subtitle = 'Empty state';

		if (urlParams) {
			const params = new URLSearchParams(urlParams);
			if (params.has('char')) {
				const char = params.get('char');
				const realm = params.get('realm');
				const region = params.get('region');
				title = `${char} (${realm}-${region})`;
				subtitle = 'Character state';
			} else if (params.has('runs')) {
				const runsData = params.get('runs');
				const runCount = Math.floor((runsData?.length ?? 0) / 6);
				title = 'Custom Runs';
				subtitle = `${runCount} dungeons configured`;
			} else if (params.has('score')) {
				const score = params.get('score');
				title = `Score Target: ${score}`;
				subtitle = 'Score calculation mode';
			}
		}

		await addUserRecent(
			auth.session.user.id,
			'current_state',
			'current',
			{ urlParams, timestamp },
			title,
			subtitle,
			{ timestamp, hasUrlParams: !!urlParams }
		);

		return apiOk({ success: true, timestamp });
	} catch (error) {
		return handleApiError('api/current-state', error, 'Failed to save state');
	}
};
