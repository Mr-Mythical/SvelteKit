<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart } from 'svelte-chartjs';
	import {
		Chart as ChartJS,
		LineElement,
		PointElement,
		CategoryScale,
		LinearScale,
		Tooltip,
		Legend,
		LineController,
		Title,
		Filler
	} from 'chart.js';
	import type { ChartData, ChartOptions } from 'chart.js';
	import { backgroundColorPlugin } from '$lib/utils/chartCanvasPlugin';

	let zoomPluginLoaded = false;

	let zoomPlugin;
	onMount(async () => {
		const module = await import('chartjs-plugin-zoom');
		zoomPlugin = module.default;
		ChartJS.register(zoomPlugin);
		zoomPluginLoaded = true;
	});

	export let encounterId: number;
	export let encounterName: string = 'Unknown Encounter';

	interface AverageRecord {
		time_seconds: number;
		avg: number;
		std: number;
		n: number;
		ci: number;
		encounter_id: number;
	}

	let chartData: ChartData<'line', number[], string> = {
		labels: [],
		datasets: []
	};

	let loading = false;
	let error: string | null = null;

	ChartJS.register(
		LineElement,
		PointElement,
		CategoryScale,
		LinearScale,
		Tooltip,
		Legend,
		LineController,
		Title,
		Filler,
		backgroundColorPlugin
	);

	const options: ChartOptions<'line'> = {
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
						const minutes = Math.floor(seconds / 60);
						const remainingSeconds = seconds % 60;
						return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
					},
					label: (context) => {
						const value = context.parsed.y;
						const datasetIndex = context.datasetIndex;
						const formatted = Number(value.toFixed(2)).toLocaleString();

						const chart = context.chart;
						const data = chart.data.datasets;

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
				pan: { enabled: true, mode: 'x' },
				zoom: {
					wheel: { enabled: true },
					pinch: { enabled: true },
					mode: 'x'
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
			}
		}
	};

	$: if (zoomPluginLoaded) {
		if (!options.plugins) {
			options.plugins = {};
		}
		options.plugins.zoom = {
			pan: {
				enabled: true,
				mode: 'x'
			},
			zoom: {
				wheel: {
					enabled: true
				},
				pinch: {
					enabled: true
				},
				mode: 'x'
			}
		};
	}

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

	async function fetchData() {
		try {
			loading = true;
			const response = await fetch(`/api/damage-average?bossId=${encounterId}`);
			const data = await response.json();

			if ('error' in data) {
				throw new Error(data.error);
			}

			// Check if data is an array and handle error if not
			if (!Array.isArray(data)) {
				throw new Error('Invalid data format received from API');
			}

			const rawData = data as AverageRecord[];
			const filteredData = rawData.filter((d) => d.n >= 5);

			const windowSize = 10;

			const avgArray = filteredData.map((d) => d.avg);
			const stdArray = filteredData.map((d) => d.std);
			const ciArray = filteredData.map((d) => d.ci);

			const smoothedAvg = movingAverage(avgArray, windowSize);
			const smoothedStd = movingAverage(stdArray, windowSize);
			const smoothedCi = movingAverage(ciArray, windowSize);

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
					}
				]
			};
		} catch (err) {
			console.error('Fetch error:', err);
			error = `Failed to load damage data: ${err instanceof Error ? err.message : 'Unknown error'}`;
		} finally {
			loading = false;
		}
	}

	$: if (encounterId) {
		fetchData();
	}
</script>

<div class="chart-container">
	{#if loading}
		<div class="loading-message">Loading damage data...</div>
	{:else if error}
		<div class="error-message">{error}</div>
	{:else}
		<div
			class="container mx-auto flex h-[32rem] w-full items-center justify-center p-4 xl:h-[40rem] 2xl:h-[50rem]"
		>
			<Chart type="line" data={chartData} {options} />
		</div>
	{/if}
</div>
