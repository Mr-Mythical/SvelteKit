/** WarcraftLogs raid difficulty ids used by damage_averages / death_hotspots. */
export const WCL_DIFFICULTY = {
	heroic: 4,
	mythic: 5
} as const;

export type ChartDifficulty = keyof typeof WCL_DIFFICULTY;

export type AveragePoint = {
	time_seconds: number;
	avg: number;
};

export type DifficultySeriesStyle = {
	borderColor: string;
	backgroundColor: string;
	borderDash: number[];
};

export class RaidDifficulty {
	static readonly ids = WCL_DIFFICULTY;
	static readonly covered: readonly ChartDifficulty[] = ['heroic', 'mythic'];

	static id(difficulty: ChartDifficulty): number {
		return WCL_DIFFICULTY[difficulty];
	}

	static fromId(id: number): ChartDifficulty | null {
		if (id === WCL_DIFFICULTY.heroic) return 'heroic';
		if (id === WCL_DIFFICULTY.mythic) return 'mythic';
		return null;
	}

	static resolve(difficulty: ChartDifficulty | number): { name: ChartDifficulty; id: number } {
		if (typeof difficulty === 'number') {
			return { name: this.fromId(difficulty) ?? 'mythic', id: difficulty };
		}
		return { name: difficulty, id: WCL_DIFFICULTY[difficulty] };
	}

	static parse(raw: string | null, fallback: ChartDifficulty = 'mythic'): number {
		if (raw === 'heroic' || raw === '4') return WCL_DIFFICULTY.heroic;
		if (raw === 'mythic' || raw === '5') return WCL_DIFFICULTY.mythic;
		const parsed = Number(raw);
		if (parsed === WCL_DIFFICULTY.heroic || parsed === WCL_DIFFICULTY.mythic) return parsed;
		return WCL_DIFFICULTY[fallback];
	}

	static query(bossId: number, difficulty: ChartDifficulty | number): string {
		const difficultyId = typeof difficulty === 'number' ? difficulty : this.id(difficulty);
		return `bossId=${bossId}&difficulty=${difficultyId}`;
	}

	static coverageQueries(bossId: number): { difficulty: ChartDifficulty; query: string }[] {
		return this.covered.map((difficulty) => ({
			difficulty,
			query: this.query(bossId, difficulty)
		}));
	}

	static label(difficulty: ChartDifficulty): string {
		return difficulty === 'heroic' ? 'Heroic' : 'Mythic';
	}

	static other(difficulty: ChartDifficulty): ChartDifficulty {
		return difficulty === 'heroic' ? 'mythic' : 'heroic';
	}

	/** Solid crimson vs dashed rose so coverage is not color-only. */
	static seriesStyle(difficulty: ChartDifficulty): DifficultySeriesStyle {
		if (difficulty === 'heroic') {
			return {
				borderColor: 'hsl(348, 80%, 35%)',
				backgroundColor: 'hsla(348, 80%, 35%, 0.16)',
				borderDash: []
			};
		}
		return {
			borderColor: 'hsl(348, 55%, 58%)',
			backgroundColor: 'hsla(348, 55%, 58%, 0.16)',
			borderDash: [5, 3]
		};
	}

	static alignAverages(series: Partial<Record<ChartDifficulty, AveragePoint[]>>): {
		labels: string[];
		values: Record<ChartDifficulty, number[]>;
	} {
		const times = new Set<number>();
		for (const difficulty of this.covered) {
			for (const point of series[difficulty] ?? []) {
				times.add(point.time_seconds);
			}
		}
		const labels = [...times].sort((left, right) => left - right).map(String);
		const values = Object.fromEntries(
			this.covered.map((difficulty) => {
				const bySecond = new Map(
					(series[difficulty] ?? []).map((point) => [point.time_seconds, point.avg])
				);
				return [difficulty, labels.map((label) => bySecond.get(Number(label)) ?? Number.NaN)];
			})
		) as Record<ChartDifficulty, number[]>;
		return { labels, values };
	}
}
