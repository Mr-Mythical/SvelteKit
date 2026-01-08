<script lang="ts">
	import { onMount } from 'svelte';

	interface Content {
		src: string;
		alt: string;
		variant: string;
	}

	const content: Content[] = [
		{
			src: '/assets/content-default.png',
			alt: 'Gaming Guide - Level Faster',
			variant: 'default'
		},
		{
			src: '/assets/content-classic.png',
			alt: 'Gaming Guide - Classic Content',
			variant: 'classic'
		},
		{
			src: '/assets/content-hardcore.png',
			alt: 'Gaming Guide - Hardcore Mode',
			variant: 'hardcore'
		},
		{
			src: '/assets/content-expansion.png',
			alt: 'Gaming Guide - Latest Expansion',
			variant: 'expansion'
		},
		{
			src: '/assets/content-pandaria.png',
			alt: 'Gaming Guide - Adventure Content',
			variant: 'adventure'
		}
	];

	let currentIndex = 0;
	let containerElement: HTMLElement;
	let mounted = false;
	let adBlocked = false;
	let showPatreon = false;
	let rotationCount = 0;

	$: currentContent = content[currentIndex] || content[0];

	onMount(() => {
		mounted = true;

		// Detect ad blockers by checking if typical ad-class elements are hidden
		const testAd = document.createElement('div');
		testAd.className = 'ad ads advertisement banner-ad';
		testAd.style.cssText = 'height:1px;width:1px;position:absolute;left:-9999px;';
		document.body.appendChild(testAd);
		setTimeout(() => {
			const isBlocked = testAd.offsetHeight === 0 || testAd.offsetParent === null;
			adBlocked = isBlocked;
			document.body.removeChild(testAd);
		}, 100);

		const interval = setInterval(() => {
			currentIndex = (currentIndex + 1) % content.length;
			rotationCount += 1;
			// Every 2nd rotation, surface Patreon even when not blocked
			showPatreon = adBlocked || rotationCount % 2 === 0;
		}, 15000);

		return () => clearInterval(interval);
	});

	function changeContent(index: number) {
		currentIndex = index;
	}
</script>

<!-- Content Showcase -->
<section
	class="mt-6 flex w-full items-center justify-center"
	data-content-type="showcase"
	bind:this={containerElement}
>
	{#if adBlocked || showPatreon}
		<!-- Patreon fallback / rotation -->
		<div
			class="relative mx-auto min-h-[90px] w-full max-w-[728px] overflow-hidden rounded-lg border-2 border-purple-500 bg-gradient-to-r from-purple-500/10 to-pink-500/10 shadow-lg"
		>
			<a
				href="https://www.patreon.com/MrMythical"
				target="_blank"
				rel="noopener noreferrer"
				class="flex h-full items-center justify-center gap-4 p-6 transition-transform hover:scale-105"
				aria-label="Support Mr. Mythical on Patreon"
			>
				<svg
					class="h-12 w-12 text-purple-600"
					viewBox="0 0 569 546"
					fill="currentColor"
					xmlns="http://www.w3.org/2000/svg"
				>
					<circle cx="362.589996" cy="204.589996" r="204.589996" />
					<rect width="100" height="545.799988" fill="currentColor" />
				</svg>
				<div class="text-left">
					<p class="text-xl font-bold text-purple-700 dark:text-purple-300">Support on Patreon</p>
					<p class="text-sm text-gray-700 dark:text-gray-200">
						Support MrMythical.com on Patreon to help keep these free, open-source WoW utilities
						accurate and up-to-date.
					</p>
				</div>
			</a>
		</div>
	{:else}
		<div class="relative mx-auto min-h-[90px] overflow-hidden rounded-lg shadow-lg">
			<a
				href="https://shop.restedxp.com/ref/Braunerr/"
				target="_blank"
				rel="noopener noreferrer"
				class="block transition-transform hover:scale-105"
				aria-label={`${currentContent?.alt || content[0].alt} - Click to visit gaming guide`}
			>
				<img
					src={currentContent?.src || content[0].src}
					alt={currentContent?.alt || content[0].alt}
					width="728"
					height="90"
					loading="eager"
					class="mx-auto block h-auto w-full max-w-[728px]"
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
	{/if}
</section>

<style>
	@media (max-width: 768px) {
		section :global(img) {
			max-width: 100%;
			height: auto;
		}
	}
</style>
