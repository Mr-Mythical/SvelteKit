import { ADDONS } from '$lib/data/addons';
import {
	bossSeoDescription,
	bossSeoTitle,
	PAGE_SEO,
	SCORE_LANDINGS,
	scoreLandingSeo
} from '$lib/data/seoCopy';
import { SITE_ORIGIN } from '$lib/seo';
import { bossGuidePath, bosses, hasSplitGuides, type GuideDifficulty } from '$lib/types/bossData';

export { SITE_ORIGIN };

export type SiteRoute = {
	path: string;
	/** ISO date (YYYY-MM-DD) when this URL's content last meaningfully changed */
	lastmod: string;
	changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
	priority: number;
	/** Used by RSS / llms.txt */
	title: string;
	description: string;
	/** Include in the public RSS feed */
	inFeed?: boolean;
};

/**
 * Canonical public routes with stable lastmod stamps.
 * Bump lastmod only when that page's content actually changes.
 */
export const SITE_ROUTES: SiteRoute[] = [
	{
		path: '/',
		lastmod: '2026-08-16',
		changefreq: 'weekly',
		priority: 1,
		...PAGE_SEO.home,
		inFeed: true
	},
	{
		path: '/rating-calculator',
		lastmod: '2026-08-16',
		changefreq: 'weekly',
		priority: 0.9,
		...PAGE_SEO.calculator,
		inFeed: true
	},
	...SCORE_LANDINGS.map((score) => ({
		path: `/rating-calculator?score=${score}`,
		lastmod: '2026-08-16',
		changefreq: 'monthly' as const,
		priority: 0.5,
		...scoreLandingSeo(score)
	})),
	{
		path: '/raid',
		lastmod: '2026-08-18',
		changefreq: 'weekly',
		priority: 0.9,
		...PAGE_SEO.raid,
		inFeed: true
	},
	{
		path: '/raid/boss',
		lastmod: '2026-08-18',
		changefreq: 'weekly',
		priority: 0.85,
		...PAGE_SEO.raidBoss,
		inFeed: true
	},
	...bosses.flatMap((boss) => {
		const split = hasSplitGuides(boss);
		const difficulties: GuideDifficulty[] = split ? ['heroic', 'mythic'] : ['mythic'];
		return difficulties.map((difficulty) => {
			const guide = split ? boss.guides[difficulty] : boss.guide;
			return {
				path: bossGuidePath(boss.slug, split ? difficulty : 'heroic'),
				lastmod: split ? '2026-08-18' : '2026-08-16',
				changefreq: 'weekly' as const,
				priority: boss.raidId === 'venomous-abyss' ? (difficulty === 'heroic' ? 0.8 : 0.75) : 0.7,
				title: bossSeoTitle(boss.name, difficulty),
				description: bossSeoDescription(boss.name, guide?.teaser ?? boss.teaser, difficulty),
				inFeed: !split || difficulty === 'heroic'
			};
		});
	}),
	{
		path: '/gearing',
		lastmod: '2026-08-16',
		changefreq: 'weekly',
		priority: 0.9,
		...PAGE_SEO.gearing,
		inFeed: true
	},
	{
		path: '/addons',
		lastmod: '2026-08-16',
		changefreq: 'weekly',
		priority: 0.9,
		...PAGE_SEO.addons,
		inFeed: true
	},
	...ADDONS.map((addon) => ({
		path: `/addons/${addon.id}`,
		lastmod: '2026-08-16',
		changefreq: 'weekly' as const,
		priority: 0.8,
		title: addon.seoTitle,
		description: addon.seoDescription,
		inFeed: true
	})),
	{
		path: '/about',
		lastmod: '2026-08-16',
		changefreq: 'monthly',
		priority: 0.6,
		...PAGE_SEO.about,
		inFeed: true
	},
	{
		path: '/privacy',
		lastmod: '2026-08-16',
		changefreq: 'yearly',
		priority: 0.3,
		...PAGE_SEO.privacy
	},
	{
		path: '/cookie',
		lastmod: '2026-08-16',
		changefreq: 'yearly',
		priority: 0.3,
		...PAGE_SEO.cookie
	}
];

export function absoluteUrl(path: string): string {
	return `${SITE_ORIGIN}${path}`;
}

export function feedRoutes(): SiteRoute[] {
	return SITE_ROUTES.filter((route) => route.inFeed);
}
