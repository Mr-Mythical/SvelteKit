<script lang="ts">
	let open = false;
	import Button from '$lib/components/ui/button/button.svelte';
	import Sun from 'lucide-svelte/icons/sun';
	import Moon from 'lucide-svelte/icons/moon';
	import { toggleMode } from 'mode-watcher';
	import Menu from 'lucide-svelte/icons/menu';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
</script>

<header>
	<nav class="m-auto border-b-2 py-4 shadow-lg">
		<div class="container flex flex-wrap items-center justify-between px-2 md:px-16">
			<a href="/">
				<div class="flex items-center">
					<img
						src="../Logo64x64.webp"
						alt="Mr. Mythical Logo"
						class="h-10 w-10 md:h-16 md:w-16"
						srcset="../Logo40x40.webp 40w, ../Logo64x64.webp 64w, ../Logo128x128.webp 128w"
						sizes="(max-width: 768px) 10vw, (min-width: 769px) 16vw"
						loading="lazy"
					/>
					<h1 class="ml-3 font-heading text-2xl font-semibold md:text-3xl">Mr. Mythical</h1>
				</div>
			</a>

			<div class="block md:hidden">
				<Button
					variant="ghost"
					size="icon"
					on:click={() => (open = !open)}
					aria-label="Toggle mobile navigation"
					aria-expanded={open}
					aria-controls="mobile-nav"
					class={`transform transition-transform ${open ? 'rotate-90' : ''}`}
				>
					<Menu />
				</Button>
				<div class={`md:hidden ${open ? 'block' : 'hidden'} mt-2 w-full`} id="mobile-nav"></div>

				<Button on:click={toggleMode} variant="ghost" size="icon" aria-label="Toggle theme">
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
					<li>
						<Button variant="link">
							<a
								href="/"
								class="font-heading text-xl font-semibold text-foreground decoration-accent"
							>
								Home
							</a>
						</Button>
					</li>
					<li>
						<Button variant="link">
							<a
								href="/rating-calculator"
								class="font-heading text-xl font-semibold text-foreground decoration-accent"
							>
								Mythic+ Calculator
							</a>
						</Button>
					</li>
					<li>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger asChild let:builder>
								<Button
									builders={[builder]}
									variant="link"
									class="font-heading text-xl font-semibold text-foreground decoration-accent"
								>
									Raid Tools
								</Button>
							</DropdownMenu.Trigger>
							<DropdownMenu.Content>
								<DropdownMenu.Group asChild let:builder>
									<DropdownMenu.Item>
										<Button
											builders={[builder]}
											variant="link"
											class="font-heading text-xl font-semibold text-foreground decoration-accent"
										>
											<a href="/encounter-analysis" class="w-full">Encounter Analysis</a>
										</Button>
									</DropdownMenu.Item>
									<DropdownMenu.Item>
										<Button
											builders={[builder]}
											variant="link"
											class="font-heading text-xl font-semibold text-foreground decoration-accent"
										>
											<a href="/average-damage-taken" class="w-full">Average Damage Taken</a>
										</Button>
									</DropdownMenu.Item>
								</DropdownMenu.Group>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</li>

					<li>
						<Button variant="link">
							<a
								href="/blog"
								class="font-heading text-xl font-semibold text-foreground decoration-accent"
							>
								Blog
							</a>
						</Button>
					</li>

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
					<li>
						<Button variant="link">
							<a
								href="/"
								class="font-heading text-xl font-semibold text-foreground decoration-accent"
							>
								Home
							</a>
						</Button>
					</li>
					<li>
						<Button variant="link">
							<a
								href="/rating-calculator"
								class="font-heading text-xl font-semibold text-foreground decoration-accent"
							>
								Mythic+ Calculator
							</a>
						</Button>
					</li>
					<li>
						<Button variant="link">
							<a
								href="/encounter-analysis"
								class="font-heading text-xl font-semibold text-foreground decoration-accent"
							>
								Encounter Analysis
							</a>
						</Button>
					</li>
					<li>
						<Button variant="link">
							<a
								href="/average-damage-taken"
								class="font-heading text-xl font-semibold text-foreground decoration-accent"
							>
								Damage Taken Analysis
							</a>
						</Button>
					</li>

					<li>
						<Button variant="link">
							<a
								href="/blog"
								class="font-heading text-xl font-semibold text-foreground decoration-accent"
							>
								Blog
							</a>
						</Button>
					</li>
				</ul>
			</div>
		</div>
	</nav>
</header>
