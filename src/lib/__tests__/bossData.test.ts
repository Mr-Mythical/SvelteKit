import { describe, expect, it } from 'vitest';
import { SITE_ROUTES } from '$lib/data/siteRoutes';
import { bossSeoDescription, bossSeoTitle } from '$lib/data/seoCopy';
import { spellsFromText } from '$lib/guideText';
import {
	bossGuidePath,
	bosses,
	currentSeasonBosses,
	groupedBosses,
	hasSplitGuides,
	listedBossGuides,
	defaultChartDifficulty,
	type BossGuide
} from '$lib/types/bossData';

function guideProse(guide: BossGuide): string {
	return [
		guide.intro,
		...(guide.overview ?? []),
		...(guide.changes ?? []),
		...(guide.phases ?? []).flatMap((phase) => phase.body),
		guide.kills,
		guide.quick?.tanks,
		guide.quick?.healers,
		guide.quick?.dps,
		...(guide.faqs ?? []).map((faq) => faq.answer)
	]
		.filter(Boolean)
		.join('\n');
}

const VENOMOUS_ABYSS_SLUGS = [
	'nekzali-the-soulcoiler',
	'entombed-sentinels',
	'the-lost-explorers',
	'vashnik-the-malignant',
	'sszorak',
	'the-twin-fangs',
	'the-coiled-altar',
	'ulatek'
] as const;

function walkthroughBosses() {
	return currentSeasonBosses().filter((boss) => boss.slug !== 'ulatek');
}

describe('raid boss catalog', () => {
	it('keeps encounter ids and slugs unique', () => {
		const ids = bosses.map((boss) => boss.id);
		const slugs = bosses.map((boss) => boss.slug);
		expect(new Set(ids).size).toBe(ids.length);
		expect(new Set(slugs).size).toBe(slugs.length);
	});

	it('lists all eight Venomous Abyss bosses for Season 2', () => {
		const seasonBosses = currentSeasonBosses();
		expect(seasonBosses.map((boss) => boss.slug)).toEqual([...VENOMOUS_ABYSS_SLUGS]);
		expect(seasonBosses.every((boss) => hasSplitGuides(boss))).toBe(true);
		expect(seasonBosses.every((boss) => defaultChartDifficulty(boss) === 'heroic')).toBe(true);
	});

	it('writes Season 2 Heroic and Mythic guides as phase walkthroughs with inline spells', () => {
		for (const boss of walkthroughBosses()) {
			expect(hasSplitGuides(boss), boss.slug).toBe(true);
			for (const { difficulty, guide } of listedBossGuides(boss)) {
				const label = `${boss.slug} ${difficulty}`;
				expect(guide.overview?.length, label).toBeGreaterThanOrEqual(1);
				expect(guide.phases?.length, label).toBeGreaterThanOrEqual(2);
				expect(guide.quick, label).toBeDefined();
				expect(guide.faqs?.length, label).toBeGreaterThan(0);
				expect(guide.teaser, label).toBeTruthy();
				const copy = JSON.stringify(guide);
				expect(copy, label).toMatch(/\[\[\d+:[^\]]+\]\]/);
				expect(copy, label).not.toContain('—');
				expect(copy, label).not.toMatch(/Adds to Normal|on Heroic|On Mythic/);
			}
		}
	});

	it('uses Wowhead tooltips for named Season 2 abilities in both guides', () => {
		for (const boss of walkthroughBosses()) {
			for (const { difficulty, guide } of listedBossGuides(boss)) {
				const prose = guideProse(guide);
				const spells = spellsFromText(prose);
				expect(spells.length, `${boss.slug} ${difficulty}`).toBeGreaterThanOrEqual(8);
				const leftover = prose.replace(/\[\[\d+:[^\]]+\]\]/g, '');
				for (const { name } of [...spells].sort((a, b) => b.name.length - a.name.length)) {
					expect(leftover.includes(name), `${boss.slug} ${difficulty} leftover ${name}`).toBe(
						false
					);
				}
			}
		}
	});

	it('keeps Heroic and Mythic teasers distinct for Season 2', () => {
		for (const boss of currentSeasonBosses()) {
			expect(boss.guides?.heroic.teaser, boss.slug).toBe(boss.teaser);
			expect(boss.guides?.mythic.teaser, boss.slug).not.toBe(boss.guides?.heroic.teaser);
		}
	});

	it('does not nickname Season 2 phases or intermissions', () => {
		for (const boss of currentSeasonBosses()) {
			for (const { difficulty, guide } of listedBossGuides(boss)) {
				for (const phase of guide.phases ?? []) {
					expect(phase.title, `${boss.slug} ${difficulty}`).not.toMatch(
						/^(Phase \d+|Intermission):/
					);
				}
			}
		}
	});

	it('lists Mythic-only change bullets on Season 2 guides', () => {
		for (const boss of walkthroughBosses()) {
			expect(boss.guides?.heroic.changes, boss.slug).toBeUndefined();
			expect(boss.guides?.mythic.changes?.length, boss.slug).toBeGreaterThanOrEqual(2);
		}
	});

	it("holds a PTR stub for Ula'tek until the fight is tested", () => {
		const boss = currentSeasonBosses().find((entry) => entry.slug === 'ulatek');
		expect(boss).toBeDefined();
		expect(hasSplitGuides(boss!), 'ulatek').toBe(true);
		for (const { difficulty, guide } of listedBossGuides(boss!)) {
			expect(guide.phases, `ulatek ${difficulty}`).toBeUndefined();
			expect(guide.quick, `ulatek ${difficulty}`).toBeUndefined();
			expect(guide.faqs?.length, `ulatek ${difficulty}`).toBeGreaterThan(0);
			expect(guide.intro, `ulatek ${difficulty}`).toMatch(/not on the PTR/i);
			expect(guide.overview?.join(' '), `ulatek ${difficulty}`).toMatch(/Check back here for the/);
			expect(JSON.stringify(guide.faqs), `ulatek ${difficulty}`).toMatch(/PTR/);
			expect(JSON.stringify(guide), `ulatek ${difficulty}`).not.toContain('—');
			expect(
				bossSeoDescription(boss!.name, guide.teaser ?? boss!.teaser, difficulty),
				`ulatek ${difficulty} meta`
			).toMatch(/PTR/);
		}
		expect(boss?.guides?.mythic.changes).toBeUndefined();
	});

	it('groups raids with the current season first', () => {
		const groups = groupedBosses();
		expect(groups[0]?.raidId).toBe('venomous-abyss');
		expect(groups[0]?.bosses).toHaveLength(8);
	});

	it('keeps boss SEO copy inside SERP length bounds', () => {
		for (const boss of bosses) {
			const listings = listedBossGuides(boss);
			for (const { difficulty, guide } of listings) {
				expect(
					bossSeoTitle(boss.name, difficulty).length,
					`${boss.name} ${difficulty}`
				).toBeLessThanOrEqual(60);
				expect(
					bossSeoDescription(boss.name, guide.teaser ?? boss.teaser, difficulty).length,
					`${boss.slug} ${difficulty}`
				).toBeLessThanOrEqual(160);
			}
		}
	});

	it('publishes Heroic and Mythic Season 2 pages in the sitemap', () => {
		const paths = new Set(SITE_ROUTES.map((route) => route.path));
		for (const slug of VENOMOUS_ABYSS_SLUGS) {
			expect(paths.has(bossGuidePath(slug, 'heroic')), slug).toBe(true);
			expect(paths.has(bossGuidePath(slug, 'mythic')), `${slug} mythic`).toBe(true);
		}
		expect(paths.has('/raid/boss/nekzali-the-soulcoiler/heroic')).toBe(false);
		expect(paths.has('/raid/boss/imperator-averzian/mythic')).toBe(false);
		expect(paths.has('/raid/boss/imperator-averzian')).toBe(true);
		const heroic = SITE_ROUTES.find((route) => route.path === '/raid/boss/nekzali-the-soulcoiler');
		const mythic = SITE_ROUTES.find(
			(route) => route.path === '/raid/boss/nekzali-the-soulcoiler/mythic'
		);
		expect(heroic?.inFeed).toBe(true);
		expect(mythic?.inFeed).toBe(false);
		const ulatekHeroic = SITE_ROUTES.find((route) => route.path === '/raid/boss/ulatek');
		const ulatekMythic = SITE_ROUTES.find((route) => route.path === '/raid/boss/ulatek/mythic');
		expect(ulatekHeroic?.lastmod).toBe('2026-08-18');
		expect(ulatekMythic?.lastmod).toBe('2026-08-18');
		expect(ulatekHeroic?.description).toMatch(/PTR/);
		expect(ulatekMythic?.description).toMatch(/PTR/);
	});
});
