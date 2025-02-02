<script lang="ts">
	import Header from '../components/header.svelte';
	import SEO from '../components/seo.svelte';
	import Footer from '../components/footer.svelte';
	import { Button } from '$lib/components/ui/button';
</script>

<SEO
	title="Mr. Mythical - World of Warcraft Tools"
	description="Discover powerful World of Warcraft tools, including a Mythic+ Rating Calculator and Raid Encounter Analysis. Optimize your gameplay and achieve your goals with Mr. Mythical."
	image="https://mrmythical.com/Logo.png"
	keywords="World of Warcraft, Mythic Plus, Mythic+, Raid Analysis, WoW Tools"
/>
<Header />
<main class="container mx-auto px-4 py-8">
	<section class="mb-12 text-center">
		<h1 class="mb-4 text-4xl font-bold">Welcome to Mr. Mythical</h1>
		<p class="mb-6 text-lg">Optimize your World of Warcraft experience with powerful tools.</p>
		<div class="flex justify-center gap-4"></div>
	</section>

	<section class="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
		<div class="rounded-lg bg-card p-6 shadow-md">
			<h3 class="mb-4 text-2xl font-semibold">Mythic+ Calculator</h3>
			<p class="mb-6">
				Calculate required dungeon levels for your desired Mythic+ score. Import characters, edit
				plans, and share combinations.
			</p>
			<Button><a href="/rating-calculator" class="btn rounded-lg px-6 py-3">Get Started</a></Button>
		</div>
	
		<div class="rounded-lg bg-card p-6 shadow-md">
			<h3 class="mb-4 text-2xl font-semibold">Encounter Analysis</h3>
			<p class="mb-6">
				Visualize damage and healing graphs, overlay abilities, and analyze raid encounters using
				Warcraft Log Reports.
			</p>
			<Button><a href="/encounter-analysis" class="btn rounded-lg px-6 py-3">Import Report</a></Button>
		</div>
	
		<div class="rounded-lg bg-card p-6 shadow-md">
			<h3 class="mb-4 text-2xl font-semibold">Damage Pattern Analysis</h3>
			<p class="mb-6">
				Identify critical raid moments through average damage taken and deviation visualization of progression logs.
			</p>
			<Button><a href="/average-damage-taken" class="btn rounded-lg px-6 py-3">View Damage Patterns</a></Button>
		</div>
	</section>

	<section class="rounded-lg p-8">
		<h2 class="mb-4 text-3xl font-bold">About Mr. Mythical</h2>
		<p>
			We provide tools to help World of Warcraft players optimize their gameplay, from Mythic+ to
			raid encounters. Stay tuned for more features!
		</p>
	</section>
</main>

<Footer />
