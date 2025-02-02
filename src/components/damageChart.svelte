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
	import { backgroundColorPlugin } from '$lib/utils/chartCanvasPlugin'; 
	import { abilityColors } from '$lib/utils/classColors';
	import { Label } from '$lib/components/ui/label/index';
	import * as RadioGroup from '$lib/components/ui/radio-group/index';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { classSpecAbilities } from '$lib/types/classData';

	let zoomPluginLoaded = false;

	let zoomPlugin;
	onMount(async () => {
		const module = await import('chartjs-plugin-zoom');
		zoomPlugin = module.default;
		ChartJS.register(zoomPlugin);
		zoomPluginLoaded = true;
	});

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

	let showAnnotations = true;
	let specFilters: Record<string, boolean> = {};
	let abilityTypeFilter: 'Major' | 'Minor' | 'All' = 'All';
	let indexOffset = 0;
	let lastXValue = 0;

	const pointInterval = damageEvents[0]?.pointInterval || healingEvents[0]?.pointInterval;

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
				color: '#FFF9F5'
			},
			tooltip: {
				mode: 'index',
				intersect: false,
				callbacks: {
					title: function (context) {
						const index = context[0].dataIndex;
						const totalSeconds = (index * pointInterval) / 1000;
						const minutes = Math.floor(totalSeconds / 60);
						const seconds = Math.floor(totalSeconds % 60);
						return `${minutes}:${seconds.toString().padStart(2, '0')}`;
					},
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
					color: '#FFF9F5'
				}
			},
			annotation: {
				annotations: []
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
					callback: function (tickValue: string | number) {
						if (typeof tickValue === 'number') {
							const totalSeconds = (tickValue * pointInterval) / 1000;
							const minutes = Math.floor(totalSeconds / 60);
							const seconds = Math.floor(totalSeconds % 60);
							return `${minutes}:${seconds.toString().padStart(2, '0')}`;
						}
						return tickValue;
					}
				},
				grid: {
					color: '#444444'
				}
			},
			y: {
				title: {
					display: true,
					text: 'Amount',
					color: '#FFF9F5'
				},
				ticks: {
					color: '#FFF9F5',
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
					color: '#555555'
				},
				max: calculateSuggestedMax(damageEvents, healingEvents)
			}
		}
	};

	$: if (zoomPluginLoaded) {
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

	function calculateSuggestedMax(damageEvents: Series[], healingEvents: Series[]): number {
		const maxDamage = Math.max(...damageEvents[0].data);
		const maxHealing = Math.max(...healingEvents[0].data);

		const maxValue = Math.max(maxDamage, maxHealing);

		return maxValue * 1.5;
	}

	function processSeriesData(series: Series[]) {
		if (!series || !series[0].data) {
			return { timestamps: [], values: [] };
		}

		const timestamps = Array.from(
			{ length: series[0].data.length },
			(_, i) => (i * series[0].pointInterval) / 1000 // Normalize to seconds
		);

		return {
			timestamps,
			values: series[0].data
		};
	}

	function processData(damageEvents: Series[], healingEvents: Series[]) {
		const damageData = processSeriesData(damageEvents);
		const healingData = processSeriesData(healingEvents);

		return {
			labels: damageData.timestamps.map((ts) => ts.toFixed(1)), // Use normalized seconds
			damagetakenData: damageData.values,
			effectiveHealingData: healingData.values
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
					pointRadius: 0,
					tension: 0.2
				},
				{
					label: 'Effective Healing',
					data: processedData.effectiveHealingData,
					backgroundColor: 'rgba(54, 162, 235, 0.2)',
					borderColor: 'rgba(54, 162, 235, 1)',
					fill: true,
					pointRadius: 0,
					tension: 0.2
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

<div class="filters grid grid-rows-2 items-center justify-center gap-1 text-center">
	<div>
		<Label>Ability Type</Label>
		<RadioGroup.Root bind:value={abilityTypeFilter}>
			<div class="flex flex-wrap items-center justify-center gap-4">
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
		<div class="flex flex-wrap items-center justify-center gap-4">
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
