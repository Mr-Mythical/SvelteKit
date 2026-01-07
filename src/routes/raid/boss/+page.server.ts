import type { PageLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { bosses } from '$lib/types/bossData';

export const load: PageLoad = async () => {
	// Redirect to the first boss
	throw redirect(307, `/raid/boss/${bosses[0].slug}`);
};
