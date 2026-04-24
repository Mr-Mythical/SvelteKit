<script>
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import Header from '../components/header.svelte';
	import ContentShowcase from '../components/contentShowcase.svelte';
	import AffiliateSidebar from '../components/affiliateSidebar.svelte';
	/** @type {{children?: import('svelte').Snippet}} */
	let { children } = $props();
</script>

<ModeWatcher />
<Header />
<ContentShowcase />
<AffiliateSidebar />

{@render children?.()}
