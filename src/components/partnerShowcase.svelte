<script lang="ts">
	import { onMount } from 'svelte';

	interface Content {
		src: string;
		alt: string;
		variant: string;
	}

	const content: Content[] = [
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

	let currentIndex = 0;
	let containerElement: HTMLElement;
	let mounted = false;

	// Initialize currentContent to always have a value, even during SSR
	$: currentContent = content[currentIndex] || content[0];

	onMount(() => {
		mounted = true;
		const interval = setInterval(() => {
			currentIndex = (currentIndex + 1) % content.length;
		}, 20000);

		return () => clearInterval(interval);
	});

	function changeContent(index: number) {
		currentIndex = index;
	}
</script>

<!-- RestedXP Content Showcase -->
<section class="mb-6 mt-6 flex w-full justify-center" bind:this={containerElement}>
	<div class="relative min-h-[90px] overflow-hidden rounded-lg shadow-lg">
		<a
			href="https://shop.restedxp.com/ref/Braunerr/"
			target="_blank"
			rel="noopener noreferrer"
			class="block transition-transform hover:scale-105"
			aria-label={`${currentContent?.alt || content[0].alt} - Click to visit RestedXP`}
		>
			<img
				src={currentContent?.src || content[0].src}
				alt={currentContent?.alt || content[0].alt}
				width="728"
				height="90"
				loading="eager"
				class="block h-auto w-full max-w-[728px]"
				style="aspect-ratio: 728/90;"
			/>
		</a>

		<!-- Content indicators - only show when mounted to avoid hydration issues -->
		{#if mounted}
			<div class="absolute bottom-2 left-1/2 flex -translate-x-1/2 space-x-1">
				{#each content as _, index}
					<button
						class="h-2 w-2 rounded-full transition-all duration-200 {index === currentIndex
							? 'bg-white'
							: 'bg-white/50 hover:bg-white/75'}"
						on:click={() => changeContent(index)}
						aria-label={`Show content ${index + 1}`}
					/>
				{/each}
			</div>
		{/if}
	</div>
</section>

<style>
	/* Responsive adjustments */
	@media (max-width: 768px) {
		section :global(img) {
			max-width: 100%;
			height: auto;
		}
	}
</style>
