<script>
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import Header from '../components/layout/header.svelte';
	import ContentShowcase from '../components/layout/contentShowcase.svelte';
	/** @type {{children?: import('svelte').Snippet}} */
	let { children } = $props();
</script>

<ModeWatcher />
<Header />
<ContentShowcase />

{@render children?.()}
