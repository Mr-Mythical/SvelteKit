import { render } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PartnerShowcase from '../partnerShowcase.svelte';

describe('PartnerShowcase', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	it('renders the first banner image on initial load', () => {
		const { container } = render(PartnerShowcase);

		const image = container.querySelector('img');
		expect(image).toBeTruthy();
		expect(image?.src).toContain('rxp-web_banner-leaderboard.png');
		expect(image?.alt).toBe('RestedXP - Level Faster');
	});

	it('renders the affiliate link with correct href', () => {
		const { container } = render(PartnerShowcase);

		const link = container.querySelector('a');
		expect(link).toBeTruthy();
		expect(link?.href).toBe('https://shop.restedxp.com/ref/Braunerr/');
		expect(link?.target).toBe('_blank');
		expect(link?.rel).toBe('noopener noreferrer');
	});

	it('has correct structure', () => {
		const { container } = render(PartnerShowcase);

		const contentDiv = container.querySelector('div');
		const link = container.querySelector('a');
		const image = container.querySelector('img');

		expect(contentDiv).toBeTruthy();
		expect(link).toBeTruthy();
		expect(image).toBeTruthy();
	});

	it('has proper image dimensions', () => {
		const { container } = render(PartnerShowcase);

		const image = container.querySelector('img');
		expect(image?.width).toBe(728);
		expect(image?.height).toBe(90);
	});

	it('applies hover effects and has proper styling', () => {
		const { container } = render(PartnerShowcase);

		const link = container.querySelector('a');
		expect(link?.className).toContain('hover:scale-105');
		expect(link?.className).toContain('transition-transform');

		const image = container.querySelector('img');
		expect(image?.className).toContain('block');
		expect(image?.className).toContain('h-auto');
		expect(image?.className).toContain('w-full');
	});
});
