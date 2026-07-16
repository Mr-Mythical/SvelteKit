<script lang="ts">
	import SEO from '../../components/seo.svelte';
	import Footer from '../../components/layout/footer.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { ADDONS, DISCORD_URL, FLAGSHIP_ADDON } from '$lib/data/addons';
</script>

<SEO
	title="About MrMythical | World of Warcraft Mythic+ & Raid Tools"
	description="Learn more about MrMythical.com — what it's for, who made it, and how it helps World of Warcraft players improve their Mythic+ and raid performance."
	image="https://mrmythical.com/Logo.png"
/>

<main class="container mx-auto px-4 py-8">
	<article class="mx-auto max-w-4xl">
		<h1 class="mb-6 text-4xl font-bold">About Mr. Mythical</h1>

		<p class="mb-6">
			Welcome to MrMythical.com, a passion project born from the desire to elevate World of Warcraft
			gameplay through better tools and analytics. As an active player and developer, I created this
			platform to provide the community with clean, efficient, and reliable utilities for both
			Mythic+ and raid content.
		</p>

		<h2 class="mt-8 mb-4 text-2xl font-bold">Our Tools</h2>
		<ul class="mb-6 ml-6 list-disc space-y-2">
			<li>
				<strong>Mythic+ Rating Calculator:</strong> Plan your key pushing strategy and understand exactly
				how different dungeons impact your overall score
			</li>
			<li>
				<strong>Encounter Healing Analyzer:</strong> Visualize raid healing, damage taken and abilities
				used during encounters, helping you optimize your raids healing strategy
			</li>
			<li>
				<strong>Average Damage Taken:</strong> Using Warcraft Logs data from public Mythic kills, this
				tool helps you understand how much damage your raid typically takes against each boss every second,
				allowing for better planning and survivability
			</li>
		</ul>

		<h2 class="mt-8 mb-4 text-2xl font-bold">In-Game Addons</h2>
		<p class="mb-4">
			Beyond the website, the Mr. Mythical addon suite brings the same toolkit into World of
			Warcraft. Start with
			<Button
				class="text-link p-0 text-[1.03rem] font-bold"
				variant="link"
				href={FLAGSHIP_ADDON.links.curseforge}
				target="_blank"
				rel="noopener noreferrer"
			>
				{FLAGSHIP_ADDON.name}
			</Button>
			on CurseForge or Wago, then add companions as you need them:
		</p>
		<ul class="mb-6 ml-6 list-disc space-y-2">
			{#each ADDONS as addon (addon.id)}
				<li>
					<strong>{addon.name}:</strong>
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

		<h2 class="mt-8 mb-4 text-2xl font-bold">The Story Behind Mr. Mythical</h2>
		<p class="mb-6">
			As a dedicated Mythic+ pusher and raid optimizer, I found myself juggling between various
			tools, spreadsheets, and community resources that didn't quite hit the mark. The constant
			tab-switching and data inconsistencies were frustrating, especially during key pushes or
			progression raids. That's when I decided to create MrMythical.com, a centralized platform that
			delivers exactly what players need, when they need it, without the clutter.
		</p>

		<h2 class="mt-8 mb-4 text-2xl font-bold">Development Philosophy</h2>
		<p class="mb-6">Three core principles guide the development of Mr. Mythical:</p>
		<ul class="mb-6 ml-6 list-disc space-y-2">
			<li><strong>Accuracy:</strong> All tools are regularly validated against in-game results</li>
			<li><strong>Speed:</strong> Fast, responsive interfaces that won't slow you down</li>
			<li>
				<strong>Simplicity:</strong> Clean, intuitive design without sacrificing functionality
			</li>
		</ul>

		<h2 class="mt-8 mb-4 text-2xl font-bold">Community and Open Source</h2>
		<p class="mb-6">
			MrMythical.com thrives on community feedback and collaboration. Join the
			<Button
				class="text-link p-0 text-[1.03rem] font-bold"
				variant="link"
				href={DISCORD_URL}
				target="_blank"
				rel="noopener noreferrer"
			>
				Discord
			</Button>
			for feedback, bug reports, and addon talk — or contribute on
			<Button
				class="text-link p-0 text-[1.03rem] font-bold"
				variant="link"
				href="https://github.com/Mr-Mythical/SvelteKit"
				target="_blank"
				rel="noopener noreferrer"
			>
				GitHub
			</Button>, where players can contribute code, report issues, or suggest improvements. This
			transparency ensures the tools remain relevant and reliable for everyone.
		</p>

		<h2 class="mt-8 mb-4 text-2xl font-bold">Support the Journey</h2>
		<p class="mb-6">
			While MrMythical.com is and will always remain free to use, maintaining and improving these
			tools requires significant time and resources. If you find value in these tools, consider
			supporting the project on
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

		<h2 class="mt-8 mb-4 text-2xl font-bold">Privacy Commitment</h2>
		<p class="mb-6">
			Your privacy matters. The site does not use tracking or analytics services. Review our
			detailed
			<Button class="text-link p-0 text-[1.03rem] font-bold" variant="link" href="/privacy">
				Privacy Policy
			</Button> for complete transparency.
		</p>

		<h2 class="mt-8 mb-4 text-2xl font-bold">Get in Touch</h2>
		<p class="mb-6">
			Have ideas, feedback, or found a bug? Join the
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
			</Button>. Your input helps make Mr. Mythical better for everyone.
		</p>
	</article>
</main>

<Footer />
