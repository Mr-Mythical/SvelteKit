<script lang="ts">
	import KeystoneTable from '../../components/keystoneTable.svelte';
	import Header from '../../components/header.svelte';
	import ApiForm from '../../components/apiForm.svelte';
	import SEO from '../../components/seo.svelte';
	import Footer from '../../components/footer.svelte';
	import { Toaster } from 'svelte-sonner';
	import type { PageData } from './$types.js';

	export let data: PageData;
</script>

<SEO
	title="Mythic+ Rating Calculator - Mr. Mythical"
	description="Calculate the required dungeon levels for your desired Mythic+ rating in World of Warcraft. Import characters, edit plans, and share key combinations."
	image="https://mrmythical.com/Logo.png"
	keywords="Mythic Plus, World of Warcraft, score calculator, dungeon levels, WoW Mythic Plus, key combinations, Mythic+, mythic rating calculator, mythic+ rating calculator, mythic plus calculator"
/>

<Header />
<main>
	<KeystoneTable />
	<ApiForm data={data.form} />
	<Toaster richColors />
</main>
<Footer />
