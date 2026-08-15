import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { bosses } from '$lib/types/bossData';

export const load: PageServerLoad = ({ params }) => {
	const bossSlug = (params as { bossname?: string }).bossname;
	const boss = bosses.find((b) => b.slug === bossSlug);

	if (!boss) {
		error(404, 'Boss not found');
	}

	return {
		bossId: boss.id,
		boss
	};
};
