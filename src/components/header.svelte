<script lang="ts">
	let open = false;
	import Button from '$lib/components/ui/button/button.svelte';
	import Sun from 'lucide-svelte/icons/sun';
	import Moon from 'lucide-svelte/icons/moon';
	import { toggleMode } from 'mode-watcher';
	import Menu from 'lucide-svelte/icons/menu';
</script>

<nav class="m-auto border-b-2 py-4 shadow-lg">
	<div class="container flex flex-wrap items-center justify-between px-2 md:px-16">
		<a href="/">
			<div class="flex items-center">
				<img src="../android-chrome-192x192.png" alt="Logo" class="size-10 md:size-16" />
				<h1 class="text-primary ml-3 text-2xl font-semibold md:text-3xl">Mr. Mythical</h1>
			</div>
		</a>
		<div class="block md:hidden">
			<Button
				variant="ghost"
				size="icon"
				on:click={() => (open = !open)}
				aria-expanded={open}
				aria-controls="mobile-nav"
				class={`transform transition-transform ${open ? 'rotate-90' : ''}`}
			>
				<Menu />
			</Button>

			<div class={`md:hidden ${open ? 'block' : 'hidden'} mt-2 w-full`} id="mobile-nav"></div>

			<Button on:click={toggleMode} variant="ghost" size="icon">
				<Sun
					class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
				/>
				<Moon
					class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
				/>
				<span class="sr-only">Toggle theme</span>
			</Button>
		</div>

		<div class="hidden w-auto md:block">
			<ul class="flex space-x-3">
				<li><Button variant="link"><a href="/" class="text-lg font-semibold">Home</a></Button></li>
				<li>
					<Button on:click={toggleMode} variant="ghost" size="icon">
						<Sun
							class="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
						/>
						<Moon
							class="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
						/>
						<span class="sr-only">Toggle theme</span>
					</Button>
				</li>
			</ul>
		</div>

		<div class={`md:hidden ${open ? 'block' : 'hidden'} mt-2 w-full`}>
			<ul class="flex flex-col space-y-2">
				<li><Button variant="link"><a href="/" class="text-lg font-semibold">Home</a></Button></li>
			</ul>
		</div>
	</div>
</nav>
