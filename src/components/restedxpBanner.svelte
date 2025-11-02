<script lang="ts">
	import { onMount } from 'svelte';

	interface Banner {
		src: string;
		alt: string;
		variant: string;
	}

	const banners: Banner[] = [
		{
			src: 'https://shop.restedxp.com/wp-content/uploads/2025/03/rxp-web_banner-leaderboard.png',
			alt: 'RestedXP - Level Faster',
			variant: 'default'
		},
		{
			src: 'https://shop.restedxp.com/wp-content/uploads/2025/03/rxp-web_banner-leaderboard-cata.png',
			alt: 'RestedXP - Cataclysm Leveling Guide',
			variant: 'cata'
		},
		{
			src: 'https://shop.restedxp.com/wp-content/uploads/2025/03/rxp-web_banner-leaderboard-hc.png',
			alt: 'RestedXP - Hardcore Leveling Guide',
			variant: 'hardcore'
		},
		{
			src: 'https://shop.restedxp.com/wp-content/uploads/2025/03/rxp-web_banner-leaderboard-tww.png',
			alt: 'RestedXP - The War Within Guide',
			variant: 'tww'
		},
		{
			src: 'https://shop.restedxp.com/wp-content/uploads/2025/05/rxp-web_banner-leaderboard-mop.png',
			alt: 'RestedXP - Mists of Pandaria Guide',
			variant: 'mop'
		}
	];

	let currentBannerIndex = 0;
	let bannerElement: HTMLDivElement;
	let mounted = false;

	// Initialize currentBanner to always have a value, even during SSR
	$: currentBanner = banners[currentBannerIndex] || banners[0];

	onMount(() => {
		mounted = true;
		const interval = setInterval(() => {
			currentBannerIndex = (currentBannerIndex + 1) % banners.length;
		}, 20000);

		return () => clearInterval(interval);
	});

	function changeBanner(index: number) {
		currentBannerIndex = index;
	}
</script>

<!-- RestedXP Banner Component -->
<div class="mb-6 mt-6 flex w-full justify-center" bind:this={bannerElement}>
	<div class="relative min-h-[90px] overflow-hidden rounded-lg shadow-lg">
		<a
			href="https://shop.restedxp.com/ref/Braunerr/"
			target="_blank"
			rel="noopener noreferrer"
			class="block transition-transform hover:scale-105"
			aria-label={`${currentBanner?.alt || banners[0].alt} - Click to visit RestedXP`}
		>
			<img
				src={currentBanner?.src || banners[0].src}
				alt={currentBanner?.alt || banners[0].alt}
				width="728"
				height="90"
				loading="eager"
				class="block h-auto w-full max-w-[728px]"
				style="aspect-ratio: 728/90;"
			/>
		</a>

		<!-- Banner indicators - only show when mounted to avoid hydration issues -->
		{#if mounted}
			<div class="absolute bottom-2 left-1/2 flex -translate-x-1/2 space-x-1">
				{#each banners as _, index}
					<button
						class="h-2 w-2 rounded-full transition-all duration-200 {index === currentBannerIndex
							? 'bg-white'
							: 'bg-white/50 hover:bg-white/75'}"
						on:click={() => changeBanner(index)}
						aria-label={`Show banner ${index + 1}`}
					/>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	/* Responsive adjustments */
	@media (max-width: 768px) {
		div :global(img) {
			max-width: 100%;
			height: auto;
		}
	}
</style>
