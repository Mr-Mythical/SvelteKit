<script lang="ts">
	import KeystoneTable from '../components/keystoneTable.svelte';
	import Header from '../components/header.svelte';
	import { Toaster } from 'svelte-sonner'
	import type { PageData } from './$types.js';
	import ApiForm from '../components/apiForm.svelte';
	export let data: PageData;
</script>

<Header />
<KeystoneTable />
<ApiForm data={data.form} />
<Toaster richColors />

