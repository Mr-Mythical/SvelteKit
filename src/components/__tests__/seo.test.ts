import { afterEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import { page } from '$app/state';
import SEO from '../seo.svelte';

function jsonLdText(): string {
	return [...document.head.querySelectorAll('script[type="application/ld+json"]')]
		.map((el) => el.textContent ?? '')
		.join('\n');
}

function setPageUrl(href: string) {
	(page as { url: URL }).url = new URL(href);
}

describe('SEO component', () => {
	afterEach(() => {
		setPageUrl('http://localhost/');
		document.head.innerHTML = '';
	});

	it('emits stable site JSON-LD without SearchAction on the homepage', () => {
		setPageUrl('https://mrmythical.com/');
		render(SEO, { props: { title: 'Home', description: 'Desc' } });

		const blobs = jsonLdText();
		expect(blobs).not.toContain('SearchAction');
		expect(blobs).toContain('"@type":"WebSite"');
		expect(blobs).toContain('"name":"Mr. Mythical"');
		expect(blobs).toContain('"url":"https://mrmythical.com"');
		expect(blobs).not.toContain('BreadcrumbList');
		expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
			'https://mrmythical.com/'
		);
		expect(document.querySelector('meta[property="og:site_name"]')?.getAttribute('content')).toBe(
			'Mr. Mythical'
		);
	});

	it('keeps numeric score on canonical and adds breadcrumbs on nested routes', () => {
		setPageUrl('https://mrmythical.com/rating-calculator?score=1500&utm_source=x');
		render(SEO, {
			props: { title: '1500 Mythic+ Rating | Mr. Mythical', description: 'Plan.' }
		});

		expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
			'https://mrmythical.com/rating-calculator?score=1500'
		);
		expect(jsonLdText()).toContain('BreadcrumbList');
		expect(jsonLdText()).toContain('Mythic+ calculator');
	});
});
