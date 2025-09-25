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
	import type { CastEvent, Series, Player } from '$lib/types/apiTypes';
	import { backgroundColorPlugin } from '$lib/utils/chartCanvasPlugin';
	import { abilityColors } from '$lib/utils/classColors';
	import { Label } from '$lib/components/ui/label/index';
	import * as RadioGroup from '$lib/components/ui/radio-group/index';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { classSpecAbilities } from '$lib/types/classData';
	import { bosses } from '$lib/types/bossData';

	export let damageEvents: Series[] = [];
	export let healingEvents: Series[] = [];
	export let castEvents: CastEvent[] = [];
	export let bossEvents: CastEvent[] = [];
	export let encounterId: number;
	export let allHealers: Player[] = [];

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

	let chartData: ChartData<'line', number[], string> = {
		labels: [],
		datasets: []
	};

	let showAnnotations = true;
	let specFilters: Record<string, boolean> = {};
	let abilityTypeFilter: 'Major' | 'Minor' | 'All' = 'All';

	function initializeSpecFilters() {
		specFilters = {}; // Reset first
		const specsPresent = new Set<string>();

		if (allHealers && allHealers.length > 0) {
			allHealers.forEach((healer) => {
				if (healer.specs && healer.specs.length > 0) {
					const actualSpec = healer.specs[0].spec;
					const specKey = `${healer.name} (${actualSpec} ${healer.type})`;
					specsPresent.add(specKey);
				} else {
					console.warn(`Healer ${healer.name} missing spec data for this fight.`);
					const healerClassData =
						classSpecAbilities[healer.type as keyof typeof classSpecAbilities];
					if (healerClassData) {
						Object.keys(healerClassData).forEach((specName) => {
							specsPresent.add(`${healer.name} (${specName} ${healer.type})`);
						});
					}
				}
			});
		}

		if (specsPresent.size === 0) {
			Object.keys(classSpecAbilities).forEach((className) => {
				if (classSpecAbilities[className as keyof typeof classSpecAbilities]) {
					Object.keys(classSpecAbilities[className as keyof typeof classSpecAbilities]).forEach(
						(specName) => {
							specsPresent.add(`${specName} ${className}`);
						}
					);
				}
			});
		}

		specsPresent.forEach((spec) => (specFilters[spec] = true));
		specFilters = { ...specFilters };
	}

	$: if (allHealers) initializeSpecFilters();

	$: currentBoss = bosses.find((boss) => boss.id === encounterId);
	let bossAbilityFilters: Record<number, boolean> = {};
	let detectedBossAbilities: Set<number> = new Set();
	let previousBossId: number | null = null;
	$: if (currentBoss) {
		if (previousBossId !== currentBoss.id) {
			previousBossId = currentBoss.id;
			bossAbilityFilters = {};
			detectedBossAbilities = new Set(bossEvents.map((event) => event.abilityGameID));

			// Only enable abilities that are actually detected in the boss events
			currentBoss.abilities.forEach((ability) => {
				bossAbilityFilters[ability.id] = detectedBossAbilities.has(ability.id);
			});
		}
	}

	function getSpecAbilityName(abilityGameID: number): string | null {
		const classes = Object.keys(classSpecAbilities) as (keyof typeof classSpecAbilities)[];
		for (const className of classes) {
			const specs = classSpecAbilities[className];
			const specNames = Object.keys(specs) as (keyof typeof specs)[];
			for (const specName of specNames) {
				const abilities = specs[specName] as {
					Major: { id: number; name: string }[];
					Minor: { id: number; name: string }[];
				};
				for (const ability of abilities.Major) {
					if (ability.id === abilityGameID) return ability.name;
				}
				for (const ability of abilities.Minor) {
					if (ability.id === abilityGameID) return ability.name;
				}
			}
		}
		return null;
	}

	function getBossAbilityName(abilityGameID: number): string | null {
		if (currentBoss) {
			const found = currentBoss.abilities.find((ability) => ability.id === abilityGameID);
			return found ? found.name : null;
		}
		return null;
	}

	let indexOffset = 0;
	let lastXValue = 0;
	const pointInterval = damageEvents[0]?.pointInterval || healingEvents[0]?.pointInterval;

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
					},
					afterBody: function (context) {
						const index = context[0].dataIndex;
						let lines: string[] = [];
						let specEvents = castEvents.filter(
							(e) =>
								Math.round(
									(e.timestamp - damageEvents[0].pointStart) / damageEvents[0].pointInterval
								) === index
						);
						if (specEvents.length > 0) {
							lines.push('Spec Abilities:');
							specEvents.forEach((e) => {
								const abilityName =
									getSpecAbilityName(e.abilityGameID) || `Ability ${e.abilityGameID}`;
								lines.push(`- ${abilityName}`);
							});
						}
						let bossEvt = bossEvents.filter(
							(e) =>
								Math.round(
									(e.timestamp - damageEvents[0].pointStart) / damageEvents[0].pointInterval
								) === index
						);
						if (bossEvt.length > 0) {
							lines.push('Boss Abilities:');
							bossEvt.forEach((e) => {
								const abilityName =
									getBossAbilityName(e.abilityGameID) || `Ability ${e.abilityGameID}`;
								lines.push(`- ${abilityName}`);
							});
						}
						return lines;
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
			labels: damageData.timestamps.map((ts) => ts.toFixed(1)),
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
		? [
				...castEvents
					.filter((event) => {
						const abilitySpec = Object.entries(classSpecAbilities).find(([className, specs]) =>
							Object.values(specs).some(
								(spec) =>
									(spec.Major as { id: number }[]).some(
										(ability) => ability.id === event.abilityGameID
									) ||
									(spec.Minor as { id: number }[]).some(
										(ability) => ability.id === event.abilityGameID
									)
							)
						);
						if (!abilitySpec) return false;
						const [className, specs] = abilitySpec;
						const specName = Object.keys(specs).find((spec) => {
							const specAbilities = specs[spec as keyof typeof specs] as {
								Major: { id: number }[];
								Minor: { id: number }[];
							};
							return [...specAbilities.Major, ...specAbilities.Minor].some(
								(ability) => ability.id === event.abilityGameID
							);
						});
						if (!specName) return false;

						const matchingFilter = Object.keys(specFilters).find(
							(key) =>
								key.includes(`(${specName} ${className})`) || key === `${specName} ${className}`
						);
						if (!matchingFilter || !specFilters[matchingFilter]) return false;

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
						const icon: HTMLImageElement = new Image(26, 26);
						icon.src = `icons/${event.abilityGameID}.webp`;
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
								content: icon,
								display: true,
								position: 'end',
								yAdjust: yOffset - 12,
								backgroundColor: 'transparent'
							}
						};
					}),
				...bossEvents
					.filter((event: CastEvent) => bossAbilityFilters[event.abilityGameID])
					.map((event: CastEvent, index: number) => {
						const xValue: number = Math.round(
							(event.timestamp - damageEvents[0].pointStart) / damageEvents[0].pointInterval
						);
						const bossIcon: HTMLImageElement = new Image(26, 26);
						bossIcon.src = `icons/${event.abilityGameID}.webp`;
						return {
							type: 'line',
							xMin: xValue,
							xMax: xValue,
							borderWidth: 0,
							borderColor: 'transparent',
							label: {
								content: bossIcon,
								display: true,
								position: 'start',
								yAdjust: 0,
								backgroundColor: 'transparent'
							}
						};
					})
			]
		: [];

	$: options.plugins = options.plugins || {};
	$: options.plugins.annotation = options.plugins.annotation || { annotations: [] };
	$: options.plugins.annotation.annotations = annotations as any;
</script>

<div class="filters grid grid-cols-1 items-center justify-center gap-4 text-center md:grid-cols-3">
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

	{#if currentBoss}
		<div>
			<Label>{currentBoss.name} Abilities</Label>
			<div class="flex flex-wrap items-center justify-center gap-4">
				{#each currentBoss.abilities.filter( (ability) => detectedBossAbilities.has(ability.id) ) as ability}
					<div class="flex items-center space-x-2">
						<Checkbox bind:checked={bossAbilityFilters[ability.id]} />
						<img
							src={`icons/${ability.id}.webp`}
							alt={ability.name + ' icon'}
							width="26"
							height="26"
							class="object-contain"
						/>
						<a
							href={'https://www.wowhead.com/spell=' + ability.id}
							target="_blank"
							rel="noopener noreferrer"
							class="underline hover:text-blue-400"
						>
							{ability.name}
						</a>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<div
	class="container mx-auto flex h-[32rem] w-full items-center justify-center p-4 xl:h-[40rem] 2xl:h-[50rem]"
>
	<Chart type="line" data={chartData} {options} />
</div>
