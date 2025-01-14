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
	import type { ChartOptions, ChartData } from 'chart.js';
	import type { Series } from '$lib/types/types';
	import { Label } from '$lib/components/ui/label/index.js';

	ChartJS.register(
		LineElement,
		PointElement,
		CategoryScale,
		LinearScale,
		Tooltip,
		Legend,
		LineController,
		Title,
		Filler
	);

	export let damageEvents: Series[] = [];
	export let healingEvents: Series[] = [];

	let chartData: ChartData<'line', number[], string> = {
		labels: [],
		datasets: []
	};

	let smoothingWindowSize = 2;

	const options: ChartOptions<'line'> = {
		responsive: true,
		plugins: {
			title: {
				display: true,
				text: 'Damage Taken and Healing Done Over Time'
			},
			tooltip: {
				mode: 'index',
				intersect: false,
				callbacks: {
					label: function (context) {
						const label = context.dataset.label || '';
						const value = context.raw as number;
						return `${label}: ${value.toLocaleString()}`;
					}
				}
			},
			legend: {
				display: true,
				position: 'top'
			}
		},
		scales: {
			x: {
				stacked: false,
				title: {
					display: true,
					text: 'Time (seconds)'
				}
			},
			y: {
				stacked: false,
				title: {
					display: true,
					text: 'Amount'
				},
				beginAtZero: true,
				ticks: {
					callback: function (tickValue: string | number) {
						if (typeof tickValue === 'number') {
							if (tickValue >= 1000000) {
								return (tickValue / 1000000).toFixed(1) + 'M';
							} else if (tickValue >= 1000) {
								return (tickValue / 1000).toFixed(1) + 'K';
							}
						}
						return tickValue;
					}
				}
			}
		}
	};

	function calculateRollingAverage(data: number[], windowSize: number): number[] {
		return data.map((_, index, arr) => {
			const window = arr.slice(Math.max(0, index - windowSize + 1), index + 1);
			return window.reduce((sum, value) => sum + value, 0) / window.length;
		});
	}

	function processSeriesData(series: Series[]) {
		if (!series || series.length === 0 || !series[0].data) {
			return { timestamps: [], values: [] };
		}

		const firstSeries = series[0];
		const timestamps = Array.from(
			{ length: firstSeries.data.length },
			(_, i) => (i * firstSeries.pointInterval) / 1000 // Normalize to seconds
		);

		const aggregatedValues = series.reduce((acc, curr) => {
			if (curr.data && Array.isArray(curr.data)) {
				curr.data.forEach((value, index) => {
					acc[index] = (acc[index] || 0) + value;
				});
			}
			return acc;
		}, [] as number[]);

		return {
			timestamps,
			values: aggregatedValues
		};
	}

	function processData(damageEvents: Series[], healingEvents: Series[]) {
		const damageData = processSeriesData(damageEvents);
		const healingData = processSeriesData(healingEvents);

		return {
			labels: damageData.timestamps.map((ts) => ts.toFixed(1)), // Use normalized seconds
			damagetakenData: calculateRollingAverage(damageData.values, smoothingWindowSize),
			effectiveHealingData: calculateRollingAverage(healingData.values, smoothingWindowSize)
		};
	}

	function updateChartData(processedData: {
		labels: string[];
		damagetakenData: number[];
		effectiveHealingData: number[];
	}) {

		chartData = {
			labels: processedData.labels,
			datasets: [
				{
					label: 'Damage Taken',
					data: processedData.damagetakenData,
					backgroundColor: 'rgba(255, 99, 132, 0.2)',
					borderColor: 'rgba(255, 99, 132, 1)',
					fill: true,
					pointRadius: 0
				},
				{
					label: 'Effective Healing',
					data: processedData.effectiveHealingData,
					backgroundColor: 'rgba(54, 162, 235, 0.2)',
					borderColor: 'rgba(54, 162, 235, 1)',
					fill: true,
					pointRadius: 0
				}
			]
		};
	}

	onMount(() => {
		if (damageEvents.length > 0 || healingEvents.length > 0) {
			const processedData = processData(damageEvents, healingEvents);
			updateChartData(processedData);
		}
	});

	$: if (damageEvents.length > 0 || healingEvents.length > 0) {
		const processedData = processData(damageEvents, healingEvents);
		updateChartData(processedData);
	}
</script>

<div class="flex justify-center items-center w-full h-[32rem] xl:h-[40rem] 2xl:h-[50rem]">
	<Chart type="line" data={chartData} {options} />
</div>

<div class="flex flex-col items-center space-y-2">
	<Label for="smoothing" class="mb-2 block text-lg">Smoothing Window Size</Label>
	<input
		id="smoothing"
		type="range"
		min="1"
		max="3"
		bind:value={smoothingWindowSize}
		step="1"
		class="range-thumb h-2 w-48 cursor-pointer appearance-none rounded-lg bg-accent text-primary focus:outline-none focus:ring-1 focus:ring-ring focus:ring-opacity-50"
		on:input={() => {
			const processedData = processData(damageEvents, healingEvents);
			updateChartData(processedData);
		}}
	/>
	<span class="text-sm">Value: {smoothingWindowSize}</span>
</div>



<style>
	:global(input[type="range"].range-thumb::-webkit-slider-thumb) {
	  appearance: none;
	  width: 16px;
	  height: 16px;
	  background-color: hsl(348 75% 81%);
	  border-radius: 9999px;
	  cursor: pointer;
	  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
	}
  
	:global(input[type="range"].range-thumb::-moz-range-thumb) {
	  width: 16px;
	  height: 16px;
	  background-color: hsl(348 75% 81%);
	  border-radius: 9999px;
	  cursor: pointer;
	  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
	}
  
	:global(html.dark input[type="range"].range-thumb::-webkit-slider-thumb) {
	  background-color: hsl(348 75% 19%);
	}
  
	:global(html.dark input[type="range"].range-thumb::-moz-range-thumb) {
	  background-color: hsl(348 75% 19%);
	}
  </style>
  
