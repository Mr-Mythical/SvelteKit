<script lang="ts">
	import { Line } from 'svelte-chartjs';
	import { data } from './data';

	import {
		Chart as ChartJS,
		Title,
		Tooltip,
		Legend,
		LineElement,
		LinearScale,
		PointElement,
		CategoryScale,
		Filler
	} from 'chart.js';

	ChartJS.register(
		Title,
		Tooltip,
		Legend,
		LineElement,
		LinearScale,
		PointElement,
		CategoryScale,
		Filler
	);

	let options = {
		responsive: true,
		maintainAspectRatio: false
	};
</script>

<div style="width: 600px; height: 400px; border: 1px solid gray;">
	<Line {data} {options} />
</div>
