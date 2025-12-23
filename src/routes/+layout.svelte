<script>
	import '../app.pcss';
	import { ModeWatcher } from 'mode-watcher';
	import Header from '../components/header.svelte';
	import ContentShowcase from '../components/contentShowcase.svelte';
	import AffiliateSidebar from '../components/affiliateSidebar.svelte';
</script>

<ModeWatcher />
<Header />
<ContentShowcase />
<AffiliateSidebar />

<slot />
