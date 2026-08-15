import type { PageServerLoad, Actions } from './$types.js';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { formSchema } from './schema.js';
import { scoreLandingSeo } from '$lib/data/seoCopy';

export const load: PageServerLoad = async (event) => {
	const form = await superValidate(zod4(formSchema));

	const urlScore = event.url.searchParams.get('score');
	const score = urlScore ? Number(urlScore) : undefined;
	let seoTitle: string | undefined;
	let seoDescription: string | undefined;
	let seoKeywords: string | undefined;

	if (score && Number.isFinite(score) && score > 0) {
		const seo = scoreLandingSeo(score);
		seoTitle = seo.title;
		seoDescription = seo.description;
		seoKeywords = `mythic+ calculator, mythic rating calculator, mythic score calculator, ${score} mythic+ rating`;
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
		const form = await superValidate(event, zod4(formSchema));
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
