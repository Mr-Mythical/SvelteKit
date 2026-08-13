<script lang="ts">
	import type { GearPiece } from '$lib/gearing/types';
	import {
		wowheadItemDataAttr,
		wowheadItemHref,
		wowheadItemRefFromPiece
	} from '$lib/gearing/wowhead';

	interface Props {
		piece: Pick<GearPiece, 'itemId' | 'link' | 'ilvl' | 'name'> | null | undefined;
		/** Fallback label when piece is missing */
		fallback?: string;
		class?: string;
	}

	let { piece, fallback = '—', class: className = '' }: Props = $props();

	const ref = $derived(piece ? wowheadItemRefFromPiece(piece) : null);
	const label = $derived(ref?.name || (piece?.itemId ? String(piece.itemId) : fallback));
</script>

{#if ref}
	<a
		class={`item-link ${className}`.trim()}
		href={wowheadItemHref(ref)}
		data-wowhead={wowheadItemDataAttr(ref)}
		target="_blank"
		rel="noopener noreferrer"
	>
		{label}
	</a>
{:else}
	<span class={className}>{label}</span>
{/if}

<style>
	.item-link {
		color: inherit;
		text-decoration: none;
		border-bottom: 1px solid hsl(var(--primary) / 0.45);
	}

	.item-link:hover {
		color: hsl(var(--link));
		border-bottom-color: hsl(var(--link));
	}
</style>
