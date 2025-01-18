<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart } from 'svelte-chartjs';
	import annotationPlugin from 'chartjs-plugin-annotation';
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
	import type { CastEvent, Series } from '$lib/types/apiTypes';
	import { abilityColors } from '$lib/utils/classColors';
	import { Label } from '$lib/components/ui/label/index';
	import * as RadioGroup from '$lib/components/ui/radio-group/index';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { classSpecAbilities } from '$lib/types/classData';

	const backgroundColorPlugin = {
		id: 'customBackgroundColor',
		beforeDraw: (chart: any) => {
			const { ctx, canvas } = chart;
			const borderRadius = 20;
			const padding = 1;

			const width = canvas.width;
			const height = canvas.height;

			ctx.save();
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			ctx.fillStyle = '#696969';
			ctx.strokeStyle = '#696969';
			ctx.lineWidth = 3;

			ctx.beginPath();
			ctx.moveTo(padding + borderRadius, padding);
			ctx.lineTo(padding + width - borderRadius, padding);
			ctx.quadraticCurveTo(padding + width, padding, padding + width, padding + borderRadius);
			ctx.lineTo(padding + width, padding + height - borderRadius);
			ctx.quadraticCurveTo(
				padding + width,
				padding + height,
				padding + width - borderRadius,
				padding + height
			);
			ctx.lineTo(padding + borderRadius, padding + height);
			ctx.quadraticCurveTo(padding, padding + height, padding, padding + height - borderRadius);
			ctx.lineTo(padding, padding + borderRadius);
			ctx.quadraticCurveTo(padding, padding, padding + borderRadius, padding);
			ctx.closePath();

			ctx.fill();
			ctx.stroke();

			ctx.restore();
		}
	};

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
		annotationPlugin,
		backgroundColorPlugin
	);

	export let damageEvents: Series[] = [];
	export let healingEvents: Series[] = [];
	export let castEvents: CastEvent[] = [];

	let chartData: ChartData<'line', number[], string> = {
		labels: [],
		datasets: []
	};

	let smoothingWindowSize = 2;

	let showAnnotations = true;
	let specFilters: Record<string, boolean> = {};
	let abilityTypeFilter: 'Major' | 'Minor' | 'All' = 'All';
	let indexOffset = 0;
	let lastXValue = 0;

	Object.keys(classSpecAbilities).forEach((className) => {
		Object.keys(classSpecAbilities[className as keyof typeof classSpecAbilities]).forEach(
			(specName) => {
				specFilters[`${className} - ${specName}`] = true;
			}
		);
	});

	const options: ChartOptions<'line'> & { plugins: { annotation: { annotations: any[] } } } = {
		responsive: true,
		plugins: {
			title: {
				display: true,
				text: 'Damage Taken and Healing Done Over Time',
				color: 'black'
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
				position: 'top',
				labels: {
					color: 'black'
				}
			},
			annotation: {
				annotations: []
			}
		},
		scales: {
			x: {
				stacked: false,
				title: {
					display: true,
					text: 'Time (seconds)',
					color: 'black'
				},
				ticks: {
					color: 'black'
				}
			},
			y: {
				stacked: false,
				title: {
					display: true,
					text: 'Amount',
					color: 'black'
				},
				ticks: {
					color: 'black',
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
				},
				grid: {
					color: 'black'
				},
				max: calculateSuggestedMax(damageEvents, healingEvents)
			}
		}
	};

	function calculateSuggestedMax(damageEvents: Series[], healingEvents: Series[]): number {
		const maxDamage = Math.max(...damageEvents.flatMap((series) => series.data));
		const maxHealing = Math.max(...healingEvents.flatMap((series) => series.data));

		const maxValue = Math.max(maxDamage, maxHealing);

		return maxValue * 2.5;
	}

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

	$: annotations = showAnnotations
		? castEvents
				.filter((event) => {
					const abilitySpec = Object.entries(classSpecAbilities).find(([className, specs]) =>
						Object.values(specs).some(
							(spec) =>
								spec.Major.some((ability) => ability.id === event.abilityGameID) ||
								spec.Minor.some((ability) => ability.id === event.abilityGameID)
						)
					);

					if (!abilitySpec) return false;

					const [className, specs] = abilitySpec;
					const specName = Object.keys(specs).find((spec) => {
						const specAbilities = specs[spec as keyof typeof specs];
						return [...(specAbilities as any).Major, ...(specAbilities as any).Minor].some(
							(ability) => ability.id === event.abilityGameID
						);
					});

					if (!specName) return false;
					if (!specFilters[`${className} - ${specName}`]) return false;

					if (abilityTypeFilter === 'Major') {
						const specAbilities = specs[specName as keyof typeof specs] as {
							Major: { id: number }[];
							Minor: { id: number }[];
						};
						return specAbilities.Major.some((ability) => ability.id === event.abilityGameID);
					} else if (abilityTypeFilter === 'Minor') {
						const specAbilities = specs[specName as keyof typeof specs] as {
							Major: { id: number }[];
							Minor: { id: number }[];
						};
						return specAbilities.Minor.some((ability) => ability.id === event.abilityGameID);
					}

					return true;
				})
				.map((event: CastEvent, index: number) => {
					const xValue: number = Math.round(
						(event.timestamp - damageEvents[0].pointStart) / damageEvents[0].pointInterval
					);
					const color: string = abilityColors[event.abilityGameID] || 'rgba(0, 0, 0, 0.8)';
					const healIcon: HTMLImageElement = new Image(26, 26);
					healIcon.src = `icons/image-${event.abilityGameID}.jpg`;

					if (index === 0) {
						indexOffset = 0;
						lastXValue = 0;
					}

					if (xValue - lastXValue > 4 && (index - indexOffset) % 3 !== 0) {
						indexOffset += 1;
						if ((index - indexOffset) % 3 === 1) {
							indexOffset += 1;
						}
					}

					lastXValue = xValue;
					const yOffset = ((index - indexOffset) % 3) * 25;

					return {
						type: 'line',
						xMin: xValue,
						xMax: xValue,
						borderColor: color,
						borderWidth: 2,
						label: {
							content: healIcon,
							display: true,
							position: 'end',
							yAdjust: yOffset - 12,
							backgroundColor: 'transparent'
						}
					};
				})
		: [];

	$: options.plugins = options.plugins || {};
	$: options.plugins.annotation = options.plugins.annotation || { annotations: [] };
	$: options.plugins.annotation.annotations = annotations as any;
</script>

<div class="filters grid grid-rows-2 gap-1 items-center justify-center text-center">
	<div>
		<Label>Ability Type</Label>
		<RadioGroup.Root bind:value={abilityTypeFilter}>
			<div class="flex flex-wrap gap-4 items-center justify-center">

				<div class="flex items-center space-x-2">
					<RadioGroup.Item id="all" value="All" />
					<Label for="all">All</Label>
				</div>
				<div class="flex items-center space-x-2">
					<RadioGroup.Item id="major" value="Major" />
					<Label for="major">Major</Label>
				</div>
				<div class="flex items-center space-x-2">
					<RadioGroup.Item id="minor" value="Minor" />
					<Label for="minor">Minor</Label>
				</div>
			</div>
		</RadioGroup.Root>
	</div>

	<div>
		<Label>Spec Filters</Label>
		<div class="flex flex-wrap gap-4 items-center justify-center">
			{#each Object.keys(specFilters) as spec}
				<div class="flex items-center space-x-2">
					<Checkbox bind:checked={specFilters[spec]} />
					<span>{spec}</span>
				</div>
			{/each}
		</div>
	</div>
</div>
<div
	class="container mx-auto flex h-[32rem] w-full items-center justify-center p-4 xl:h-[40rem] 2xl:h-[50rem]"
>
	<Chart type="line" data={chartData} {options} />
</div>

<div class="flex items-center justify-center space-x-2">
	<Label for="anno check" class="mb-2 block text-lg">Show Annotations</Label>
	<Checkbox id="anno check" bind:checked={showAnnotations} />
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
	:global(input[type='range'].range-thumb::-webkit-slider-thumb) {
		appearance: none;
		width: 16px;
		height: 16px;
		background-color: hsl(348 75% 81%);
		border-radius: 9999px;
		cursor: pointer;
		box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
	}

	:global(input[type='range'].range-thumb::-moz-range-thumb) {
		width: 16px;
		height: 16px;
		background-color: hsl(348 75% 81%);
		border-radius: 9999px;
		cursor: pointer;
		box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
	}

	:global(html.dark input[type='range'].range-thumb::-webkit-slider-thumb) {
		background-color: hsl(348 75% 19%);
	}

	:global(html.dark input[type='range'].range-thumb::-moz-range-thumb) {
		background-color: hsl(348 75% 19%);
	}
</style>
