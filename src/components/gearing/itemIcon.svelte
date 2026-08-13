<script lang="ts">
	import type { GearPiece } from '$lib/gearing/types';
	import { formatDelta } from '$lib/gearing/model';
	import {
		wowheadIconJpgUrl,
		wowheadItemDataAttr,
		wowheadItemHref,
		wowheadItemRefFromPiece,
		resolveItemIconName,
		refreshWowheadLinks
	} from '$lib/gearing/wowhead';

	interface Props {
		piece: Pick<GearPiece, 'itemId' | 'link' | 'ilvl' | 'name'>;
		/** Included in BiS search (green) vs deselected (red / dimmed). */
		selected?: boolean;
		/** Currently equipped baseline icon (gold) — not toggled in/out of search. */
		equipped?: boolean;
		/** Highlight as BiS pick after a finished scan. */
		bis?: boolean;
		/**
		 * ΔDPS badge (estimate before scan, or actual after).
		 * Prefer showing actual when both are known.
		 */
		delta?: number | null;
		/** When true, badge label is treated as post-scan actual gain. */
		deltaIsActual?: boolean;
		/** Neutral grey treatment (e.g. farm loot that is not an upgrade). */
		muted?: boolean;
		class?: string;
		onclick?: (e: MouseEvent) => void;
		title?: string;
	}

	let {
		piece,
		selected = true,
		equipped = false,
		bis = false,
		delta = null,
		deltaIsActual = false,
		muted = false,
		class: className = '',
		onclick,
		title
	}: Props = $props();

	const ref = $derived(wowheadItemRefFromPiece(piece));
	const label = $derived(piece.name || `Item ${piece.itemId}`);
	const showDelta = $derived(!equipped && delta != null && Number.isFinite(delta));
	const deltaLabel = $derived(showDelta ? formatDelta(delta as number) : '');
	const selectionClass = $derived(
		equipped ? 'is-equipped' : selected ? 'is-selected' : 'is-deselected'
	);
	let iconName = $state<string | null>(null);
	let tipEl = $state<HTMLAnchorElement | null>(null);

	$effect(() => {
		const id = Number(piece.itemId);
		if (!Number.isFinite(id) || id <= 0) return;
		let cancelled = false;
		void resolveItemIconName(id).then((name) => {
			if (!cancelled && name) iconName = name;
		});
		return () => {
			cancelled = true;
		};
	});

	/**
	 * Wowhead refreshLinks iconizes the tip <a> by injecting nodes and/or a small
	 * repeating background-image. Strip children and wipe inline styles so only our
	 * <img> artwork remains visible; the invisible tip still drives tooltips.
	 */
	$effect(() => {
		const el = tipEl;
		if (!el || typeof MutationObserver === 'undefined') return;

		let cleaning = false;
		const sanitize = () => {
			if (cleaning) return;
			cleaning = true;
			try {
				while (el.firstChild) el.removeChild(el.firstChild);
				if (el.hasAttribute('style')) el.removeAttribute('style');
			} finally {
				cleaning = false;
			}
		};

		sanitize();
		const obs = new MutationObserver(sanitize);
		obs.observe(el, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ['style']
		});
		const t = window.setTimeout(() => refreshWowheadLinks(), 0);
		return () => {
			obs.disconnect();
			window.clearTimeout(t);
		};
	});

	function onTipClick(e: MouseEvent) {
		if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
			e.preventDefault();
			if (equipped) return;
			onclick?.(e);
		}
	}
</script>

{#if ref}
	<span
		class={`item-icon ${selectionClass} ${bis ? 'is-bis' : ''} ${muted ? 'is-muted' : ''} ${className}`.trim()}
		{title}
	>
		{#if iconName}
			<img
				class="item-icon-art"
				src={wowheadIconJpgUrl(iconName)}
				alt=""
				width="36"
				height="36"
				draggable="false"
			/>
		{:else}
			<span class="item-icon-fallback" aria-hidden="true"></span>
		{/if}
		{#if showDelta}
			<span
				class="item-icon-delta"
				class:is-up={(delta as number) > 0}
				class:is-down={(delta as number) < 0}
				class:is-actual={deltaIsActual}
				aria-label={deltaIsActual ? `Actual gain ${deltaLabel} DPS` : `Estimated ${deltaLabel} DPS`}
			>
				{deltaLabel}
			</span>
		{/if}
		<a
			bind:this={tipEl}
			class="item-icon-tip"
			href={wowheadItemHref(ref)}
			data-wowhead={wowheadItemDataAttr(ref)}
			data-wh-icon="false"
			target="_blank"
			rel="noopener noreferrer"
			aria-label={equipped ? `Equipped ${label}` : `${selected ? 'Deselect' : 'Select'} ${label}`}
			onclick={onTipClick}
		></a>
	</span>
{:else}
	<span class={`item-icon is-deselected ${className}`.trim()} title={label}></span>
{/if}

<style>
	.item-icon {
		position: relative;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		min-width: 40px;
		min-height: 40px;
		margin: 0;
		padding: 0;
		border: 2px solid hsl(0 0% 40%);
		border-radius: 3px;
		background: hsl(0 0% 12%);
		box-sizing: border-box;
		cursor: pointer;
		flex-shrink: 0;
		line-height: 0;
		overflow: visible;
		vertical-align: top;
	}

	.item-icon-art {
		display: block;
		width: 36px;
		height: 36px;
		object-fit: cover;
		pointer-events: none;
		user-select: none;
		border-radius: 1px;
	}

	.item-icon-fallback {
		display: block;
		width: 36px;
		height: 36px;
		background: linear-gradient(135deg, hsl(0 0% 28%) 0%, hsl(0 0% 16%) 100%);
		pointer-events: none;
	}

	.item-icon-delta {
		position: absolute;
		left: 50%;
		bottom: -1px;
		z-index: 3;
		transform: translateX(-50%);
		pointer-events: none;
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		font-size: 0.55rem;
		font-weight: 700;
		line-height: 1;
		letter-spacing: -0.02em;
		white-space: nowrap;
		padding: 1px 2px;
		border-radius: 2px;
		background: hsl(0 0% 8% / 0.92);
		color: hsl(0 0% 78%);
		text-shadow: 0 1px 1px hsl(0 0% 0% / 0.8);
	}

	.item-icon-delta.is-up {
		color: hsl(130 70% 52%);
	}

	.item-icon-delta.is-down {
		color: hsl(0 70% 58%);
	}

	.item-icon-delta.is-actual {
		outline: 1px solid hsl(45 90% 48% / 0.65);
	}

	/* Invisible hit-target for Wowhead tooltips — never show their icon backgrounds. */
	.item-icon-tip {
		position: absolute !important;
		inset: 0 !important;
		z-index: 2;
		display: block !important;
		margin: 0 !important;
		padding: 0 !important;
		border: 0 !important;
		width: auto !important;
		height: auto !important;
		min-width: 0 !important;
		min-height: 0 !important;
		background: transparent !important;
		background-image: none !important;
		background-size: 0 !important;
		background-repeat: no-repeat !important;
		opacity: 0 !important;
		text-decoration: none !important;
		overflow: hidden !important;
		font-size: 0 !important;
		line-height: 0 !important;
		color: transparent !important;
		box-shadow: none !important;
	}

	.item-icon-tip :global(*) {
		display: none !important;
	}

	.item-icon.is-selected {
		border-color: hsl(130 70% 38%);
		box-shadow: 0 0 0 1px hsl(130 70% 38% / 0.35);
	}

	.item-icon.is-equipped {
		border-color: hsl(45 85% 48%);
		box-shadow: 0 0 0 1px hsl(45 85% 48% / 0.45);
		cursor: default;
	}

	.item-icon.is-bis {
		border-color: hsl(45 90% 48%);
		box-shadow: 0 0 0 1px hsl(45 90% 48% / 0.45);
	}

	.item-icon.is-deselected {
		border-color: hsl(0 65% 42%);
		box-shadow: 0 0 0 1px hsl(0 65% 42% / 0.25);
	}

	.item-icon.is-deselected .item-icon-art,
	.item-icon.is-deselected .item-icon-fallback {
		filter: grayscale(0.75) brightness(0.55);
		opacity: 0.9;
	}

	.item-icon.is-muted {
		border-color: hsl(0 0% 32%);
		box-shadow: none;
		cursor: default;
	}

	.item-icon.is-muted .item-icon-art,
	.item-icon.is-muted .item-icon-fallback {
		filter: grayscale(0.85) brightness(0.5);
		opacity: 0.72;
	}

	.item-icon.is-muted .item-icon-delta {
		color: hsl(0 0% 55%);
	}

	.item-icon:hover .item-icon-art,
	.item-icon:hover .item-icon-fallback {
		filter: brightness(1.08);
	}

	.item-icon.is-deselected:hover .item-icon-art,
	.item-icon.is-deselected:hover .item-icon-fallback {
		filter: grayscale(0.55) brightness(0.7);
	}

	.item-icon.is-muted:hover .item-icon-art,
	.item-icon.is-muted:hover .item-icon-fallback {
		filter: grayscale(0.7) brightness(0.58);
	}

	.item-icon:focus-within {
		outline: 2px solid hsl(var(--ring));
		outline-offset: 2px;
	}
</style>
