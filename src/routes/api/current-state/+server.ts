import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getUserRecents, addUserRecent } from '$lib/db/userRecents.js';

export interface CurrentState {
	urlParams: string;
	timestamp: number;
}

// GET: Fetch user's current state
export const GET: RequestHandler = async ({ locals }) => {
	try {
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			return json(null);
		}

		const recentStates = await getUserRecents(session.user.id, 'current_state', 1);

		if (recentStates.length === 0) {
			return json(null);
		}

		const latestState = recentStates[0];
		
		return json({
			urlParams: latestState.entityData.urlParams,
			timestamp: latestState.entityData.timestamp
		});
	} catch (error) {
		console.error('Error fetching current state:', error);
		return json(null);
	}
};

// POST: Save user's current state
export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		const { urlParams }: Omit<CurrentState, 'timestamp'> = await request.json();

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
				const runCount = Math.floor((runsData?.length || 0) / 6);
				title = 'Custom Runs';
				subtitle = `${runCount} dungeons configured`;
			} else if (params.has('score')) {
				const score = params.get('score');
				title = `Score Target: ${score}`;
				subtitle = 'Score calculation mode';
			}
		}

		await addUserRecent(
			session.user.id,
			'current_state',
			'current',
			{ urlParams, timestamp },
			title,
			subtitle,
			{ timestamp, hasUrlParams: !!urlParams }
		);

		return json({ success: true, timestamp });
	} catch (error) {
		console.error('Error saving current state:', error);
		return json({ error: 'Failed to save state' }, { status: 500 });
	}
};