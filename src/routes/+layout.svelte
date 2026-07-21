<script>
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import Header from '../components/layout/header.svelte';
	import ContentShowcase from '../components/layout/contentShowcase.svelte';
	/** @type {{children?: import('svelte').Snippet}} */
	let { children } = $props();
</script>

<svelte:head>
	<link
		rel="alternate"
		type="application/rss+xml"
		title="Mr. Mythical RSS"
		href="https://mrmythical.com/feed.xml"
	/>
</svelte:head>

<ModeWatcher />
<Header />
<ContentShowcase />

{@render children?.()}
