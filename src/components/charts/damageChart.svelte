<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { base } from '$app/paths';
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
	import type { Chart as ChartInstance, ChartOptions, ChartData, LegendElement } from 'chart.js';
	import type { LegendItem } from 'chart.js';
	import type { AnnotationOptions } from 'chartjs-plugin-annotation';
	import type { CastEvent, Series, Player, DeathEvent, BossAbility } from '$lib/types/apiTypes';
	import { backgroundColorPlugin } from '$lib/ui/chartCanvasPlugin';
	import { abilityColors, classColors, getClassColor } from '$lib/ui/classColors';
	import { buildBossAbilityGroups } from '$lib/ui/abilityMetadata';
	import { Label } from '$lib/components/ui/label/index';
	import * as RadioGroup from '$lib/components/ui/radio-group/index';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Button } from '$lib/components/ui/button/index';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { classSpecAbilities } from '$lib/types/classData';
	import { bosses } from '$lib/types/bossData';

	interface Props {
		damageEvents?: Series[];
		healingEvents?: Series[];
		castEvents?: CastEvent[];
		bossEvents?: CastEvent[];
		deathEvents?: DeathEvent[];
		bossAbilities?: BossAbility[];
		averageDamageLine?: { time_seconds: number; avg: number }[];
		encounterId: number;
		allHealers?: Player[];
		showDeathsSection?: boolean;
	}

	let {
		damageEvents = [],
		healingEvents = [],
		castEvents = [],
		bossEvents = [],
		deathEvents = [],
		bossAbilities = [],
		averageDamageLine = [],
		encounterId,
		allHealers = [],
		showDeathsSection = true
	}: Props = $props();

	let zoomPluginLoaded = $state(false);
	let zoomPlugin;
	onMount(async () => {
		const module = await import('chartjs-plugin-zoom');
		zoomPlugin = module.default;
		ChartJS.register(zoomPlugin);
		zoomPluginLoaded = true;
	});

	const FULL_ZOOM_SCROLL_RELEASE_DELAY_MS = 1000;
	const DEATH_LEGEND_TEXT = 'Deaths';
	const deathLegendStroke = 'rgba(220, 38, 38, 0.95)';
	let zoomLabelElement = $state<HTMLDivElement>();
	let chartInstance = $state<ChartInstance<'line'> | null>(null);
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

	function getAbilityIcon(src: string) {
		const icon = new Image(26, 26);
		icon.src = src;
		return icon;
	}

	function formatRelativeTimestamp(timestamp: number) {
		if (!damageEvents[0]) return '0:00';
		const totalSeconds = Math.max(0, Math.round((timestamp - damageEvents[0].pointStart) / 1000));
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}

	function formatDeathCause(event: DeathEvent) {
		return (
			event.abilityName ||
			(event.abilityGameID ? `Ability ${event.abilityGameID}` : 'Unknown source')
		);
	}

	function formatDeathLabelName(event: DeathEvent) {
		const trimmedName = event.targetName?.trim();
		if (trimmedName && trimmedName.length > 0) {
			return trimmedName;
		}

		if (typeof event.targetID === 'number') {
			return `Player ${event.targetID}`;
		}

		return 'Unknown Player';
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

	let chartData: ChartData<'line', number[], string> = $state({
		labels: [],
		datasets: []
	});

	let showAnnotations = true;
	let showDeathEvents = $state(true);
	let hiddenHealerSourceIds = $state<Set<number>>(new Set());

	let currentBoss = $derived(bosses.find((boss) => boss.id === encounterId));
	let bossAbilityFilters: Record<string, boolean> = $state({});
	let previousBossId: number | null = $state(null);
	let previousAbilityKeySet = $state('');

	let staticBossAbilities = $derived(
		bossAbilities.map((ability) => ({
			id: ability.id,
			name: ability.name,
			icon: ability.icon,
			iconUrl: ability.iconUrl
		}))
	);

	let bossAbilityGroups = $derived(
		buildBossAbilityGroups(bossEvents, {
			encounterId,
			staticAbilities: staticBossAbilities
		})
	);

	let enabledBossAbilityIds = $derived.by(() => {
		const ids = new Set<number>();
		for (const group of bossAbilityGroups) {
			if (!bossAbilityFilters[group.key]) continue;
			for (const id of group.ids) ids.add(id);
		}
		return ids;
	});

	let damageTimelineStart = $derived(damageEvents[0]?.pointStart ?? 0);
	let damageTimelineInterval = $derived(damageEvents[0]?.pointInterval ?? 1000);

	let specCastEventsByIndex = $derived.by(() => {
		const buckets = new Map<number, CastEvent[]>();
		if (!damageEvents[0]) return buckets;
		for (const event of castEvents) {
			const index = Math.round((event.timestamp - damageTimelineStart) / damageTimelineInterval);
			const current = buckets.get(index) ?? [];
			current.push(event);
			buckets.set(index, current);
		}
		return buckets;
	});

	let bossCastEventsByIndex = $derived.by(() => {
		const buckets = new Map<number, CastEvent[]>();
		if (!damageEvents[0]) return buckets;
		for (const event of bossEvents) {
			const index = Math.round((event.timestamp - damageTimelineStart) / damageTimelineInterval);
			const current = buckets.get(index) ?? [];
			current.push(event);
			buckets.set(index, current);
		}
		return buckets;
	});

	let deathEventsByIndex = $derived.by(() => {
		const buckets = new Map<number, DeathEvent[]>();
		if (!damageEvents[0]) return buckets;
		for (const event of deathEvents) {
			const index = Math.round((event.timestamp - damageTimelineStart) / damageTimelineInterval);
			const current = buckets.get(index) ?? [];
			current.push(event);
			buckets.set(index, current);
		}
		return buckets;
	});

	let deathTableRows = $derived(
		[...deathEvents].sort((left, right) => left.timestamp - right.timestamp)
	);

	let averageDamageBySecond = $derived.by(() => {
		const mapped = new Map<number, number>();
		for (const point of averageDamageLine) {
			mapped.set(point.time_seconds, point.avg);
		}
		return mapped;
	});

	$effect(() => {
		if (!currentBoss) return;
		const abilityKeySet = bossAbilityGroups.map((group) => group.key).join('|');
		const bossChanged = previousBossId !== currentBoss.id;
		const abilitySetChanged = previousAbilityKeySet !== abilityKeySet;
		if (!bossChanged && !abilitySetChanged) return;

		previousBossId = currentBoss.id;
		previousAbilityKeySet = abilityKeySet;
		bossAbilityFilters = Object.fromEntries(
			bossAbilityGroups.map((group) => [group.key, group.defaultVisible])
		);
	});

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
		const grouped = bossAbilityGroups.find((group) => group.ids.includes(abilityGameID));
		if (grouped) return grouped.name;

		const fromApi = bossAbilities.find((ability) => ability.id === abilityGameID);
		if (fromApi) return fromApi.name;

		if (currentBoss) {
			const found = currentBoss.abilities.find((ability) => ability.id === abilityGameID);
			return found ? found.name : null;
		}
		return null;
	}

	function getDeathClassColor(className?: string): string {
		return getClassColor(className);
	}

	let indexOffset = 0;
	let lastXValue = 0;
	let pointInterval = $derived(
		damageEvents[0]?.pointInterval || healingEvents[0]?.pointInterval || 1000
	);
	let suggestedYAxisMax = $derived(calculateSuggestedMax(damageEvents, healingEvents) * 1.3);

	const options: ChartOptions<'line'> & {
		plugins: { annotation: { annotations: AnnotationOptions[] } };
	} = $state({
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
						let specEvents = specCastEventsByIndex.get(index) ?? [];
						if (specEvents.length > 0) {
							lines.push('Spec Abilities:');
							specEvents.forEach((e) => {
								const abilityName =
									getSpecAbilityName(e.abilityGameID) || `Ability ${e.abilityGameID}`;
								lines.push(`- ${abilityName}`);
							});
						}
						let bossEvt = bossCastEventsByIndex.get(index) ?? [];
						if (bossEvt.length > 0) {
							lines.push('Boss Abilities:');
							bossEvt.forEach((e) => {
								const abilityName =
									getBossAbilityName(e.abilityGameID) || `Ability ${e.abilityGameID}`;
								lines.push(`- ${abilityName}`);
							});
						}
						const deathsAtSecond = deathEventsByIndex.get(index) ?? [];
						if (deathsAtSecond.length > 0) {
							lines.push('Deaths:');
							deathsAtSecond.forEach((event) => {
								lines.push(`- ${event.targetName} (${formatDeathCause(event)})`);
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
					color: '#FFF9F5',
					generateLabels(chart) {
						const baseLabels = ChartJS.defaults.plugins.legend.labels.generateLabels(chart);
						const deathLegendItem: LegendItem = {
							text: DEATH_LEGEND_TEXT,
							fillStyle: 'rgba(220, 38, 38, 0.18)',
							fontColor: '#FFF9F5',
							strokeStyle: deathLegendStroke,
							lineWidth: 2,
							hidden: !showDeathEvents,
							lineDash: [6, 4],
							pointStyle: false,
							rotation: 0
						};
						return [...baseLabels, deathLegendItem];
					}
				},
				onClick: function (this: LegendElement<'line'>, event, legendItem) {
					if (legendItem.text === DEATH_LEGEND_TEXT) {
						showDeathEvents = !showDeathEvents;
						return;
					}
					if (legendItem.datasetIndex === undefined) return;
					const meta = this.chart.getDatasetMeta(legendItem.datasetIndex);
					meta.hidden =
						meta.hidden === null
							? !this.chart.data.datasets[legendItem.datasetIndex].hidden
							: !meta.hidden;
					const dataset = this.chart.data.datasets[legendItem.datasetIndex];
					const datasetLabel = typeof dataset.label === 'string' ? dataset.label : '';
					const matchingHealer = allHealers.find((healer) =>
						datasetLabel.startsWith(`${healer.name} (`)
					);
					if (matchingHealer) {
						const next = new Set(hiddenHealerSourceIds);
						if (meta.hidden) {
							next.add(matchingHealer.id);
						} else {
							next.delete(matchingHealer.id);
						}
						hiddenHealerSourceIds = next;
					}
					this.chart.update();
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
				max: undefined
			}
		}
	});

	$effect(() => {
		options.scales = options.scales || {};
		if (!options.scales.y) return;
		options.scales.y.max = suggestedYAxisMax;
	});

	$effect(() => {
		if (zoomPluginLoaded) {
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

	function calculateSuggestedMax(damageEvents: Series[], healingEvents: Series[]): number {
		const maxDamage = damageEvents.length > 0 ? Math.max(...damageEvents[0].data) : 0;
		const maxHealing =
			healingEvents.length > 0 ? Math.max(...healingEvents.flatMap((series) => series.data)) : 0;
		const maxValue = Math.max(maxDamage, maxHealing);
		return maxValue * 1.2;
	}

	function extractSeriesTimeline(series: Series[]) {
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

	function buildChartSeries(damageEvents: Series[], healingEvents: Series[]) {
		const damageData = extractSeriesTimeline(damageEvents);

		// Filter healing events to only include actual healers by matching GUIDs
		const healerGuids = new Set(allHealers.map((healer) => healer.guid));
		const healingSeriesData = healingEvents
			.filter((series) => typeof series.guid === 'number' && healerGuids.has(series.guid))
			.map((series) => ({
				name: series.name,
				guid: series.guid,
				values: series.data
			}));

		// Find the "Total" series for effective healing, or sum individual series if no Total
		const totalSeries = healingEvents.find((series) => series.name === 'Total');
		const effectiveHealingData = totalSeries
			? totalSeries.data
			: healingEvents.length > 0
				? healingEvents[0].data.map((_, index) =>
						healingEvents.reduce((sum, series) => sum + (series.data[index] || 0), 0)
					)
				: [];

		return {
			labels: damageData.timestamps.map((ts) => ts.toFixed(1)),
			damagetakenData: damageData.values,
			averageDamageData: damageData.timestamps.map((ts) => {
				const roundedSecond = Math.round(ts);
				return averageDamageBySecond.get(roundedSecond) ?? Number.NaN;
			}),
			effectiveHealingData,
			healingSeries: healingSeriesData
		};
	}

	function updateChartData(processedData: {
		labels: string[];
		damagetakenData: number[];
		averageDamageData: number[];
		effectiveHealingData: number[];
		healingSeries: { name: string; guid?: number; values: number[] }[];
	}) {
		const datasets = [
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
				label: 'World Average Damage Taken',
				data: processedData.averageDamageData,
				backgroundColor: 'transparent',
				borderColor: 'hsl(348 75% 81%)',
				fill: false,
				pointRadius: 0,
				pointHoverRadius: 0,
				borderWidth: 2,
				borderDash: [5, 3],
				tension: 0.2,
				spanGaps: true
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
		];

		processedData.healingSeries.forEach((healing) => {
			// Find the corresponding healer by guid
			const healer = allHealers.find((h) => h.guid === healing.guid);
			const healerName = healer ? healer.name : healing.name;
			const classColor = healer ? classColors[healer.type] || '#ffffff' : '#ffffff';
			datasets.push({
				label: healerName,
				data: healing.values,
				backgroundColor: 'transparent',
				borderColor: classColor,
				fill: false,
				pointRadius: 0,
				tension: 0.2
			});
		});

		chartData = {
			labels: processedData.labels,
			datasets
		};
	}

	onMount(() => {
		if (damageEvents.length > 0 || healingEvents.length > 0) {
			const processedData = buildChartSeries(damageEvents, healingEvents);
			updateChartData(processedData);
		}
	});

	$effect(() => {
		if (damageEvents.length > 0 || healingEvents.length > 0) {
			const processedData = buildChartSeries(damageEvents, healingEvents);
			updateChartData(processedData);
		}
	});

	let annotations = $derived(
		showAnnotations
			? [
					...castEvents
						.filter((event) => {
							if (hiddenHealerSourceIds.has(event.sourceID)) return false;
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

							return true;
						})
						.map((event: CastEvent, index: number) => {
							const xValue: number = Math.round(
								(event.timestamp - damageTimelineStart) / damageTimelineInterval
							);
							const color: string = abilityColors[event.abilityGameID] || 'rgba(0, 0, 0, 0.8)';
							const icon = getAbilityIcon(`${base}/icons/${event.abilityGameID}.webp`);
							const sortedHealers = [...allHealers].sort((a, b) => a.name.localeCompare(b.name));
							const healerIndex = sortedHealers.findIndex((h) => h.id === event.sourceID);
							const yAdjust = healerIndex >= 0 ? 20 + healerIndex * 30 : 20;
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
									yAdjust,
									backgroundColor: 'transparent'
								}
							};
						}),
					...bossEvents
						.filter((event: CastEvent) => enabledBossAbilityIds.has(event.abilityGameID))
						.map((event: CastEvent, index: number) => {
							const xValue: number = Math.round(
								(event.timestamp - damageTimelineStart) / damageTimelineInterval
							);
							const group = bossAbilityGroups.find((candidate) =>
								candidate.ids.includes(event.abilityGameID)
							);
							const iconUrl = group?.iconUrl || `${base}/icons/${event.abilityGameID}.webp`;
							const bossIcon = getAbilityIcon(iconUrl);
							return {
								type: 'line',
								xMin: xValue,
								xMax: xValue,
								borderWidth: 0,
								borderColor: 'transparent',
								label: {
									content: bossIcon,
									display: true,
									position: 'end',
									yAdjust: -12,
									backgroundColor: 'transparent'
								}
							};
						}),
					...(showDeathEvents
						? deathTableRows.map((event: DeathEvent) => {
								const xValue: number = Math.round(
									(event.timestamp - damageTimelineStart) / damageTimelineInterval
								);
								const deathLabelName = formatDeathLabelName(event);
								return {
									type: 'line',
									xMin: xValue,
									xMax: xValue,
									clip: false,
									drawTime: 'afterDatasetsDraw',
									borderColor: deathLegendStroke,
									borderWidth: 2,
									borderDash: [6, 4],
									label: {
										content: deathLabelName,
										display: true,
										position: 'start',
										yAdjust: 0,
										xAdjust: 0,
										textAlign: 'center',
										font: {
											size: 11,
											weight: '600'
										},
										padding: { top: 3, right: 6, bottom: 3, left: 6 },
										backgroundColor: 'rgba(127, 29, 29, 0.92)',
										borderRadius: 999,
										color: '#fff7f5'
									}
								};
							})
						: [])
				]
			: []
	);

	$effect(() => {
		options.plugins = options.plugins || {};
		options.plugins.annotation = options.plugins.annotation || { annotations: [] };
		options.plugins.annotation.annotations = annotations as AnnotationOptions[];
		chartInstance?.update();
	});
</script>

<div class="filters text-center">
	<Label class="text-xl">{currentBoss?.name} Abilities</Label>
	<div class="flex flex-wrap items-center justify-center gap-4">
		{#if bossAbilityGroups.length > 0}
			{#each bossAbilityGroups as abilityGroup (abilityGroup.key)}
				<div class="flex items-center space-x-2">
					<Checkbox
						checked={bossAbilityFilters[abilityGroup.key]}
						onCheckedChange={(checked: boolean) => {
							bossAbilityFilters = {
								...bossAbilityFilters,
								[abilityGroup.key]: checked
							};
						}}
					/>
					<img
						src={abilityGroup.iconUrl || `${base}/icons/${abilityGroup.primaryId}.webp`}
						alt={abilityGroup.name + ' icon'}
						width="26"
						height="26"
						class="object-contain"
					/>
					<a
						href={'https://www.wowhead.com/spell=' + abilityGroup.primaryId}
						target="_blank"
						rel="noopener noreferrer"
						class="underline hover:text-[hsl(var(--link))]"
					>
						{abilityGroup.name}
					</a>
				</div>
			{/each}
		{/if}
	</div>
</div>

<div
	class="relative container mx-auto flex h-[32rem] w-full items-center justify-center p-4 xl:h-[40rem] 2xl:h-[50rem]"
>
	<div class="zoom-controls">
		<button class="zoom-btn" onclick={zoomOut} title="Zoom out" aria-label="Zoom out">−</button>
		<div bind:this={zoomLabelElement} class="zoom-label" aria-live="polite">Zoom 100%</div>
		<button class="zoom-btn" onclick={zoomIn} title="Zoom in" aria-label="Zoom in">+</button>
		<button
			class="zoom-btn zoom-reset"
			onclick={resetZoom}
			title="Reset zoom"
			aria-label="Reset zoom">↺</button
		>
	</div>
	<Chart type="line" data={chartData} {options} bind:chart={chartInstance} />
</div>

{#if showDeathsSection}
	<section class="border-border bg-card/80 mt-6 rounded-xl border p-4 md:p-6">
		<div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<h3 class="text-xl font-semibold">Deaths in this pull</h3>
				<p class="text-muted-foreground text-sm">
					Each row shows when the death happened and which player died.
				</p>
			</div>
			<p class="text-muted-foreground text-sm">{deathTableRows.length} total deaths</p>
		</div>

		{#if deathTableRows.length > 0}
			<div class="mt-4 overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Time</TableHead>
							<TableHead>Player</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each deathTableRows as event (event.timestamp + '-' + event.targetID)}
							<TableRow>
								<TableCell class="font-medium">{formatRelativeTimestamp(event.timestamp)}</TableCell
								>
								<TableCell style={`color: ${getDeathClassColor(event.targetClass)};`}>
									{event.targetName}
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</div>
		{:else}
			<p class="text-muted-foreground mt-4 text-sm">No death events were reported for this pull.</p>
		{/if}
	</section>
{/if}

<style>
	.zoom-controls {
		position: absolute;
		top: clamp(0.5rem, 5%, 2.5rem);
		right: clamp(1rem, 5%, 2.5rem);
		z-index: 10;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		pointer-events: auto;
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
