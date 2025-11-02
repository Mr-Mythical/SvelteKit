import { render } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ContentShowcase from '../contentShowcase.svelte';

describe('ContentShowcase', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	it('renders the first banner image on initial load', () => {
		const { container } = render(ContentShowcase);

		const image = container.querySelector('img');
		expect(image).toBeTruthy();
		expect(image?.src).toContain('content-default.png');
		expect(image?.alt).toBe('Gaming Guide - Level Faster');
	});

	it('renders the content link with correct href', () => {
		const { container } = render(ContentShowcase);

		const link = container.querySelector('a');
		expect(link).toBeTruthy();
		expect(link?.href).toBe('https://shop.restedxp.com/ref/Braunerr/');
		expect(link?.target).toBe('_blank');
		expect(link?.rel).toBe('noopener noreferrer');
	});

	it('has correct structure', () => {
		const { container } = render(ContentShowcase);

		const contentDiv = container.querySelector('div');
		const link = container.querySelector('a');
		const image = container.querySelector('img');

		expect(contentDiv).toBeTruthy();
		expect(link).toBeTruthy();
		expect(image).toBeTruthy();
	});

	it('has proper image dimensions', () => {
		const { container } = render(ContentShowcase);

		const image = container.querySelector('img');
		expect(image?.width).toBe(728);
		expect(image?.height).toBe(90);
	});

	it('applies hover effects and has proper styling', () => {
		const { container } = render(ContentShowcase);

		const link = container.querySelector('a');
		expect(link?.className).toContain('hover:scale-105');
		expect(link?.className).toContain('transition-transform');

		const image = container.querySelector('img');
		expect(image?.className).toContain('block');
		expect(image?.className).toContain('h-auto');
		expect(image?.className).toContain('w-full');
	});
});
