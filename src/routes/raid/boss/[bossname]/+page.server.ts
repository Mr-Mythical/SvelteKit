import type { PageLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { bosses } from '$lib/types/bossData';

export const load: PageLoad = async ({ params }) => {
	const bossSlug = params.bossname;
	const boss = bosses.find((b) => b.slug === bossSlug);

	if (!boss) {
		// Redirect to the first boss if the slug doesn't exist
		throw redirect(307, `/raid/boss/${bosses[0].slug}`);
	}

	return {
		bossId: boss.id,
		boss
	};
};
