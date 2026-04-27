<script lang="ts">


	import { onDestroy, onMount } from 'svelte';
	import { Chart } from 'svelte-chartjs';
	import {
		Chart as ChartJS,
		LineElement,
		BarElement,
		PointElement,
		CategoryScale,
		LinearScale,
		Tooltip,
		Legend,
		LineController,
		BarController,
		Title,
		Filler
	} from 'chart.js';
	import type { Chart as ChartInstance, ChartData, ChartOptions } from 'chart.js';
	import { backgroundColorPlugin } from '$lib/ui/chartCanvasPlugin';
	import { logClientError } from '$lib/clientLog';

	let zoomPluginLoaded = $state(false);

	let zoomPlugin;
	onMount(async () => {
		const module = await import('chartjs-plugin-zoom');
		zoomPlugin = module.default;
		ChartJS.register(zoomPlugin);
		zoomPluginLoaded = true;
	});

	interface Props {
		encounterId: number;
		encounterName?: string;
	}

	let { encounterId, encounterName = 'Unknown Encounter' }: Props = $props();
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

	interface DeathRateRecord {
		time_seconds: number;
		death_count: number;
		sample_count: number;
	}

	const DEATH_LINE_COLOR = 'hsl(348, 75%, 81%)';

	let chartData: ChartData<'line' | 'bar', number[], string> = $state({
		labels: [],
		datasets: []
	});

	let loading = $state(false);
	let error: string | null = $state(null);

	const FULL_ZOOM_SCROLL_RELEASE_DELAY_MS = 1000;
	let zoomLabelElement = $state<HTMLDivElement>();
	let chartInstance = $state<ChartInstance<'line' | 'bar'> | null>(null);
	let fullZoomScrollReleaseUntil = 0;
	let fullZoomScrollReleaseTimeout: ReturnType<typeof setTimeout> | undefined;
	let lastZoomLevel = 1;

	type ZoomAwareChart = ChartInstance;

	type WheelLikeEvent = {
		deltaY?: number;
		native?: { deltaY?: number };
		srcEvent?: { deltaY?: number };
	};

	function getWheelDeltaY(event: Event): number | null {
		const wheelEvent = event as WheelLikeEvent;
		const directDelta = wheelEvent.deltaY;
		if (typeof directDelta === 'number' && Number.isFinite(directDelta) && directDelta !== 0) {
			return directDelta;
		}
		const nativeDelta = wheelEvent.native?.deltaY;
		if (typeof nativeDelta === 'number' && Number.isFinite(nativeDelta) && nativeDelta !== 0) {
			return nativeDelta;
		}
		const sourceDelta = wheelEvent.srcEvent?.deltaY;
		if (typeof sourceDelta === 'number' && Number.isFinite(sourceDelta) && sourceDelta !== 0) {
			return sourceDelta;
		}
		return null;
	}

	function getChartZoomLevel(chart: ZoomAwareChart) {
		const xScale = chart.scales?.x;
		const scaleLabels =
			typeof xScale?.getLabels === 'function' ? xScale.getLabels() : chart.data.labels;
		const labelCount = Array.isArray(scaleLabels) ? scaleLabels.length : 0;
		const fullRange = Math.max(1, labelCount - 1);
		const visibleMin = typeof xScale?.min === 'number' ? xScale.min : 0;
		const visibleMax = typeof xScale?.max === 'number' ? xScale.max : fullRange;
		const visibleRange = Math.max(1, visibleMax - visibleMin);
		const zoomLevel = fullRange / visibleRange;
		return Number.isFinite(zoomLevel) && zoomLevel > 0 ? Math.max(1, zoomLevel) : 1;
	}

	function holdFullZoomScrollRelease() {
		fullZoomScrollReleaseUntil = Date.now() + FULL_ZOOM_SCROLL_RELEASE_DELAY_MS;
		if (fullZoomScrollReleaseTimeout) clearTimeout(fullZoomScrollReleaseTimeout);
		fullZoomScrollReleaseTimeout = setTimeout(() => {
			fullZoomScrollReleaseUntil = 0;
			fullZoomScrollReleaseTimeout = undefined;
		}, FULL_ZOOM_SCROLL_RELEASE_DELAY_MS);
	}

	function isFullZoomScrollReleaseHeld() {
		return Date.now() < fullZoomScrollReleaseUntil;
	}

	function updateZoomLabel(chart: ZoomAwareChart) {
		const normalizedZoomLevel = getChartZoomLevel(chart);
		const nextZoomPercent = Math.max(100, Math.round(normalizedZoomLevel * 100));
		if (zoomLabelElement) {
			zoomLabelElement.textContent = `Zoom ${nextZoomPercent}%`;
		}
		if (lastZoomLevel > 1.001 && normalizedZoomLevel <= 1.001) {
			holdFullZoomScrollRelease();
		}
		lastZoomLevel = normalizedZoomLevel;
	}

	function shouldStartWheelZoom({ chart, event }: { chart: ZoomAwareChart; event: Event }) {
		const deltaY = getWheelDeltaY(event);
		if (deltaY === null) return true;
		const isZoomingOut = deltaY >= 0;
		const isChartZoomed = getChartZoomLevel(chart) > 1.001;
		if (isZoomingOut && !isChartZoomed) return isFullZoomScrollReleaseHeld();
		return true;
	}

	function zoomIn() {
		if (!chartInstance) return;
		(chartInstance as ZoomAwareChart & { zoom: (f: number) => void }).zoom(1.25);
		updateZoomLabel(chartInstance as ZoomAwareChart);
	}

	function zoomOut() {
		if (!chartInstance) return;
		(chartInstance as ZoomAwareChart & { zoom: (f: number) => void }).zoom(0.8);
		updateZoomLabel(chartInstance as ZoomAwareChart);
	}

	function resetZoom() {
		if (!chartInstance) return;
		(chartInstance as ZoomAwareChart & { resetZoom: () => void }).resetZoom();
		updateZoomLabel(chartInstance as ZoomAwareChart);
	}

	onDestroy(() => {
		if (fullZoomScrollReleaseTimeout) clearTimeout(fullZoomScrollReleaseTimeout);
	});

	ChartJS.register(
		LineElement,
		BarElement,
		PointElement,
		CategoryScale,
		LinearScale,
		Tooltip,
		Legend,
		LineController,
		BarController,
		Title,
		Filler,
		backgroundColorPlugin
	);

	const options: ChartOptions<'line' | 'bar'> = $state({
		responsive: true,
		maintainAspectRatio: false,
		plugins: {
			title: {
				display: true,
				text: encounterName,
				color: '#FFF9F5',
				font: { size: 18 }
			},
			tooltip: {
				mode: 'index',
				intersect: false,
				callbacks: {
					title: (context) => {
						const seconds = context[0].parsed.x;
						if (seconds == null) return '';
						const minutes = Math.floor(seconds / 60);
						const remainingSeconds = seconds % 60;
						return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
					},
					label: (context) => {
						const value = context.parsed.y;
						if (value == null) return '';
						const datasetIndex = context.datasetIndex;
						const datasetLabel = context.dataset.label;
						const formatted = Number(value.toFixed(2)).toLocaleString();

						const chart = context.chart;
						const data = chart.data.datasets;

						if (datasetLabel === 'Deaths per pull') {
							return `Deaths per pull: ${Number(value.toFixed(3)).toLocaleString()}`;
						}

						switch (datasetIndex) {
							case 0:
								return `Average: ${formatted}`;
							case 1: {
								const low = data[2].data[context.dataIndex];
								return `Standard Deviation Range: ${low ? low.toLocaleString() : 'N/A'} - ${formatted}`;
							}
							case 3: {
								const low = data[4].data[context.dataIndex];
								return `Confidence Interval Range: ${low ? low.toLocaleString() : 'N/A'} - ${formatted}`;
							}
							default:
								return '';
						}
					}
				}
			},
			legend: {
				display: true,
				position: 'top',
				labels: {
					color: '#FFF9F5',
					font: { size: 12 },
					filter: (item) => !!item.text
				}
			},
			zoom: {
				pan: {
					enabled: true,
					mode: 'x',
					onPan: ({ chart }) => updateZoomLabel(chart as ZoomAwareChart),
					onPanComplete: ({ chart }) => updateZoomLabel(chart as ZoomAwareChart)
				},
				zoom: {
					wheel: { enabled: true },
					pinch: { enabled: true },
					mode: 'x',
					onZoomStart: shouldStartWheelZoom,
					onZoom: ({ chart }) => updateZoomLabel(chart as ZoomAwareChart),
					onZoomComplete: ({ chart }) => updateZoomLabel(chart as ZoomAwareChart)
				}
			}
		},
		scales: {
			x: {
				title: {
					display: true,
					text: 'Time (mm:ss)',
					color: '#FFF9F5'
				},
				ticks: {
					color: '#FFF9F5',
					callback: (value) => {
						const minutes = Math.floor(Number(value) / 60);
						const seconds = Number(value) % 60;
						return `${minutes}:${seconds.toString().padStart(2, '0')}`;
					}
				},
				grid: { color: '#444444' }
			},
			y: {
				title: {
					display: true,
					text: 'Damage Taken',
					color: '#FFF9F5'
				},
				ticks: {
					color: '#FFF9F5',
					callback: (value) => {
						if (Number(value) >= 1e6) return `${(Number(value) / 1e6).toFixed(1)}M`;
						if (Number(value) >= 1e3) return `${(Number(value) / 1e3).toFixed(1)}K`;
						return Number(value);
					}
				},
				grid: { color: '#555555' }
			},
			yDeaths: {
				position: 'right',
				beginAtZero: true,
				title: {
					display: true,
					text: 'Deaths per pull',
					color: DEATH_LINE_COLOR
				},
				ticks: {
					color: DEATH_LINE_COLOR,
					callback: (value) => Number(Number(value).toFixed(2))
				},
				grid: { drawOnChartArea: false }
			}
		}
	});

	$effect(() => {
		if (zoomPluginLoaded) {
			if (!options.plugins) {
				options.plugins = {};
			}
			options.plugins.zoom = {
				pan: {
					enabled: true,
					mode: 'x',
					onPan: ({ chart }) => updateZoomLabel(chart as ZoomAwareChart),
					onPanComplete: ({ chart }) => updateZoomLabel(chart as ZoomAwareChart)
				},
				zoom: {
					wheel: {
						enabled: true
					},
					pinch: {
						enabled: true
					},
					mode: 'x',
					onZoomStart: shouldStartWheelZoom,
					onZoom: ({ chart }) => updateZoomLabel(chart as ZoomAwareChart),
					onZoomComplete: ({ chart }) => updateZoomLabel(chart as ZoomAwareChart)
				}
			};
		}
	});

	function movingAverage(arr: number[], windowSize: number) {
		const result = [];
		const halfWindow = Math.floor(windowSize / 2);

		for (let i = 0; i < arr.length; i++) {
			const start = Math.max(0, i - halfWindow);
			const end = Math.min(arr.length, i + halfWindow + 1);

			let sum = 0;
			for (let j = start; j < end; j++) {
				sum += arr[j];
			}
			result.push(sum / (end - start));
		}

		return result;
	}

	async function fetchDeathRate(): Promise<DeathRateRecord[]> {
		const cacheKey = `death-hotspots:${encounterId}`;
		const cached = getCache<DeathRateRecord[]>(cacheKey);
		if (cached) return cached;
		try {
			const response = await fetch(`/api/death-hotspots?bossId=${encounterId}`);
			const apiData = await response.json();
			if (!Array.isArray(apiData)) return [];
			const records = apiData as DeathRateRecord[];
			setCache(cacheKey, records, 24 * 60 * 60 * 1000);
			return records;
		} catch (err) {
			logClientError('averageChart', 'death-hotspots fetch failed', err);
			return [];
		}
	}

	async function fetchData() {
		try {
			loading = true;
			const cacheKey = `damage-average:${encounterId}`;
			let data = getCache<AverageRecord[]>(cacheKey);
			if (!data) {
				const response = await fetch(`/api/damage-average?bossId=${encounterId}`);
				const apiData = await response.json();
				if ('error' in apiData) {
					throw new Error(apiData.error);
				}
				if (!Array.isArray(apiData)) {
					throw new Error('Invalid data format received from API');
				}
				data = apiData as AverageRecord[];
				// Cache for 24 hours
				setCache(cacheKey, data, 24 * 60 * 60 * 1000);
			}
			const rawData = data as AverageRecord[];
			const filteredData = rawData.filter((d) => d.n >= 5);

			const deathRecords = await fetchDeathRate();
			const deathBySecond = new Map<number, number>();
			for (const record of deathRecords) {
				const samples = record.sample_count || 1;
				deathBySecond.set(record.time_seconds, record.death_count / samples);
			}

			const windowSize = 10;

			const avgArray = filteredData.map((d) => d.avg);
			const stdArray = filteredData.map((d) => d.std);
			const ciArray = filteredData.map((d) => d.ci);
			const deathArray = filteredData.map((d) => deathBySecond.get(d.time_seconds) ?? 0);

			const smoothedAvg = movingAverage(avgArray, windowSize);
			const smoothedStd = movingAverage(stdArray, windowSize);
			const smoothedCi = movingAverage(ciArray, windowSize);
			const deathBars = deathArray;

			chartData = {
				labels: filteredData.map((d) => d.time_seconds.toString()),
				datasets: [
					{
						label: 'Average Damage',
						data: smoothedAvg,
						borderColor: '#4299e1',
						backgroundColor: '#4299e1',
						fill: false,
						pointRadius: 0,
						tension: 0.4
					},
					{
						label: 'Standard Deviation',
						data: smoothedAvg.map((avg, index) => Math.max(0, avg + smoothedStd[index])),
						borderColor: 'transparent',
						backgroundColor: 'rgba(66, 153, 225, 0.4)',
						fill: {
							target: '+1',
							above: 'rgba(66, 153, 225, 0.4)',
							below: 'rgba(66, 153, 225, 0.4)'
						},
						pointRadius: 0,
						tension: 0.4
					},
					{
						data: smoothedAvg.map((avg, index) => Math.max(0, avg - smoothedStd[index])),
						borderColor: 'transparent',
						backgroundColor: 'rgba(66, 153, 225, 0.1)',
						fill: false,
						pointRadius: 0,
						tension: 0.4
					},
					{
						label: 'Confidence Interval',
						data: smoothedAvg.map((avg, index) => Math.max(0, avg + smoothedCi[index])),
						borderColor: 'transparent',
						backgroundColor: 'rgba(245, 101, 101, 0.6)',
						fill: {
							target: '+1',
							above: 'rgba(245, 101, 101, 0.6)',
							below: 'rgba(245, 101, 101, 0.6)'
						},
						pointRadius: 0,
						tension: 0.4
					},
					{
						data: smoothedAvg.map((avg, index) => Math.max(0, avg - smoothedCi[index])),
						borderColor: 'transparent',
						backgroundColor: 'rgba(245, 101, 101, 0.1)',
						fill: false,
						pointRadius: 0,
						tension: 0.4
					},
					{
						label: 'Deaths per pull',
						type: 'bar',
						data: deathBars,
						borderColor: DEATH_LINE_COLOR,
						backgroundColor: 'hsl(348 75% 81% / 0.45)',
						borderWidth: 1,
						barPercentage: 1,
						categoryPercentage: 1,
						order: 99,
						yAxisID: 'yDeaths'
					}
				]
			};
		} catch (err) {
			logClientError('averageChart', 'fetch failed', err);
			error = `Failed to load damage data: ${err instanceof Error ? err.message : 'Unknown error'}`;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		if (encounterId) {
			fetchData();
		}
	});
</script>

<div class="chart-container">
	{#if loading}
		<div class="loading-message">Loading damage data...</div>
	{:else if error}
		<div class="error-message">{error}</div>
	{:else}
		<div
			class="container relative mx-auto flex h-[32rem] w-full items-center justify-center p-4 xl:h-[40rem] 2xl:h-[50rem]"
		>
			<div class="zoom-controls">
				<button class="zoom-btn" onclick={zoomOut} title="Zoom out" aria-label="Zoom out">−</button>
				<div bind:this={zoomLabelElement} class="zoom-label" aria-live="polite">Zoom 100%</div>
				<button class="zoom-btn" onclick={zoomIn} title="Zoom in" aria-label="Zoom in">+</button>
				<button class="zoom-btn zoom-reset" onclick={resetZoom} title="Reset zoom" aria-label="Reset zoom">↺</button>
			</div>
			<Chart type="line" data={chartData} {options} bind:chart={chartInstance} />
		</div>
	{/if}
</div>

<style>
	.zoom-controls {
		position: absolute;
		top: 1.25rem;
		right: 1.5rem;
		z-index: 10;
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.zoom-label {
		padding: 0.2rem 0.6rem;
		border-radius: 9999px;
		font-size: 0.7rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		color: hsl(var(--foreground));
		background: hsl(var(--card) / 0.9);
		border: 1px solid hsl(var(--border));
		backdrop-filter: blur(6px);
	}

	.zoom-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 9999px;
		border: 1px solid hsl(var(--border));
		background: hsl(var(--card) / 0.9);
		backdrop-filter: blur(6px);
		color: hsl(var(--foreground));
		font-size: 0.85rem;
		line-height: 1;
		cursor: pointer;
		transition: background 0.15s;
	}

	.zoom-btn:hover {
		background: hsl(var(--accent) / 0.85);
	}

	.zoom-reset {
		font-size: 0.75rem;
	}
</style>
