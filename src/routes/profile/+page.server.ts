import { redirect } from '@sveltejs/kit';
import type { ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async (event) => {
	const session = await event.locals.getSession?.();

	if (!session?.user) {
		throw redirect(302, '/auth/signin');
	}

	return {
		session
	};
};
