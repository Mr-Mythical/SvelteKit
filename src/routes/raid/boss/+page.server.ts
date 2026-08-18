import type { PageServerLoad } from './$types';
import { groupedBosses } from '$lib/types/bossData';

export const load: PageServerLoad = () => {
	return { raids: groupedBosses() };
};
