<script>
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import Header from '../components/header.svelte';
	import ContentShowcase from '../components/contentShowcase.svelte';
	/** @type {{children?: import('svelte').Snippet}} */
	let { children } = $props();
</script>

<ModeWatcher />
<Header />
<ContentShowcase />

{@render children?.()}
