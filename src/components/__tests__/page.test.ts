import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Page from '../../routes/+page.svelte';

describe('Homepage', () => {
	it('renders the main heading', () => {
		render(Page);

		expect(screen.getByText('Master World of Warcraft with Mr. Mythical')).toBeInTheDocument();
	});

	it('displays the main description', () => {
		render(Page);

		expect(
			screen.getByText(/Professional-grade tools for Mythic\+ enthusiasts/)
		).toBeInTheDocument();
	});

	it('has premium tools section', () => {
		render(Page);

		expect(screen.getByText('Premium WoW Tools for Competitive Players')).toBeInTheDocument();
	});

	it('renders main content structure', () => {
		render(Page);

		const main = screen.getByRole('main');
		expect(main).toBeInTheDocument();
		expect(main).toHaveClass('container', 'mx-auto');
	});
});
