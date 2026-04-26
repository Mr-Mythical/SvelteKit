import type { RequestHandler } from './$types';
import { getMyWowRoster } from '$lib/data/myWowRoster';
import { apiOk } from '$lib/server/apiResponses';
import { requireSession } from '$lib/server/requireSession';

export const GET: RequestHandler = async ({ locals, url }) => {
	const auth = await requireSession(locals);
	if ('response' in auth) return auth.response;

	const roster = await getMyWowRoster(auth.session.user.id, {
		refresh: url.searchParams.get('refresh') === '1'
	});
	return apiOk(roster);
};
