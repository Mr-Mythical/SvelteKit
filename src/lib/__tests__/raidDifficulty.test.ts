import { describe, expect, it } from 'vitest';
import { parseWclDifficultyParam, raidChartQuery, wclDifficultyId } from '$lib/raidDifficulty';

describe('raid chart difficulty', () => {
	it('maps guide names and WCL ids', () => {
		expect(wclDifficultyId('heroic')).toBe(4);
		expect(wclDifficultyId('mythic')).toBe(5);
		expect(parseWclDifficultyParam('heroic')).toBe(4);
		expect(parseWclDifficultyParam('4')).toBe(4);
		expect(parseWclDifficultyParam('mythic')).toBe(5);
		expect(parseWclDifficultyParam(null)).toBe(5);
	});

	it('builds chart API query strings', () => {
		expect(raidChartQuery(3470, 'heroic')).toBe('bossId=3470&difficulty=4');
		expect(raidChartQuery(3470, 5)).toBe('bossId=3470&difficulty=5');
	});
});
