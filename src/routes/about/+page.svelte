<script lang="ts">
	import Header from '../../components/header.svelte';
	import SEO from '../../components/seo.svelte';
	import Footer from '../../components/footer.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
</script>

<SEO
	title="About MrMythical"
	description="Learn more about MrMythical.com — what it's for, who made it, and how it helps World of Warcraft players improve their Mythic+ and raid performance."
	image="https://mrmythical.com/Logo.png"
/>

<Header />

<main>
	<article class="container mx-auto p-4 md:px-16 lg:px-52 xl:px-80">
		<h1 class="mb-4 text-3xl font-bold">About Mr. Mythical</h1>

		<p class="mb-6">
			Welcome to MrMythical.com, a passion project born from the desire to elevate World of Warcraft
			gameplay through better tools and analytics. As an active player and developer, I created this
			platform to provide the community with clean, efficient, and reliable utilities for both
			Mythic+ and raid content.
		</p>

		<h2 class="mb-4 mt-8 text-2xl font-bold">Our Tools</h2>
		<ul class="mb-6 ml-6 list-disc space-y-2">
			<li>
				<strong>Mythic+ Rating Calculator:</strong> Plan your key pushing strategy and understand exactly
				how different dungeons impact your overall score
			</li>
			<li>
				<strong>Keystone Tooltip Addon:</strong> Get instant score predictions and gear drops without
				alt-tabbing, seamlessly integrated into your gameplay
			</li>
			<li>
				<strong>Encounter Healing Analyzer:</strong> Visualize raid healing, damage taken and abilities
				used during encounters, helping you optimize your raids healing strategy
			</li>
			<li>
				<strong>Average Damage Taken:</strong> Using data from Warcraft Logs, this tool helps you understand
				how much damage your raid typically takes in various raid encounters every second, allowing for
				better planning and survivability
			</li>
		</ul>

		<h2 class="mb-4 mt-8 text-2xl font-bold">The Story Behind Mr. Mythical</h2>
		<p class="mb-6">
			As a dedicated Mythic+ pusher and raid optimizer, I found myself juggling between various
			tools, spreadsheets, and community resources that didn't quite hit the mark. The constant
			tab-switching and data inconsistencies were frustrating, especially during key pushes or
			progression raids. That's when I decided to create MrMythical.com, a centralized platform that
			delivers exactly what players need, when they need it, without the clutter.
		</p>

		<h2 class="mb-4 mt-8 text-2xl font-bold">Development Philosophy</h2>
		<p class="mb-6">Three core principles guide the development of Mr. Mythical:</p>
		<ul class="mb-6 ml-6 list-disc space-y-2">
			<li><strong>Accuracy:</strong> All tools are regularly validated against in-game results</li>
			<li><strong>Speed:</strong> Fast, responsive interfaces that won't slow you down</li>
			<li>
				<strong>Simplicity:</strong> Clean, intuitive design without sacrificing functionality
			</li>
		</ul>

		<h2 class="mb-4 mt-8 text-2xl font-bold">Community and Open Source</h2>
		<p class="mb-6">
			MrMythical.com thrives on community feedback and collaboration. The entire project is open
			source on
			<Button
				class="p-0 text-[1.03rem] font-bold text-link"
				variant="link"
				href="https://github.com/Mr-Mythical/SvelteKit"
				target="_blank"
				rel="noopener noreferrer"
			>
				GitHub
			</Button>, where players can contribute code, report issues, or suggest improvements. This
			transparency ensures the tools remain relevant and reliable for everyone.
		</p>

		<h2 class="mb-4 mt-8 text-2xl font-bold">Support the Journey</h2>
		<p class="mb-6">
			While MrMythical.com is and will always remain free to use, maintaining and improving these
			tools requires significant time and resources. If you find value in these tools, consider
			supporting the project on
			<Button
				class="p-0 text-[1.03rem] font-bold text-link"
				variant="link"
				href="https://www.patreon.com/mrmythical"
				target="_blank"
				rel="noopener noreferrer"
			>
				Patreon
			</Button>.
		</p>

		<h2 class="mb-4 mt-8 text-2xl font-bold">Privacy Commitment</h2>
		<p class="mb-6">
			Your privacy matters. The site does not use tracking or analytics services. Review our detailed
			<Button class="p-0 text-[1.03rem] font-bold text-link" variant="link" href="/privacy">
				Privacy Policy
			</Button> for complete transparency.
		</p>

		<h2 class="mb-4 mt-8 text-2xl font-bold">Get in Touch</h2>
		<p class="mb-6">
			Have ideas, feedback, or found a bug? I'd love to hear from you! Reach out via
			<Button
				class="p-0 text-[1.03rem] font-bold text-link"
				variant="link"
				href="mailto:mythical@mrmythical.com"
			>
				mythical@mrmythical.com
			</Button>
			. Your input helps make Mr. Mythical better for everyone.
		</p>
	</article>
</main>

<Footer />
