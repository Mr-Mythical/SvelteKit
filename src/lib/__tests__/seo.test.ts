import { describe, expect, it } from 'vitest';
import { ADDONS } from '$lib/data/addons';
import { PAGE_SEO, bossSeoDescription, bossSeoTitle, scoreLandingSeo } from '$lib/data/seoCopy';
import {
	breadcrumbItems,
	canonicalUrl,
	faqPageJsonLd,
	howToJsonLd,
	SITE_LOGO,
	SITE_NAME
} from '$lib/seo';

describe('canonicalUrl', () => {
	it('uses the site origin and pathname', () => {
		expect(canonicalUrl('/gearing')).toBe('https://mrmythical.com/gearing');
	});

	it('keeps a numeric score query', () => {
		expect(canonicalUrl('/rating-calculator', new URLSearchParams('score=1500'))).toBe(
			'https://mrmythical.com/rating-calculator?score=1500'
		);
	});

	it('drops tracking params and non-numeric scores', () => {
		expect(
			canonicalUrl('/rating-calculator', new URLSearchParams('score=abc&utm_source=discord'))
		).toBe('https://mrmythical.com/rating-calculator');
	});
});

describe('breadcrumbItems', () => {
	it('is empty on the homepage', () => {
		expect(breadcrumbItems('/')).toEqual([]);
	});

	it('labels a Mythic boss guide breadcrumb', () => {
		expect(
			breadcrumbItems('/raid/boss/nekzali-the-soulcoiler/mythic').map((item) => item.name)
		).toEqual(['Home', 'Raid', 'Bosses', "Nek'zali the Soulcoiler", 'Mythic']);
	});

	it('starts with Home and uses human labels', () => {
		expect(breadcrumbItems('/addons/dps-predictor')).toEqual([
			{ name: 'Home', url: 'https://mrmythical.com/' },
			{ name: 'Addons', url: 'https://mrmythical.com/addons' },
			{
				name: 'DPS Predictor & Gearing Dashboard',
				url: 'https://mrmythical.com/addons/dps-predictor'
			}
		]);
	});
});

describe('SEO copy bounds', () => {
	it('keeps shared titles and descriptions in SERP length bounds', () => {
		for (const page of Object.values(PAGE_SEO)) {
			expect(page.title.length, page.title).toBeLessThanOrEqual(60);
			expect(page.description.length, page.description).toBeLessThanOrEqual(160);
		}
		for (const addon of ADDONS) {
			expect(addon.seoTitle.length, addon.seoTitle).toBeLessThanOrEqual(60);
			expect(addon.seoDescription.length, addon.seoDescription).toBeLessThanOrEqual(160);
			expect(addon.seoDescription).not.toContain('—');
		}
		expect(SITE_NAME).toBe('Mr. Mythical');
		expect(SITE_LOGO).toBe('https://mrmythical.com/Logo.png');
		expect(scoreLandingSeo(1500).title.length).toBeLessThanOrEqual(60);
		expect(bossSeoTitle('Lightblinded Vanguard').length).toBeLessThanOrEqual(60);
		expect(bossSeoTitle("Nek'zali the Soulcoiler", 'heroic').length).toBeLessThanOrEqual(60);
		expect(bossSeoDescription('Lightblinded Vanguard').length).toBeLessThanOrEqual(160);
		expect(PAGE_SEO.raidBoss.description).toMatch(/Ula'tek/);
		expect(PAGE_SEO.raidBoss.description).toMatch(/PTR/);
		expect(
			bossSeoDescription(
				"Nek'zali the Soulcoiler",
				'Keep Restless Amani off the Soulcoil Well or she enrages at 100 energy.',
				'heroic'
			).length
		).toBeLessThanOrEqual(160);
	});
});

describe('structured data helpers', () => {
	it('builds FAQPage JSON-LD from questions', () => {
		expect(
			faqPageJsonLd([
				{
					question: "Was Ula'tek on the PTR?",
					answer: 'No. The guide will be updated when it is tested.'
				}
			])
		).toMatchObject({
			'@type': 'FAQPage',
			mainEntity: [{ '@type': 'Question', name: "Was Ula'tek on the PTR?" }]
		});
	});

	it('builds HowTo JSON-LD from role steps', () => {
		expect(
			howToJsonLd("Mythic Nek'zali the Soulcoiler quick guide", [
				{ name: 'Tanks', text: 'Face her away.' }
			])
		).toMatchObject({
			'@type': 'HowTo',
			name: "Mythic Nek'zali the Soulcoiler quick guide",
			step: [{ '@type': 'HowToStep', position: 1, name: 'Tanks' }]
		});
	});
});
