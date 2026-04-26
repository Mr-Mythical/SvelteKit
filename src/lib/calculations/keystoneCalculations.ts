export interface KeystoneBreakdown {
	level: number;
	count: number;
}

/**
 * Mythic+ scoring constants. Centralized here so a season tuning change is a
 * one-spot update instead of a grep-and-edit across the calculator.
 *
 * The values mirror Blizzard's published Mythic+ scoring formula:
 *   - A timed run at +2 is worth `BASE_SCORE_AT_LEVEL_2` (155).
 *   - Each subsequent key level adds `SCORE_PER_LEVEL_INCREMENT` (15).
 *   - Levels listed in `AFFIX_BREAKPOINTS` add an extra +15 the first time
 *     they apply (new affix slot unlock).
 *   - Time bonuses: 1-chest = +0, 2-chest = +7.5, 3-chest = +15.
 *   - The "fast path" branch in `computeRunLevelsForScore` kicks in at
 *     `FAST_PATH_TARGET` and otherwise we iterate +2 keys at the floor score.
 */
export const KEYSTONE_SCORING = {
	DUNGEONS_PER_SEASON: 8,
	MIN_TIMED_LEVEL: 2,
	BASE_SCORE_AT_LEVEL_2: 155,
	SCORE_PER_LEVEL_INCREMENT: 15,
	/** Levels at which a new affix slot unlocks, granting an extra +15. */
	AFFIX_BREAKPOINT_LEVELS: [5, 7, 10, 12] as const,
	AFFIX_BREAKPOINT_BONUS: 15,
	TIME_BONUS_BY_STARS: {
		1: 0,
		2: 7.5,
		3: 15
	} as const,
	/** Above this target score, distribute keys via the upper-bracket search. */
	FAST_PATH_TARGET: 1240,
	/** Highest key level the search will explore. */
	MAX_LEVEL_SEARCH: 30
} as const;

const DUNGEON_COUNT = KEYSTONE_SCORING.DUNGEONS_PER_SEASON;

export function scoreFormula(keyLevel: number, stars: number = 1): number {
	if (keyLevel < KEYSTONE_SCORING.MIN_TIMED_LEVEL) {
		return 0;
	}

	const affixBreakpoints: Record<number, number> = Object.fromEntries(
		KEYSTONE_SCORING.AFFIX_BREAKPOINT_LEVELS.map((level) => [
			level,
			KEYSTONE_SCORING.AFFIX_BREAKPOINT_BONUS
		])
	);

	let parScore = KEYSTONE_SCORING.BASE_SCORE_AT_LEVEL_2;
	for (let current = KEYSTONE_SCORING.MIN_TIMED_LEVEL; current < keyLevel; current++) {
		parScore += KEYSTONE_SCORING.SCORE_PER_LEVEL_INCREMENT;
		const nextLevel = current + 1;
		if (affixBreakpoints[nextLevel]) {
			parScore += affixBreakpoints[nextLevel];
		}
	}

	// Stars come from Blizzard's keystone result and are always 1, 2, or 3 for
	// timed runs (1 = timed, 2 = +1 chest, 3 = +2 chest). Anything outside
	// that range — including the legacy 0 we sometimes see for untimed runs —
	// contributes no time bonus and we surface it explicitly rather than via a
	// silent fallback in the index expression.
	const STAR_BONUSES = KEYSTONE_SCORING.TIME_BONUS_BY_STARS;
	let timeAdjustment: number;
	if (stars === 1 || stars === 2 || stars === 3) {
		timeAdjustment = STAR_BONUSES[stars];
	} else {
		timeAdjustment = 0;
	}
	return parScore + timeAdjustment;
}

// Returns the exact run levels array following component logic
export function computeRunLevelsForScore(
	targetScore: number,
	dungeonCount: number = DUNGEON_COUNT
): number[] {
	const result: number[] = [];
	if (targetScore <= 0) return result;

	const scorePerDungeon = targetScore / dungeonCount;
	let runScore: number;

	if (targetScore >= KEYSTONE_SCORING.FAST_PATH_TARGET) {
		for (let i = 0; i < KEYSTONE_SCORING.MAX_LEVEL_SEARCH; i++) {
			runScore = Math.round(scoreFormula(i, 1));
			if (scorePerDungeon === runScore) {
				for (let j = 0; j < dungeonCount; j++) result.push(i);
				return result;
			} else if (runScore > scorePerDungeon) {
				const baseScore = Math.round(scoreFormula(i - 1, 1));
				let scoreDifference = Math.round(targetScore - baseScore * dungeonCount);

				for (let j = 0; j < dungeonCount; j++) {
					if (scoreDifference > 0) {
						scoreDifference -= scoreFormula(i, 1) - scoreFormula(i - 1, 1);
						result.push(i);
					} else {
						result.push(i - 1);
					}
				}
				return result;
			}
		}
	} else {
		let tempScore = targetScore;
		for (let i = 0; i < dungeonCount; i++) {
			if (tempScore > 0) {
				tempScore -= KEYSTONE_SCORING.BASE_SCORE_AT_LEVEL_2;
				result.push(KEYSTONE_SCORING.MIN_TIMED_LEVEL);
			} else {
				result.push(0);
			}
		}
		return result;
	}

	return result;
}

// Converts run levels to a compact breakdown by level
export function calculateKeystoneBreakdown(
	targetScore: number,
	dungeonCount: number = DUNGEON_COUNT
): KeystoneBreakdown[] {
	const levels = computeRunLevelsForScore(targetScore, dungeonCount);
	const counts = new Map<number, number>();
	for (const lvl of levels) {
		if (lvl > 0) counts.set(lvl, (counts.get(lvl) ?? 0) + 1);
	}
	return Array.from(counts.entries())
		.sort((a, b) => a[0] - b[0])
		.map(([level, count]) => ({ level, count }));
}
