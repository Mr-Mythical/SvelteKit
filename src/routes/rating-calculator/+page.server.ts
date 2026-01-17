import type { PageServerLoad, Actions } from './$types.js';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { formSchema } from './schema.js';
import { calculateKeystoneBreakdown } from '$lib/utils/keystoneCalculations';
import { dungeonCount } from '$lib/types/dungeons';

export const load: PageServerLoad = async (event) => {
	const form = await superValidate(zod(formSchema));

	const urlScore = event.url.searchParams.get('score');
	const score = urlScore ? Number(urlScore) : undefined;
	let seoTitle: string | undefined;
	let seoDescription: string | undefined;
	let seoKeywords: string | undefined;

	if (score && Number.isFinite(score) && score > 0) {
		const breakdown = calculateKeystoneBreakdown(score, dungeonCount);
		const parts = breakdown.sort((a, b) => b.level - a.level).map((b) => `${b.count} +${b.level}`);
		const breakdownStr =
			parts.length > 1
				? parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1]
				: parts[0];

		seoDescription = `Achieve your ${score} Mythic+ score with ${breakdownStr}. Try the interactive m+ calculator to see which keystones you need for your desired Mythic+ score in WoW. Import your character and plan your runs!`;
		seoKeywords = `mythic+ calculator, mythic rating calculator, mythic score calculator, mythic+ score calculator, mythic plus rating calculator, mythic+ rating calculator, mythic plus calculator, mythic planner, mythic dungeon planner, m+ calculator, ${score} mythic rating, ${score} mythic+ rating, ${score} mythic score, ${score} mythic+ score`;
	}

	return {
		form,
		seoTitle,
		seoDescription,
		seoKeywords
	};
};

export const actions: Actions = {
	default: async (event) => {
		const form = await superValidate(event, zod(formSchema));
		if (!form.valid) {
			return fail(400, {
				form
			});
		}
		return {
			form
		};
	}
};
