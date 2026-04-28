import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Page from '../../routes/+page.svelte';

describe('Homepage', () => {
	it('renders the score calculator section', () => {
		render(Page);

		expect(screen.getByText('See the keys you need.')).toBeInTheDocument();
	});

	it('displays the score calculator description', () => {
		render(Page);

		expect(
			screen.getByText(/Set a target rating and see the keystones that get you there/)
		).toBeInTheDocument();
	});

	it('has a raid log visualizer section', () => {
		render(Page);

		expect(screen.getByText('Visualize your raid logs.')).toBeInTheDocument();
	});

	it('renders main content structure', () => {
		render(Page);

		const main = screen.getByRole('main');
		expect(main).toBeInTheDocument();
		expect(main).toHaveClass('home');
	});
});
