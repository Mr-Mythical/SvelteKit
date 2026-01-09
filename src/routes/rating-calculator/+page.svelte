<script lang="ts">
	import KeystoneTable from '../../components/keystoneTable.svelte';
	import ScoreExplanation from '../../components/scoreExplanation.svelte';
	import ApiForm from '../../components/apiForm.svelte';
	import SEO from '../../components/seo.svelte';
	import Footer from '../../components/footer.svelte';
	import { Toaster } from 'svelte-sonner';
	import type { PageData } from './$types.js';

	export let data: PageData;
</script>

<SEO
	title="Mythic+ Rating Calculator - Mr. Mythical"
	description="Calculate the dungeon levels needed for your Mythic+ rating target, import your character, adjust setups, and share a link instantly."
	image="https://mrmythical.com/Logo.png"
	keywords="mythic+ calculator, mythic rating calculator, mythic score calculator, mythic+ score calculator, mythic plus rating calculator, mythic+ rating calculator, mythic plus calculator, mythic planner, mythic dungeon planner, m+ calculator"
/>
<main class="container mx-auto px-4 py-8">
	<div class="mb-6 text-center">
		<h1 class="mb-2 text-4xl font-bold">Mythic+ Score Calculator</h1>
		<p class="text-lg text-muted-foreground">
			Calculate the required keystones to reach your desired World of Warcraft Mythic+ score, plan
			dungeon runs, and optimize your m+ score with this interactive score calculator. Import your
			character, set score goals, and share your setup with shareable URLs.
		</p>
	</div>
	<KeystoneTable />
	<ScoreExplanation />
	<ApiForm data={data.form} />
	<Toaster richColors />
</main>
<Footer />
