<script lang="ts">
	import { onMount } from 'svelte';
	import { Chart } from 'svelte-chartjs';
	import {
		Chart as ChartJS,
		BarElement,
		CategoryScale,
		LinearScale,
		Tooltip,
		Legend,
		Title,
		BarController
	} from 'chart.js';
	import type { ChartData, ChartOptions } from 'chart.js';
	import { backgroundColorPlugin } from '$lib/utils/chartCanvasPlugin';
	import { getClassColorFromSpec } from '$lib/utils/classColors';

	export let specs: Array<{
		spec_icon: string;
		avg_dps?: number | null;
		avg_hps?: number | null;
		max_dps?: number | null;
		max_hps?: number | null;
		min_dps?: number | null;
		min_hps?: number | null;
		sample_count?: number | null;
	}>;
	export let chartTitle: string = 'Spec Performance';
	export let metricType: 'dps' | 'hps' = 'dps';
	export let showMinMax: boolean = false;
	export let showRoles: { dps: boolean; tank: boolean; healer: boolean } = {
		dps: true,
		tank: true,
		healer: true
	};

	const HEALER_SPECS = ['Restoration', 'Holy', 'Mistweaver', 'Discipline', 'Preservation'];
	const TANK_SPECS = ['Blood', 'Protection', 'Brewmaster', 'Guardian', 'Vengeance'];

	function getSpecRole(specIcon: string): 'dps' | 'tank' | 'healer' {
		const specName = getSpecName(specIcon);
		if (HEALER_SPECS.includes(specName)) return 'healer';
		if (TANK_SPECS.includes(specName)) return 'tank';
		return 'dps';
	}

	ChartJS.register(
		BarElement,
		CategoryScale,
		LinearScale,
		Tooltip,
		Legend,
		BarController,
		Title,
		backgroundColorPlugin
	);

	function getSpecName(specIcon: string): string {
		// Extract spec name from icon format: "ClassName-SpecName" -> "SpecName"
		const parts = specIcon.split('-');
		if (parts.length < 2) return specIcon;

		return parts[1]; // Return just the spec name
	}

	$: filteredSpecs = specs.filter((spec) => {
		const role = getSpecRole(spec.spec_icon);
		return showRoles[role];
	});

	$: chartData = {
		labels: filteredSpecs.map((spec) => getSpecName(spec.spec_icon)),
		datasets: [
			...(showMinMax
				? [
						{
							label: metricType === 'dps' ? 'Max DPS' : 'Max HPS',
							data: filteredSpecs.map((spec) =>
								metricType === 'dps' ? (spec.max_dps ?? 0) : (spec.max_hps ?? 0)
							),
							backgroundColor: filteredSpecs.map(
								(spec) => getClassColorFromSpec(spec.spec_icon) + '40'
							),
							borderColor: filteredSpecs.map(
								(spec) => getClassColorFromSpec(spec.spec_icon) + '60'
							),
							borderWidth: 1
						}
					]
				: []),
			{
				label: metricType === 'dps' ? 'Average DPS' : 'Average HPS',
				data: filteredSpecs.map((spec) =>
					metricType === 'dps' ? (spec.avg_dps ?? 0) : (spec.avg_hps ?? 0)
				),
				backgroundColor: filteredSpecs.map((spec) => getClassColorFromSpec(spec.spec_icon) + 'CC'),
				borderColor: filteredSpecs.map((spec) => getClassColorFromSpec(spec.spec_icon)),
				borderWidth: 2
			},
			...(showMinMax
				? [
						{
							label: metricType === 'dps' ? 'Min DPS' : 'Min HPS',
							data: filteredSpecs.map((spec) =>
								metricType === 'dps' ? (spec.min_dps ?? 0) : (spec.min_hps ?? 0)
							),
							backgroundColor: filteredSpecs.map(
								(spec) => getClassColorFromSpec(spec.spec_icon) + '40'
							),
							borderColor: filteredSpecs.map(
								(spec) => getClassColorFromSpec(spec.spec_icon) + '60'
							),
							borderWidth: 1
						}
					]
				: [])
		]
	} as ChartData<'bar', number[], string>;

	const options: ChartOptions<'bar'> = {
		responsive: true,
		maintainAspectRatio: false,
		indexAxis: 'y', // Horizontal bar chart
		plugins: {
			title: {
				display: true,
				text: chartTitle,
				color: '#FFF9F5',
				font: { size: 18, weight: 'bold' }
			},
			tooltip: {
				mode: 'nearest',
				intersect: true,
				callbacks: {
					label: (context) => {
						const value = context.parsed.x;
						const formatted = value.toLocaleString();
						const datasetLabel = context.dataset.label || '';
						return `${datasetLabel}: ${formatted}`;
					},
					afterBody: (context) => {
						if (context.length > 0) {
							const spec = filteredSpecs[context[0].dataIndex];
							const sampleCount = spec.sample_count ?? 0;
							return `Sample Count: ${sampleCount.toLocaleString()}`;
						}
						return '';
					}
				}
			},
			legend: {
				display: true,
				position: 'top',
				labels: {
					color: '#FFF9F5',
					usePointStyle: true,
					padding: 15
				}
			}
		},
		scales: {
			x: {
				beginAtZero: true,
				ticks: {
					color: '#FFF9F5',
					callback: function (value) {
						return Number(value).toLocaleString();
					}
				},
				grid: {
					color: '#555555'
				},
				title: {
					display: true,
					text: metricType === 'dps' ? 'Damage Per Second' : 'Healing Per Second',
					color: '#FFF9F5'
				}
			},
			y: {
				ticks: {
					color: '#FFF9F5',
					font: {
						size: 11
					},
					autoSkip: false,
					maxRotation: 0,
					minRotation: 0
				},
				grid: {
					color: 'rgba(68,68,68,0.25)'
				}
			}
		}
	};
</script>

<div class="h-[600px] w-full">
	<Chart type="bar" data={chartData} {options} />
</div>
