import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageServerLoad } from './$types';
import { ADDONS, getAddonById } from '$lib/data/addons';
import { loadDpsValidation, specsForDisplay } from '$lib/server/dpsValidation';

export const entries: EntryGenerator = () => ADDONS.map((addon) => ({ id: addon.id }));

export const load: PageServerLoad = async ({ params, platform }) => {
	const addon = getAddonById(params.id);
	if (!addon) {
		error(404, 'Addon not found');
	}

	const others = ADDONS.filter((a) => a.id !== addon.id).map(
		({ id, name, headline, blurb, ctaLabel }) => ({
			id,
			name,
			headline,
			blurb,
			ctaLabel
		})
	);

	if (!addon.hasValidation) {
		return { addon, others, validation: null, validationSpecs: [] };
	}

	const validation = await loadDpsValidation(platform);
	return {
		addon,
		others,
		validation,
		validationSpecs: validation ? specsForDisplay(validation) : []
	};
};
