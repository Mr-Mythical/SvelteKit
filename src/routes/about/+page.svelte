<script lang="ts">
	import SEO from '../../components/seo.svelte';
	import Footer from '../../components/layout/footer.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ADDONS, DISCORD_URL, FLAGSHIP_ADDON } from '$lib/data/addons';
</script>

<SEO
	title="About Mr. Mythical | Mythic+ & Raid Tools"
	description="Mr. Mythical is a Mythic+ and raid toolkit for World of Warcraft: score calculator, log visualizer, boss profiles, and in-game addons."
	image="https://mrmythical.com/Logo.png"
/>

<main class="container mx-auto px-4 py-8">
	<article class="mx-auto max-w-4xl">
		<h1 class="mb-6 text-4xl font-bold">About Mr. Mythical</h1>

		<p class="mb-6">
			Mr. Mythical helps you get useful answers out of Warcraft Logs and Mythic+ score math between
			runs. If you need a score plan, a clearer look at a pull, or a sense of how hard a boss hits,
			this is built for that. The website tools and the in-game addons are meant to show the numbers
			that actually change what you do next.
		</p>

		<h2 class="mt-8 mb-4 text-2xl font-bold">Web tools</h2>
		<ul class="mb-6 ml-6 list-disc space-y-2">
			<li>
				<strong>Mythic+ Score Calculator:</strong> Set a target rating and see which keystones get you
				there. You can import characters, share plans with a URL, and adjust for affixes.
			</li>
			<li>
				<strong>Raid Log Visualizer:</strong> Paste a Warcraft Logs report to see damage and healing
				per second on one timeline, with ability overlays. You can also browse public logs when you want
				comps and pull lengths for a boss.
			</li>
			<li>
				<strong>Boss Damage &amp; Death Profiles:</strong> Averaged damage taken and death hotspots from
				public Mythic kills, so you can see the spikes that tend to wipe pulls.
			</li>
		</ul>

		<h2 class="mt-8 mb-4 text-2xl font-bold">In-game addons</h2>
		<p class="mb-4">
			There is also an addon suite for World of Warcraft. Start with
			<Button
				class="text-link p-0 text-[1.03rem] font-bold"
				variant="link"
				href={`/addons/${FLAGSHIP_ADDON.id}`}
			>
				{FLAGSHIP_ADDON.name}
			</Button>
			, then pick up the others if you need them — or browse the full
			<a class="text-link font-semibold" href="/addons">addons page</a>:
		</p>
		<ul class="mb-6 ml-6 list-disc space-y-2">
			{#each ADDONS as addon (addon.id)}
				<li>
					<a class="text-link font-semibold" href={`/addons/${addon.id}`}>{addon.name}</a>:
					{addon.tagline}
					<a
						class="text-link font-semibold"
						href={addon.links.curseforge}
						target="_blank"
						rel="noopener noreferrer">CurseForge</a
					>
					·
					<a
						class="text-link font-semibold"
						href={addon.links.wago}
						target="_blank"
						rel="noopener noreferrer">Wago</a
					>
				</li>
			{/each}
		</ul>

		<h2 class="mt-8 mb-4 text-2xl font-bold">Why it exists</h2>
		<p class="mb-6">
			Jumping between half a dozen sites between keys gets old fast. Mr. Mythical started as one
			player's attempt to put score planning, log reading, and boss timing in one place that stays
			accurate and quick to use. It is still shaped by feedback from people who play with it.
		</p>

		<h2 class="mt-8 mb-4 text-2xl font-bold">How it is built</h2>
		<ul class="mb-6 ml-6 list-disc space-y-2">
			<li>
				<strong>Accuracy:</strong> Score math and encounter data are checked against what happens in-game
			</li>
			<li>
				<strong>Speed:</strong> You should get an answer right away, without a long tutorial first
			</li>
			<li>
				<strong>Clarity:</strong> Keep the numbers that change a decision, and cut the rest
			</li>
		</ul>

		<h2 class="mt-8 mb-4 text-2xl font-bold">Community and open source</h2>
		<p class="mb-6">
			Join the
			<Button
				class="text-link p-0 text-[1.03rem] font-bold"
				variant="link"
				href={DISCORD_URL}
				target="_blank"
				rel="noopener noreferrer"
			>
				Discord
			</Button>
			for feedback, bug reports, and addon talk, or contribute on
			<Button
				class="text-link p-0 text-[1.03rem] font-bold"
				variant="link"
				href="https://github.com/Mr-Mythical/SvelteKit"
				target="_blank"
				rel="noopener noreferrer"
			>
				GitHub
			</Button>. Code, issues, and suggestions are welcome.
		</p>

		<h2 class="mt-8 mb-4 text-2xl font-bold">Support</h2>
		<p class="mb-6">
			The site and addons stay free. If they help your keys or your raid, you can support
			development on
			<Button
				class="text-link p-0 text-[1.03rem] font-bold"
				variant="link"
				href="https://www.patreon.com/mrmythical"
				target="_blank"
				rel="noopener noreferrer"
			>
				Patreon
			</Button>.
		</p>

		<h2 class="mt-8 mb-4 text-2xl font-bold">Privacy</h2>
		<p class="mb-6">
			There are no tracking or analytics services. More detail is in the
			<Button class="text-link p-0 text-[1.03rem] font-bold" variant="link" href="/privacy">
				Privacy Policy
			</Button>.
		</p>

		<h2 class="mt-8 mb-4 text-2xl font-bold">Get in touch</h2>
		<p class="mb-6">
			Got an idea, some feedback, or a bug? Join the
			<Button
				class="text-link p-0 text-[1.03rem] font-bold"
				variant="link"
				href={DISCORD_URL}
				target="_blank"
				rel="noopener noreferrer"
			>
				Discord
			</Button>
			or email
			<Button
				class="text-link p-0 text-[1.03rem] font-bold"
				variant="link"
				href="mailto:mythical@mrmythical.com"
			>
				mythical@mrmythical.com
			</Button>.
		</p>
	</article>
</main>

<Footer />
