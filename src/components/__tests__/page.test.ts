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

	it('has a gearing dashboard section', () => {
		render(Page);

		expect(screen.getByText('Scan season loot against your gear.')).toBeInTheDocument();
	});

	it('staggers toolkit headlines left, right, then left', () => {
		const { container } = render(Page);

		const rows = [...container.querySelectorAll('.tools > .tool-row')];
		expect(rows[0]).toHaveClass('tool-row--planner');
		expect(rows[1]).toHaveClass('tool-row--reverse');
		expect(rows[2]).not.toHaveClass('tool-row--reverse');
		expect(rows[3]).toHaveClass('tool-row--featured');

		const headings = screen.getAllByRole('heading').map((heading) => heading.textContent);
		expect(headings).toEqual([
			'Mr. Mythical',
			'See the keys you need.',
			'Scan season loot against your gear.',
			'Visualize your raid logs.',
			'Read the spikes that decide pulls.',
			'Mr. Mythical addons',
			'Join the Discord',
			'Built by a player, for keys and pulls.'
		]);
	});

	it('renders main content structure', () => {
		render(Page);

		const main = screen.getByRole('main');
		expect(main).toBeInTheDocument();
		expect(main).toHaveClass('home');
	});
});
