import { ADDONS } from '$lib/data/addons';
import { bosses } from '$lib/types/bossData';

export const SITE_ORIGIN = 'https://mrmythical.com';
export const SITE_NAME = 'Mr. Mythical';
export const SITE_LOGO = `${SITE_ORIGIN}/Logo.png`;

const SEGMENT_LABELS: Record<string, string> = {
	'rating-calculator': 'Mythic+ calculator',
	gearing: 'Farm priority',
	addons: 'Addons',
	raid: 'Raid',
	boss: 'Bosses',
	about: 'About',
	privacy: 'Privacy',
	cookie: 'Cookies',
	profile: 'Profile'
};

export type BreadcrumbItem = {
	name: string;
	url: string;
};

function numericScore(value: string | null): string | null {
	if (!value || !/^\d+$/.test(value)) return null;
	const score = Number(value);
	return score > 0 ? value : null;
}

/** Canonical URL: pathname plus a numeric `score` query only. */
export function canonicalUrl(pathname: string, searchParams?: URLSearchParams): string {
	const path = pathname === '/' ? '/' : pathname.replace(/\/+$/, '');
	const score = numericScore(searchParams?.get('score') ?? null);
	return score ? `${SITE_ORIGIN}${path}?score=${score}` : `${SITE_ORIGIN}${path}`;
}

function labelForSegment(segment: string): string {
	if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
	const addon = ADDONS.find((entry) => entry.id === segment);
	if (addon) return addon.name;
	const boss = bosses.find((entry) => entry.slug === segment);
	if (boss) return boss.name;
	if (segment.startsWith('logs=')) return 'Log';
	return segment.replace(/[-_]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Empty on `/` so the homepage does not emit a BreadcrumbList. */
export function breadcrumbItems(pathname: string): BreadcrumbItem[] {
	const segments = pathname.split('/').filter(Boolean);
	if (segments.length === 0) return [];

	const items: BreadcrumbItem[] = [{ name: 'Home', url: `${SITE_ORIGIN}/` }];
	segments.forEach((segment, index) => {
		const path = `/${segments.slice(0, index + 1).join('/')}`;
		items.push({ name: labelForSegment(segment), url: `${SITE_ORIGIN}${path}` });
	});
	return items;
}

export function websiteJsonLd(): Record<string, unknown> {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: SITE_NAME,
		url: SITE_ORIGIN
	};
}

export function organizationJsonLd(): Record<string, unknown> {
	return {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: SITE_NAME,
		url: SITE_ORIGIN,
		logo: {
			'@type': 'ImageObject',
			url: SITE_LOGO
		}
	};
}

export function webPageJsonLd(
	title: string,
	description: string,
	url: string
): Record<string, unknown> {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		name: title,
		description,
		url,
		isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_ORIGIN }
	};
}

export function breadcrumbListJsonLd(pathname: string): Record<string, unknown> | null {
	const items = breadcrumbItems(pathname);
	if (items.length === 0) return null;
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			item: item.url
		}))
	};
}
