import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/svelte';
import BossPreviewChart from '../charts/bossPreviewChart.svelte';

vi.mock('svelte-chartjs', () => ({
	Chart: () => null
}));

function jsonResponse(body: unknown): Promise<Response> {
	return Promise.resolve({
		ok: true,
		json: () => Promise.resolve(body)
	} as Response);
}

describe('BossPreviewChart difficulty coverage', () => {
	beforeEach(() => {
		vi.mocked(fetch).mockReset();
		localStorage.clear();
	});

	it('requests both Heroic and Mythic damage series', async () => {
		vi.mocked(fetch).mockImplementation((input) => {
			const url = String(input);
			if (url.includes('difficulty=4')) {
				return jsonResponse([
					{ time_seconds: 0, avg: 100, std: 1, n: 5, ci: 1, encounter_id: 3470 }
				]);
			}
			if (url.includes('difficulty=5')) {
				return jsonResponse([
					{ time_seconds: 0, avg: 200, std: 1, n: 5, ci: 1, encounter_id: 3470 }
				]);
			}
			return jsonResponse([]);
		});

		render(BossPreviewChart, { props: { bossId: 3470, difficulty: 'heroic' } });

		await waitFor(() => {
			const urls = vi.mocked(fetch).mock.calls.map(([input]) => String(input));
			expect(urls).toContain('/api/damage-average?bossId=3470&difficulty=4');
			expect(urls).toContain('/api/damage-average?bossId=3470&difficulty=5');
		});
	});
});
