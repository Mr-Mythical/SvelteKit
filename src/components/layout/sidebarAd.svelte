<script lang="ts">
	import { onMount } from 'svelte';
	import { ADSENSE_CLIENT, ADSENSE_SLOT_SIDEBAR } from '$lib/data/ads';

	const RAIL_MQ = '(min-width: 1280px)';

	let wideEnough = $state(false);
	let adBlocked = $state(false);

	const useAdsense = $derived(wideEnough && !adBlocked && ADSENSE_SLOT_SIDEBAR.length > 0);

	onMount(() => {
		const mq = window.matchMedia(RAIL_MQ);
		const syncWide = () => {
			wideEnough = mq.matches;
		};
		syncWide();
		mq.addEventListener('change', syncWide);

		const testAd = document.createElement('div');
		testAd.className = 'ad ads advertisement banner-ad';
		testAd.style.cssText = 'height:1px;width:1px;position:absolute;left:-9999px;';
		document.body.appendChild(testAd);
		const timeout = window.setTimeout(() => {
			adBlocked = testAd.offsetHeight === 0 || testAd.offsetParent === null;
			testAd.remove();
		}, 100);

		return () => {
			mq.removeEventListener('change', syncWide);
			window.clearTimeout(timeout);
			testAd.remove();
		};
	});

	function queueAdsense(node: HTMLModElement) {
		if (node.dataset.adInit === '1') return;
		node.dataset.adInit = '1';
		try {
			const w = window as Window & { adsbygoogle?: unknown[] };
			(w.adsbygoogle ??= []).push({});
		} catch {
			// Ad blockers often throw when the queue is touched.
		}
	}
</script>

<aside class="sidebar-ad" aria-label="Advertisement">
	<p class="sidebar-ad-label">Ad</p>
	{#if useAdsense}
		<ins
			class="adsbygoogle"
			style="display:inline-block;width:160px;height:600px"
			data-ad-client={ADSENSE_CLIENT}
			data-ad-slot={ADSENSE_SLOT_SIDEBAR}
			{@attach queueAdsense}
		></ins>
	{:else}
		<a
			class="patreon"
			href="https://www.patreon.com/MrMythical"
			target="_blank"
			rel="noopener noreferrer"
			aria-label="Support Mr. Mythical on Patreon"
		>
			<svg
				class="patreon-mark"
				viewBox="0 0 569 546"
				fill="currentColor"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				<circle cx="362.589996" cy="204.589996" r="204.589996" />
				<rect width="100" height="545.799988" fill="currentColor" />
			</svg>
			<p class="patreon-title">Support on Patreon</p>
			<p class="patreon-body">Help keep these free WoW tools accurate and up to date.</p>
		</a>
	{/if}
</aside>

<style>
	.sidebar-ad {
		display: none;
	}

	@media (min-width: 1280px) {
		.sidebar-ad {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 8px;
			position: sticky;
			top: 72px;
			width: 160px;
			min-height: 600px;
			padding: 12px 12px 24px 0;
			align-self: start;
			z-index: 20;
		}
	}

	@media print {
		.sidebar-ad {
			display: none;
		}
	}

	.sidebar-ad-label {
		margin: 0;
		font-family: var(--font-body);
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground));
	}

	.patreon {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		box-sizing: border-box;
		width: 160px;
		height: 600px;
		padding: 20px 14px;
		text-align: center;
		text-decoration: none;
		border-radius: 8px;
		border: 2px solid rgb(168 85 247);
		background: linear-gradient(to bottom, rgb(168 85 247 / 0.1), rgb(236 72 153 / 0.1));
		transition: transform 150ms cubic-bezier(0.25, 1, 0.5, 1);
	}

	.patreon:hover {
		transform: scale(1.02);
	}

	.patreon:focus-visible {
		outline: 2px solid hsl(var(--ring));
		outline-offset: 3px;
	}

	.patreon-mark {
		width: 40px;
		height: 40px;
		flex-shrink: 0;
		color: rgb(147 51 234);
	}

	.patreon-title {
		margin: 0;
		font-family: var(--font-heading);
		font-size: 1.05rem;
		font-weight: 700;
		line-height: 1.2;
		color: rgb(126 34 206);
	}

	:global(.dark) .patreon-title {
		color: rgb(216 180 254);
	}

	.patreon-body {
		margin: 0;
		font-family: var(--font-body);
		font-size: 0.75rem;
		line-height: 1.45;
		color: hsl(var(--muted-foreground));
	}

	@media (prefers-reduced-motion: reduce) {
		.patreon {
			transition: none;
		}

		.patreon:hover {
			transform: none;
		}
	}
</style>
