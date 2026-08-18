import type { EntryGenerator, PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';
import { bosses, hasSplitGuides, type GuideDifficulty } from '$lib/types/bossData';

export const entries: EntryGenerator = () =>
	bosses.flatMap((boss) => {
		const routes = [{ bossname: boss.slug, difficulty: '' }];
		if (hasSplitGuides(boss)) {
			routes.push({ bossname: boss.slug, difficulty: 'mythic' });
		}
		return routes;
	});

export const load: PageServerLoad = ({ params }) => {
	const bossSlug = params.bossname;
	const difficultyParam = params.difficulty;
	const boss = bosses.find((entry) => entry.slug === bossSlug);

	if (!boss) {
		error(404, 'Boss not found');
	}

	if (difficultyParam === 'heroic') {
		redirect(301, `/raid/boss/${boss.slug}`);
	}

	if (!difficultyParam) {
		const difficulty: GuideDifficulty = hasSplitGuides(boss) ? 'heroic' : 'mythic';
		return { bossId: boss.id, boss, difficulty };
	}

	if (difficultyParam === 'mythic' && hasSplitGuides(boss)) {
		return { bossId: boss.id, boss, difficulty: 'mythic' as const };
	}

	error(404, 'Boss not found');
};
