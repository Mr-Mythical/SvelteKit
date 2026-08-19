/** WarcraftLogs raid difficulty ids used by damage_averages / death_hotspots. */
export const WCL_DIFFICULTY = {
	heroic: 4,
	mythic: 5
} as const;

export type ChartDifficulty = keyof typeof WCL_DIFFICULTY;

export function wclDifficultyId(difficulty: ChartDifficulty): number {
	return WCL_DIFFICULTY[difficulty];
}

export function parseWclDifficultyParam(
	raw: string | null,
	fallback: ChartDifficulty = 'mythic'
): number {
	if (raw === 'heroic' || raw === '4') return WCL_DIFFICULTY.heroic;
	if (raw === 'mythic' || raw === '5') return WCL_DIFFICULTY.mythic;
	const parsed = Number(raw);
	if (parsed === WCL_DIFFICULTY.heroic || parsed === WCL_DIFFICULTY.mythic) return parsed;
	return WCL_DIFFICULTY[fallback];
}

export function raidChartQuery(bossId: number, difficulty: ChartDifficulty | number): string {
	const difficultyId = typeof difficulty === 'number' ? difficulty : wclDifficultyId(difficulty);
	return `bossId=${bossId}&difficulty=${difficultyId}`;
}
