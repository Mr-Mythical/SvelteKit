<script lang="ts">
	import { onMount } from 'svelte';
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

	export let bossId: number;

	// Simple localStorage cache helpers with TTL
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

	interface AverageRecord {
		time_seconds: number;
		avg: number;
		std: number;
		n: number;
		ci: number;
		encounter_id: number;
	}

	let chartData: ChartData<'line', number[], string> | null = null;

	let loading = true;

	ChartJS.register(
		LineElement,
		PointElement,
		CategoryScale,
		LinearScale,
		LineController,
		Filler
	);

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

	onMount(async () => {
		try {
			const cacheKey = `damage-average:${bossId}`;
			const cached = getCache<AverageRecord[]>(cacheKey);
			let data: AverageRecord[] | null = cached;

			if (!data) {
				const response = await fetch(`/api/damage-average?bossId=${bossId}`);
				if (!response.ok) throw new Error('Failed to fetch data');
				data = await response.json();
				// Cache for 7 days
				setCache(cacheKey, data, 7 * 24 * 60 * 60 * 1000);
			}

			chartData = {
				labels: (data ?? []).map((d) => d.time_seconds.toString()),
				datasets: [
					{
						label: 'Average Damage',
						data: (data ?? []).map((d) => d.avg),
						borderColor: 'rgb(59, 130, 246)',
						backgroundColor: 'rgba(59, 130, 246, 0.1)',
						borderWidth: 2,
						fill: true
					}
				]
			};
		} catch (err) {
			console.error('Error loading preview chart:', err);
		} finally {
			loading = false;
		}
	});
</script>

{#if loading}
	<div class="flex h-full w-full items-center justify-center">
		<div class="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
	</div>
{:else if chartData}
	<div class="h-full w-full">
		<Chart type="line" data={chartData} options={options} />
	</div>
{/if}
