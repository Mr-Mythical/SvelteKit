<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { AddonScreenshot } from '$lib/data/addons';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	interface Props {
		shots: AddonScreenshot[];
		/** Accessible name for the carousel region */
		label?: string;
		/** Auto-advance interval in ms (0 disables). Default 5s. */
		intervalMs?: number;
	}

	let { shots, label = 'Addon screenshots', intervalMs = 5000 }: Props = $props();

	let index = $state(0);
	let paused = $state(false);
	let reducedMotion = $state(false);
	/** 1 = forward (next), -1 = back (prev) */
	let direction = $state(1);

	const current = $derived(shots[index] ?? shots[0]);
	const count = $derived(shots.length);
	const autoplay = $derived(intervalMs > 0 && count > 1 && !paused && !reducedMotion);
	const duration = $derived(reducedMotion ? 0 : 420);

	function prev() {
		if (count <= 1) return;
		direction = -1;
		index = (index - 1 + count) % count;
	}

	function next() {
		if (count <= 1) return;
		direction = 1;
		index = (index + 1) % count;
	}

	function goTo(i: number) {
		if (i === index) return;
		direction = i > index ? 1 : -1;
		index = i;
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') {
			e.preventDefault();
			prev();
		} else if (e.key === 'ArrowRight') {
			e.preventDefault();
			next();
		}
	}

	onMount(() => {
		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	});

	$effect(() => {
		if (!autoplay) return;
		// Re-run when the slide changes so manual nav resets the timer.
		void index;
		const id = window.setInterval(() => {
			direction = 1;
			index = (index + 1) % count;
		}, intervalMs);
		return () => window.clearInterval(id);
	});
</script>

{#if current}
	<div
		class="carousel"
		role="region"
		aria-roledescription="carousel"
		aria-label={label}
		tabindex="0"
		onkeydown={onKeydown}
		onmouseenter={() => (paused = true)}
		onmouseleave={() => (paused = false)}
		onfocusin={() => (paused = true)}
		onfocusout={() => (paused = false)}
	>
		<figure class="frame">
			<div class="viewport">
				{#key current.src}
					<img
						src={current.src}
						alt={current.alt}
						width="960"
						height="600"
						loading={index === 0 ? 'eager' : 'lazy'}
						decoding="async"
						style:object-position={current.objectPosition ?? 'top center'}
						in:fly={{ x: direction * 28, duration, opacity: 0, easing: cubicOut }}
						out:fly={{ x: direction * -28, duration, opacity: 0, easing: cubicOut }}
					/>
				{/key}
			</div>
			<figcaption>
				{#key current.caption}
					<span class="caption" in:fade={{ duration: duration * 0.7, easing: cubicOut }}>
						{current.caption}
					</span>
				{/key}
				{#if count > 1}
					<span class="count" aria-live="polite">{index + 1} / {count}</span>
				{/if}
			</figcaption>
		</figure>

		{#if count > 1}
			<div class="controls">
				<button type="button" class="nav" onclick={prev} aria-label="Previous screenshot">
					<ChevronLeft size={18} aria-hidden="true" />
				</button>
				<div class="dots" role="tablist" aria-label="Choose screenshot">
					{#each shots as shot, i (shot.src)}
						<button
							type="button"
							class="dot"
							class:is-active={i === index}
							role="tab"
							aria-selected={i === index}
							aria-label={`Screenshot ${i + 1}: ${shot.caption}`}
							onclick={() => goTo(i)}
						></button>
					{/each}
				</div>
				<button type="button" class="nav" onclick={next} aria-label="Next screenshot">
					<ChevronRight size={18} aria-hidden="true" />
				</button>
			</div>
		{/if}
	</div>
{/if}

<style>
	.carousel {
		display: flex;
		flex-direction: column;
		gap: 10px;
		min-width: 0;
		outline: none;
	}

	.carousel:focus-visible {
		outline: 2px solid hsl(var(--ring));
		outline-offset: 4px;
		border-radius: 8px;
	}

	.frame {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-width: 0;
	}

	.viewport {
		position: relative;
		overflow: hidden;
		aspect-ratio: 960 / 600;
		border: 1px solid hsl(var(--border));
		border-radius: 8px;
		background: hsl(var(--card));
	}

	.viewport img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: top center;
		display: block;
	}

	.frame figcaption {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 6px 12px;
		font-family: var(--font-body);
		font-size: 0.8125rem;
		line-height: 1.4;
		color: hsl(var(--muted-foreground));
		min-height: 1.4em;
	}

	.caption {
		min-width: 0;
		flex: 1;
	}

	.count {
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.controls {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.nav {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		padding: 0;
		border: 1px solid hsl(var(--border));
		border-radius: 6px;
		background: hsl(var(--background));
		color: hsl(var(--foreground));
		cursor: pointer;
		transition:
			color 150ms cubic-bezier(0.25, 1, 0.5, 1),
			border-color 150ms cubic-bezier(0.25, 1, 0.5, 1);
	}

	.nav:hover {
		color: hsl(var(--link));
		border-color: hsl(var(--link));
	}

	.nav:focus-visible {
		outline: 2px solid hsl(var(--ring));
		outline-offset: 2px;
	}

	.dots {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 8px;
		flex: 1;
	}

	.dot {
		width: 8px;
		height: 8px;
		padding: 0;
		border: none;
		border-radius: 999px;
		background: hsl(var(--muted-foreground) / 0.35);
		cursor: pointer;
		transition:
			background-color 200ms cubic-bezier(0.25, 1, 0.5, 1),
			transform 200ms cubic-bezier(0.25, 1, 0.5, 1);
	}

	.dot.is-active {
		background: hsl(var(--link));
		transform: scale(1.25);
	}

	.dot:focus-visible {
		outline: 2px solid hsl(var(--ring));
		outline-offset: 2px;
	}

	@media (prefers-reduced-motion: reduce) {
		.nav,
		.dot {
			transition: none;
		}
	}
</style>
