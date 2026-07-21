import type { PageServerLoad } from './$types';
import { ADDONS } from '$lib/data/addons';
import { loadDpsValidation } from '$lib/server/dpsValidation';

export const load: PageServerLoad = async ({ platform }) => {
	const validation = await loadDpsValidation(platform);

	return {
		addons: ADDONS.map(
			({ id, name, headline, blurb, features, links, hasValidation, ctaLabel }) => ({
				id,
				name,
				headline,
				blurb,
				features: features.slice(0, 4),
				links: { curseforge: links.curseforge, wago: links.wago },
				hasValidation: !!hasValidation,
				ctaLabel
			})
		),
		validation: validation
			? {
					upgrade_picks_pct: validation.overall.upgrade_picks_pct,
					upgrade_size_error_pct: validation.overall.upgrade_size_error_pct,
					dps_read_error_pct: validation.overall.dps_read_error_pct,
					spec_count: validation.overall.spec_count,
					checked_label: validation.checked_label
				}
			: null
	};
};
