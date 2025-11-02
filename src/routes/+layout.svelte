<script>
	import '../app.pcss';
	import { ModeWatcher } from 'mode-watcher';
	import Header from '../components/header.svelte';
	import RestedXPBanner from '../components/restedxpBanner.svelte';
</script>

<ModeWatcher />
<Header />
<RestedXPBanner />

<slot />
