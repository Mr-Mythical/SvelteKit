<script lang="ts">
	import { cn } from '$lib/utils.js.js';
	import type { HTMLAttributes } from 'svelte/elements';

	type $$Props = HTMLAttributes<HTMLTableCaptionElement>;

	let className: $$Props['class'] = undefined;
	export { className as class };
</script>

<caption class={cn('mt-4 text-sm text-muted-foreground', className)} {...$$restProps}>
	<slot />
</caption>
