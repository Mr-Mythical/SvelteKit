
<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	let visible = false;
	let timer: ReturnType<typeof setTimeout>;
	onMount(() => {
		timer = setTimeout(() => {
			visible = true;
		}, 2000); // Show after 1 second
		return () => clearTimeout(timer);
	});
	function closeBanner() {
		visible = false;
		clearTimeout(timer);
	}
</script>

{#if visible}
<aside
	class="hidden lg:block fixed bottom-0 right-4 z-50"
	data-affiliate-type="bottom-anchor"
	transition:fly|local={{ y: 100, duration: 600 }}
>
	<div class="relative rounded-t-lg overflow-hidden shadow-2xl">
		<button
			on:click={closeBanner}
			class="absolute top-4 right-4 z-10 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center p-0 m-0 border-none hover:bg-black/80 focus:outline-none"
			style="box-shadow: 0 1px 4px rgba(0,0,0,0.18);"
			aria-label="Close banner"
		>
			<span class="text-lg leading-none">&times;</span>
		</button>
		<a
			href="https://advanced.gg/discount/mythical?ref=mythical"
			target="_blank"
			rel="noopener noreferrer"
			class="block transition-transform hover:scale-105"
			aria-label="Advanced.gg - Get exclusive discounts"
		>
			<img
				src="/assets/advanced-gg-banner.png"
				alt="Advanced.gg - Exclusive Mythical Discount"
				width="220"
				height="311"
				loading="lazy"
				class="w-full h-auto max-w-[220px] max-h-[311px]"
				style="aspect-ratio: 440/623;"
			/>
		</a>
	</div>
</aside>
{/if}
