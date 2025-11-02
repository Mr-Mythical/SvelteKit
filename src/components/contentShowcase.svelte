<script lang="ts">
	import { onMount } from 'svelte';
	import { generateDynamicLink } from '$lib/utils/linkObfuscation';
	import { enhanceContentVisibility, checkContentBlocking } from '$lib/utils/stealthContent';
	import { createRotatingUrl, createDecoyElements } from '$lib/utils/dynamicContent';

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
	let dynamicLinkUrl = '/api/redirect?t=Z3VpZGU='; // Default fallback

	// Initialize currentContent to always have a value, even during SSR
	$: currentContent = content[currentIndex] || content[0];

	onMount(() => {
		mounted = true;

		// Generate dynamic link on client-side to avoid detection
		dynamicLinkUrl = generateDynamicLink();

		// Apply stealth techniques
		enhanceContentVisibility();
		createDecoyElements();

		if (checkContentBlocking()) {
			dynamicLinkUrl = createRotatingUrl();
		}

		const interval = setInterval(() => {
			currentIndex = (currentIndex + 1) % content.length;
			if (currentIndex === 0) {
				dynamicLinkUrl = checkContentBlocking() ? createRotatingUrl() : generateDynamicLink();
			}
		}, 20000);

		return () => clearInterval(interval);
	});

	function changeContent(index: number) {
		currentIndex = index;
	}
</script>

<!-- Content Showcase -->
<section
	class="mb-6 mt-6 flex w-full items-center justify-center"
	data-content-type="showcase"
	bind:this={containerElement}
>
	<div class="relative mx-auto min-h-[90px] overflow-hidden rounded-lg shadow-lg">
		<a
			href={dynamicLinkUrl}
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
</section>

<style>
	/* Anti-blocking techniques */
	section[data-content-type='showcase'] {
		display: block !important;
		visibility: visible !important;
		opacity: 1 !important;
		position: relative !important;
		height: auto !important;
		width: auto !important;
		z-index: 1 !important;
	}

	section[data-content-type='showcase'] > div {
		display: block !important;
		visibility: visible !important;
	}

	section[data-content-type='showcase'] a {
		display: block !important;
		visibility: visible !important;
		text-decoration: none !important;
	}

	section[data-content-type='showcase'] img {
		display: block !important;
		visibility: visible !important;
		opacity: 1 !important;
	}

	/* Responsive adjustments */
	@media (max-width: 768px) {
		section :global(img) {
			max-width: 100%;
			height: auto;
		}
	}

	/* Fallback for heavily blocked content */
	@supports not (display: block) {
		section[data-content-type='showcase'] {
			position: static;
			display: table;
		}
	}
</style>
