<script>
	import '../app.pcss';
	import { ModeWatcher } from 'mode-watcher';
	import Header from '../components/header.svelte';
	import PartnerShowcase from '../components/partnerShowcase.svelte';
</script>

<ModeWatcher />
<Header />
<PartnerShowcase />

<slot />
