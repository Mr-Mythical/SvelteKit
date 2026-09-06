import { describe, expect, it } from 'vitest';
import { RaidDifficulty } from '$lib/raidDifficulty';

describe('raid chart difficulty', () => {
	it('maps guide names and WCL ids', () => {
		expect(RaidDifficulty.id('heroic')).toBe(4);
		expect(RaidDifficulty.id('mythic')).toBe(5);
		expect(RaidDifficulty.parse('heroic')).toBe(4);
		expect(RaidDifficulty.parse('4')).toBe(4);
		expect(RaidDifficulty.parse('mythic')).toBe(5);
		expect(RaidDifficulty.parse(null)).toBe(5);
	});

	it('builds chart API query strings', () => {
		expect(RaidDifficulty.query(3470, 'heroic')).toBe('bossId=3470&difficulty=4');
		expect(RaidDifficulty.query(3470, 5)).toBe('bossId=3470&difficulty=5');
	});

	it('covers Heroic and Mythic series', () => {
		expect(RaidDifficulty.covered).toEqual(['heroic', 'mythic']);
		expect(RaidDifficulty.coverageQueries(3470)).toEqual([
			{ difficulty: 'heroic', query: 'bossId=3470&difficulty=4' },
			{ difficulty: 'mythic', query: 'bossId=3470&difficulty=5' }
		]);
		expect(RaidDifficulty.label('heroic')).toBe('Heroic');
		expect(RaidDifficulty.label('mythic')).toBe('Mythic');
		expect(RaidDifficulty.other('heroic')).toBe('mythic');
		expect(RaidDifficulty.seriesStyle('heroic').borderDash).toEqual([]);
		expect(RaidDifficulty.seriesStyle('mythic').borderDash.length).toBeGreaterThan(0);
	});

	it('aligns Heroic and Mythic averages onto a shared timeline', () => {
		const aligned = RaidDifficulty.alignAverages({
			heroic: [
				{ time_seconds: 0, avg: 10 },
				{ time_seconds: 2, avg: 20 }
			],
			mythic: [{ time_seconds: 1, avg: 15 }]
		});
		expect(aligned.labels).toEqual(['0', '1', '2']);
		expect(aligned.values.heroic).toEqual([10, Number.NaN, 20]);
		expect(aligned.values.mythic).toEqual([Number.NaN, 15, Number.NaN]);
	});
});
