import type { ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async (event) => {
	return {
		session: (await event.locals.getSession?.()) || null
	};
};
