<script lang="ts">
	import WowheadScripts from '../../components/wowheadScripts.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();
</script>

<WowheadScripts />
{@render children?.()}
