import type { PageServerLoad } from './$types';
import { bosses } from '$lib/types/bossData';

export const load: PageServerLoad = () => {
	return { bosses };
};
