import { render } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import SidebarAd from '../layout/sidebarAd.svelte';

describe('SidebarAd', () => {
	it('renders an advertisement landmark', () => {
		const { container } = render(SidebarAd);

		const aside = container.querySelector('aside');
		expect(aside).toBeTruthy();
		expect(aside?.getAttribute('aria-label')).toBe('Advertisement');
	});

	it('falls back to Patreon when no AdSense slot is configured', () => {
		const { container } = render(SidebarAd);

		const link = container.querySelector('a');
		expect(link).toBeTruthy();
		expect(link?.href).toBe('https://www.patreon.com/MrMythical');
		expect(link?.target).toBe('_blank');
		expect(link?.rel).toBe('noopener noreferrer');
		expect(container.querySelector('.adsbygoogle')).toBeNull();
	});
});
