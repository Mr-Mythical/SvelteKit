import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Page from '../../routes/+page.svelte';

const homeData = {
	validation: {
		upgrade_picks_pct: 96.4,
		upgrade_size_error_pct: 0.41,
		dps_read_error_pct: 1.22,
		spec_count: 36,
		checked_label: '12 Aug 2026'
	}
};

function renderHome() {
	return render(Page, { props: { data: homeData } });
}

describe('Homepage', () => {
	it('renders the score calculator section', () => {
		renderHome();

		expect(screen.getByText('See the keys you need.')).toBeInTheDocument();
	});

	it('displays the score calculator description', () => {
		renderHome();

		expect(
			screen.getByText(/Set a target rating and see the keystones that get you there/)
		).toBeInTheDocument();
	});

	it('has a raid log visualizer section', () => {
		renderHome();

		expect(screen.getByText('Visualize your raid logs.')).toBeInTheDocument();
	});

	it('has a farm priority gearing section with accuracy', () => {
		renderHome();

		expect(screen.getByText('See what to farm first, instantly.')).toBeInTheDocument();
		expect(
			screen.getByText('Typical farm scans finish immediately, with no SimC wait')
		).toBeInTheDocument();
		expect(screen.getByText('96.4%')).toBeInTheDocument();
		expect(screen.getByText('upgrade picks')).toBeInTheDocument();
	});

	it('staggers toolkit headlines left and right', () => {
		const { container } = renderHome();

		const rows = [...container.querySelectorAll('.tools > .tool-row')];
		expect(rows).toHaveLength(5);
		expect(rows[0]).not.toHaveClass('tool-row--reverse');
		expect(rows[1]).toHaveClass('tool-row--reverse');
		expect(rows[2]).not.toHaveClass('tool-row--reverse');
		expect(rows[3]).toHaveClass('tool-row--reverse');
		expect(rows[4]).not.toHaveClass('tool-row--reverse');
		expect(container.querySelector('.discord')).toHaveClass('discord--reverse');

		const headings = screen.getAllByRole('heading').map((heading) => heading.textContent);
		expect(headings).toEqual([
			'Mr. Mythical',
			'See the keys you need.',
			'See what to farm first, instantly.',
			'Visualize your raid logs.',
			'Read the spikes that decide pulls.',
			'Mr. Mythical addons',
			'Join the Discord',
			'Built by a player, for keys and pulls.'
		]);
		expect(
			screen.getByRole('heading', { level: 2, name: 'See what to farm first, instantly.' })
		).toBeInTheDocument();
	});

	it('renders main content structure', () => {
		renderHome();

		const main = screen.getByRole('main');
		expect(main).toBeInTheDocument();
		expect(main).toHaveClass('home');
	});
});
