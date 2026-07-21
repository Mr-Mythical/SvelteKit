import { ADDONS } from '$lib/data/addons';
import { bosses } from '$lib/types/bossData';

export const SITE_ORIGIN = 'https://mrmythical.com';

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
		lastmod: '2026-07-21',
		changefreq: 'weekly',
		priority: 1,
		title: 'Mr. Mythical | Mythic+ & Raid Tools',
		description:
			'Mythic+ score calculator, raid log visualizer, boss profiles, and WoW addons.',
		inFeed: true
	},
	{
		path: '/rating-calculator',
		lastmod: '2026-07-17',
		changefreq: 'weekly',
		priority: 0.9,
		title: 'Mythic+ Score Calculator',
		description: 'Set a target rating and see which keystones get you there.',
		inFeed: true
	},
	{
		path: '/rating-calculator?score=1500',
		lastmod: '2026-07-17',
		changefreq: 'monthly',
		priority: 0.5,
		title: 'Mythic+ Score Calculator (1500)',
		description: 'Plan a 1500 Mythic+ rating.'
	},
	{
		path: '/rating-calculator?score=2000',
		lastmod: '2026-07-17',
		changefreq: 'monthly',
		priority: 0.5,
		title: 'Mythic+ Score Calculator (2000)',
		description: 'Plan a 2000 Mythic+ rating.'
	},
	{
		path: '/rating-calculator?score=2500',
		lastmod: '2026-07-17',
		changefreq: 'monthly',
		priority: 0.5,
		title: 'Mythic+ Score Calculator (2500)',
		description: 'Plan a 2500 Mythic+ rating.'
	},
	{
		path: '/rating-calculator?score=3000',
		lastmod: '2026-07-17',
		changefreq: 'monthly',
		priority: 0.5,
		title: 'Mythic+ Score Calculator (3000)',
		description: 'Plan a 3000 Mythic+ rating.'
	},
	{
		path: '/rating-calculator?score=3400',
		lastmod: '2026-07-17',
		changefreq: 'monthly',
		priority: 0.5,
		title: 'Mythic+ Score Calculator (3400)',
		description: 'Plan a 3400 Mythic+ rating.'
	},
	{
		path: '/raid',
		lastmod: '2026-07-17',
		changefreq: 'weekly',
		priority: 0.9,
		title: 'Raid Log Visualizer',
		description: 'Open a Warcraft Logs report and view damage and healing over time.',
		inFeed: true
	},
	{
		path: '/raid/boss',
		lastmod: '2026-07-17',
		changefreq: 'weekly',
		priority: 0.85,
		title: 'Boss Damage & Death Profiles',
		description: 'Averaged damage taken and death hotspots from public Mythic kills.',
		inFeed: true
	},
	...bosses.map((boss) => ({
		path: `/raid/boss/${boss.slug}`,
		lastmod: '2026-07-17',
		changefreq: 'weekly' as const,
		priority: 0.7,
		title: `${boss.name} Boss Profile`,
		description: `Damage taken and death hotspots for ${boss.name}.`,
		inFeed: false
	})),
	{
		path: '/addons',
		lastmod: '2026-07-21',
		changefreq: 'weekly',
		priority: 0.9,
		title: 'WoW Addons for Mythic+ & Gearing',
		description:
			'Mr. Mythical World of Warcraft addons for Mythic+ tooltips, gearing dashboard, and more.',
		inFeed: true
	},
	...ADDONS.map((addon) => ({
		path: `/addons/${addon.id}`,
		lastmod: '2026-07-21',
		changefreq: 'weekly' as const,
		priority: 0.8,
		title: addon.seoTitle,
		description: addon.seoDescription,
		inFeed: true
	})),
	{
		path: '/about',
		lastmod: '2026-07-17',
		changefreq: 'monthly',
		priority: 0.6,
		title: 'About Mr. Mythical',
		description: 'Who builds Mr. Mythical and what the tools are for.',
		inFeed: true
	},
	{
		path: '/privacy',
		lastmod: '2025-06-01',
		changefreq: 'yearly',
		priority: 0.3,
		title: 'Privacy Policy',
		description: 'How Mr. Mythical handles data.'
	},
	{
		path: '/cookie',
		lastmod: '2025-06-01',
		changefreq: 'yearly',
		priority: 0.3,
		title: 'Cookie Policy',
		description: 'Cookie use on mrmythical.com.'
	}
];

export function absoluteUrl(path: string): string {
	return `${SITE_ORIGIN}${path}`;
}

export function feedRoutes(): SiteRoute[] {
	return SITE_ROUTES.filter((route) => route.inFeed);
}
