<script lang="ts">
	import AverageChart from '../../components/averageChart.svelte';
	import Header from '../../components/header.svelte';
	import SEO from '../../components/seo.svelte';
	import Footer from '../../components/footer.svelte';
</script>

<SEO
	title="Average Damage Taken - Mr. Mythical"
	description="Analyze raid damage patterns with average damage metrics, standard deviation ranges, and 95% confidence intervals. Identify critical moments and improve team survivability using progression log data."
	image="https://mrmythical.com/Logo.png"
	keywords="WoW damage analysis, average damage taken, raid survivability, damage patterns, standard deviation, confidence interval, progression logs"
/>

<Header />
<main class="container mx-auto px-4 py-8">
	<section class="mb-12 text-center">
		<h1 class="mb-4 text-4xl font-bold">Average Damage Taken</h1>
		<p class="mb-6 text-lg">
			Still in early development and only supports Silken Court Mythic, full raid support expected
			ready for season 2
		</p>
	</section>
	<AverageChart />
</main>
<Footer />
