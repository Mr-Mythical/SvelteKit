<script lang="ts">
	import KeystoneTable from '../../components/keystoneTable.svelte';
	import Header from '../../components/header.svelte';
	import { Toaster } from 'svelte-sonner'
	import type { PageData } from './$types.js';
	import ApiForm from '../../components/apiForm.svelte';
	export let data: PageData;
	import SEO from '../../components/seo.svelte';
	import Footer from '../../components/footer.svelte';
</script>

<SEO
  title="Mythic+ Rating Calculator - Optimize Your WoW Score"
  description="Calculate the required dungeon levels for your desired Mythic+ rating in World of Warcraft. Import characters, edit plans, and share key combinations."
  image="https://mrmythical.com/Logo.png"
  keywords="Mythic Plus, World of Warcraft, score calculator, Raider.io, dungeon levels, WoW Mythic Plus, key combinations, Mythic+"
/>



<Header />
<main>
	
	<KeystoneTable />
	<ApiForm data={data.form} />
	<Toaster richColors />
</main>
<Footer />


