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
		class="fixed bottom-0 right-4 z-50 hidden lg:block"
		data-affiliate-type="bottom-anchor"
		transition:fly|local={{ y: 100, duration: 600 }}
	>
		<div class="relative overflow-hidden rounded-t-lg shadow-2xl">
			<button
				on:click={closeBanner}
				class="absolute right-4 top-4 z-10 m-0 flex h-6 w-6 items-center justify-center rounded-full border-none bg-black/60 p-0 text-white hover:bg-black/80 focus:outline-none"
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
					class="h-auto max-h-[311px] w-full max-w-[220px]"
					style="aspect-ratio: 440/623;"
				/>
			</a>
		</div>
	</aside>
{/if}
