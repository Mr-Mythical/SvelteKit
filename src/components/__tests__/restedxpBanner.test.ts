import { render } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import RestedXPBanner from '../restedxpBanner.svelte';

describe('RestedXPBanner', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	it('renders the first banner image on initial load', () => {
		const { container } = render(RestedXPBanner);

		const image = container.querySelector('img');
		expect(image).toBeTruthy();
		expect(image?.src).toBe(
			'https://shop.restedxp.com/wp-content/uploads/2025/03/rxp-web_banner-leaderboard.png'
		);
		expect(image?.alt).toBe('RestedXP - Level Faster');
	});

	it('renders the affiliate link with correct href', () => {
		const { container } = render(RestedXPBanner);

		const link = container.querySelector('a');
		expect(link).toBeTruthy();
		expect(link?.href).toBe('https://shop.restedxp.com/ref/Braunerr/');
		expect(link?.target).toBe('_blank');
		expect(link?.rel).toBe('noopener noreferrer');
	});

	it('renders banner indicators', () => {
		const { container } = render(RestedXPBanner);

		const indicators = container.querySelectorAll('button');
		expect(indicators).toHaveLength(5); // Should have 5 indicators for 5 banners
	});

	it('has proper image dimensions', () => {
		const { container } = render(RestedXPBanner);

		const image = container.querySelector('img');
		expect(image?.width).toBe(728);
		expect(image?.height).toBe(90);
	});

	it('applies hover effects and has proper styling', () => {
		const { container } = render(RestedXPBanner);

		const link = container.querySelector('a');
		expect(link?.className).toContain('hover:scale-105');
		expect(link?.className).toContain('transition-transform');

		const image = container.querySelector('img');
		expect(image?.className).toContain('block');
		expect(image?.className).toContain('h-auto');
		expect(image?.className).toContain('w-full');
	});
});
