<script lang="ts">
	import { Chart } from 'svelte-chartjs';
	import {
		Chart as ChartJS,
		LineElement,
		PointElement,
		CategoryScale,
		LinearScale,
		LineController,
		Filler
	} from 'chart.js';
	import type { ChartData, ChartOptions } from 'chart.js';
	import { logClientError } from '$lib/clientLog';
	import { RaidDifficulty, type AveragePoint, type ChartDifficulty } from '$lib/raidDifficulty';

	interface Props {
		bossId: number;
		/** Highlight this difficulty; both Heroic and Mythic series still load. */
		difficulty?: ChartDifficulty | number;
	}

	let { bossId, difficulty = 'heroic' }: Props = $props();
	let emphasized = $derived(RaidDifficulty.resolve(difficulty).name);

	function getCache<T>(key: string): T | null {
		try {
			const raw = localStorage.getItem(key);
			if (!raw) return null;
			const parsed = JSON.parse(raw);
			if (!parsed || typeof parsed !== 'object') return null;
			const { ts, ttl, value } = parsed as { ts: number; ttl: number; value: T };
			if (!ts || !ttl) return null;
			const now = Date.now();
			if (now - ts > ttl) {
				localStorage.removeItem(key);
				return null;
			}
			return value as T;
		} catch {
			return null;
		}
	}

	function setCache<T>(key: string, value: T, ttlMs: number): void {
		try {
			localStorage.setItem(key, JSON.stringify({ ts: Date.now(), ttl: ttlMs, value }));
		} catch {
			// ignore storage errors
		}
	}

	interface AverageRecord extends AveragePoint {
		std: number;
		n: number;
		ci: number;
		encounter_id: number;
	}

	let chartData: ChartData<'line', number[], string> | null = $state(null);

	let loading = $state(true);

	ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, LineController, Filler);

	const options: ChartOptions<'line'> = {
		responsive: true,
		maintainAspectRatio: false,
		scales: {
			x: {
				display: false
			},
			y: {
				display: false
			}
		},
		plugins: {
			legend: {
				display: false
			},
			tooltip: {
				enabled: false
			}
		},
		elements: {
			point: {
				radius: 0
			},
			line: {
				tension: 0.4
			}
		},
		interaction: {
			mode: 'index',
			intersect: false
		}
	};

	async function loadSeries(id: number, diff: ChartDifficulty): Promise<AverageRecord[]> {
		const diffId = RaidDifficulty.id(diff);
		const cacheKey = `damage-average:${id}:${diffId}`;
		const cached = getCache<AverageRecord[]>(cacheKey);
		if (cached) return cached;
		const response = await fetch(`/api/damage-average?${RaidDifficulty.query(id, diff)}`);
		if (!response?.ok) throw new Error('Failed to fetch data');
		const data = (await response.json()) as AverageRecord[];
		if (!Array.isArray(data)) return [];
		setCache(cacheKey, data, 7 * 24 * 60 * 60 * 1000);
		return data;
	}

	async function loadChart(id: number, primary: ChartDifficulty) {
		loading = true;
		chartData = null;
		try {
			const loaded = await Promise.all(
				RaidDifficulty.covered.map(async (diff) => {
					try {
						return [diff, await loadSeries(id, diff)] as const;
					} catch (err) {
						logClientError('bossPreviewChart', `failed to load ${diff} preview series`, err);
						return [diff, [] as AverageRecord[]] as const;
					}
				})
			);

			if (id !== bossId || primary !== emphasized) return;

			const series = Object.fromEntries(loaded) as Record<ChartDifficulty, AverageRecord[]>;
			const aligned = RaidDifficulty.alignAverages(series);
			if (aligned.labels.length === 0) return;

			chartData = {
				labels: aligned.labels,
				datasets: RaidDifficulty.covered.map((diff) => {
					const style = RaidDifficulty.seriesStyle(diff);
					return {
						label: RaidDifficulty.label(diff),
						data: aligned.values[diff],
						borderColor: style.borderColor,
						backgroundColor: style.backgroundColor,
						borderDash: style.borderDash,
						borderWidth: diff === primary ? 2 : 1.5,
						fill: false,
						spanGaps: true
					};
				})
			};
		} catch (err) {
			logClientError('bossPreviewChart', 'failed to load preview chart', err);
		} finally {
			if (id === bossId && primary === emphasized) loading = false;
		}
	}

	$effect(() => {
		void loadChart(bossId, emphasized);
	});
</script>

{#if loading}
	<div class="flex h-full w-full items-center justify-center">
		<div
			class="border-primary h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
		></div>
	</div>
{:else if chartData}
	<div class="h-full w-full">
		<p class="sr-only">Heroic (solid) and Mythic (dashed) average damage taken</p>
		<Chart type="line" data={chartData} {options} />
	</div>
{/if}
