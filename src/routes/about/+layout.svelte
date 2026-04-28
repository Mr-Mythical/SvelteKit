<script>
	import '../../app.css';
	import { ModeWatcher } from 'mode-watcher';
	/** @type {{children?: import('svelte').Snippet}} */
	let { children } = $props();
</script>

<ModeWatcher />

{@render children?.()}
