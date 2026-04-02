export interface KeystoneBreakdown {
	level: number;
	count: number;
}

const DUNGEON_COUNT = 8;

export function scoreFormula(keyLevel: number, stars: number = 1): number {
	if (keyLevel < 2) {
		return 0;
	}

	const affixBreakpoints: Record<number, number> = {
		5: 15,
		7: 15,
		10: 15,
		12: 15
	};

	let parScore = 155;
	for (let current = 2; current < keyLevel; current++) {
		parScore += 15;
		const nextLevel = current + 1;
		if (affixBreakpoints[nextLevel]) {
			parScore += affixBreakpoints[nextLevel];
		}
	}

	let timeAdjustment = 0;
	switch (stars) {
		case 1:
			timeAdjustment = 0;
			break;
		case 2:
			timeAdjustment = 7.5;
			break;
		case 3:
			timeAdjustment = 15;
			break;
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

	if (targetScore >= 1240) {
		for (let i = 0; i < 30; i++) {
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
				tempScore -= 155;
				result.push(2);
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
