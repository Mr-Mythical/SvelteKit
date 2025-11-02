<script lang="ts">
	import SEO from '../components/seo.svelte';
	import Footer from '../components/footer.svelte';
	import { Button } from '$lib/components/ui/button';
</script>

<SEO
	title="Mr. Mythical - World of Warcraft Tools | Mythic+ & Raid Optimization"
	description="Master World of Warcraft content with Mr. Mythical's advanced tools. Calculate Mythic+ scores, analyze raid encounters, improve gameplay strategy, and optimize your WoW performance."
	image="https://mrmythical.com/Logo.png"
	keywords="World of Warcraft tools, Mythic+ calculator, raid analysis, WoW dungeon optimization, Warcraft logs, M+ score tracker, WoW addons, raid progression"
/>
<main class="container mx-auto px-4 py-8">
	<section class="mb-12 text-center">
		<h1 class="mb-4 text-4xl font-bold">Master World of Warcraft with Mr. Mythical</h1>
		<p class="mb-6 text-lg">
			Professional-grade tools for Mythic+ enthusiasts and raid teams. Optimize your strategy, track
			your progression, and dominate Azeroth's toughest challenges.
		</p>
		<div class="flex justify-center gap-4"></div>
	</section>

	<section class="prose prose-invert mb-12 max-w-none rounded-lg bg-card p-6 shadow-md">
		<h2 class="text-2xl font-bold">Premium WoW Tools for Competitive Players</h2>
		<p>
			Mr. Mythical provides World of Warcraft analysis tools. Our platform transforms complex game
			data into actionable insights, helping you make smarter decisions in Mythic+ dungeons and raid
			encounters. Whether you're pushing +20 keys or progressing through mythic raids, our
			calculators and visualizations give you the competitive edge.
		</p>
		<br />
		<p>
			Mr. Mythical bridges the gap between raw combat logs and practical gameplay improvements. All
			tools are updated regularly to match the latest game patches and seasons.
		</p>
	</section>

	<section class="mb-12">
		<h2 class="mb-6 text-3xl font-bold">Mythic+ Optimization Suite</h2>
		<div class="grid grid-cols-1 gap-8 md:grid-cols-2">
			<div class="rounded-lg bg-card p-6 shadow-md">
				<h3 class="mb-4 text-2xl font-semibold">Mythic+ Score Calculator</h3>
				<p class="mb-4">
					Calculate the required keystones to reach your desired World of Warcraft Mythic+ score,
					plan dungeon runs, and optimize your M+ score with this interactive calculator. Import
					your character, set score goals, and share your plans using the export/import features.
				</p>

				<Button>
					<a href="/rating-calculator" class="px-6 py-3">Calculate Your Score</a>
				</Button>
			</div>
			<div class="rounded-lg bg-card p-6 shadow-md">
				<h3 class="mb-4 text-2xl font-semibold">Enhanced Keystone Tooltip Addon</h3>
				<p class="mb-4">
					The Mr. Mythical addon gives you enhanced and customizable Mythic+ keystone tooltips with
					instant, detailed information. See dungeon rewards, crest earnings, and your potential
					score directly in tooltips and chat.
				</p>

				<p class="mb-6">
					Install directly via CurseForge or Wago Addons for instant in-game insights.
				</p>
				<Button class="mr-2 mt-2">
					<a
						href="https://www.curseforge.com/wow/addons/mr-mythical"
						target="_blank"
						class="px-6 py-3"
					>
						Download on CurseForge
					</a>
				</Button>
				<Button class="ml-2 mt-2">
					<a href="https://addons.wago.io/addons/mr-mythical" target="_blank" class="px-6 py-3">
						Download on Wago Addons
					</a>
				</Button>
			</div>
		</div>
	</section>

	<section class="mb-12">
		<h2 class="mb-6 text-3xl font-bold">Raid Analysis Toolkit</h2>
		<div class="mb-6">
			<p>
				Transform Warcraft Logs into visual mastery with our raid analysis suite. Designed for raid
				leaders and serious progression guilds, these tools help identify wipe causes, optimize
				cooldown usage, and improve raid coordination.
			</p>
		</div>
		<div class="grid grid-cols-1 gap-8 md:grid-cols-2">
			<div class="rounded-lg bg-card p-6 shadow-md">
				<h3 class="mb-4 text-2xl font-semibold">Encounter Healing Analysis</h3>
				<p class="mb-4">Deep dive into raid performance with features:</p>
				<ul class="mb-4 ml-6 list-disc">
					<li>Damage/healing timeline visualization</li>
					<li>Boss and healer ability overlays</li>
				</ul>
				<p class="mb-6">
					Import any WCL report for instant visual breakdowns. Or browse by healer comp
				</p>
				<Button><a href="/encounter-analysis" class="px-6 py-3">Analyze Raid Reports</a></Button>
			</div>
			<div class="rounded-lg bg-card p-6 shadow-md">
				<h3 class="mb-4 text-2xl font-semibold">Encounter Damage Pattern</h3>
				<p class="mb-4">Identify critical raid moments through:</p>
				<ul class="mb-4 ml-6 list-disc">
					<li>Average damage taken charts</li>
					<li>Spike damage identification</li>
					<li>Healing requirement forecasting</li>
				</ul>
				<p class="mb-6">Perfect for diagnosing recurring wipe patterns.</p>
				<Button><a href="/average-damage-taken" class="px-6 py-3">View Damage Patterns</a></Button>
			</div>
		</div>
	</section>

	<!-- Enhanced About Section -->
	<section class="rounded-lg bg-card p-8 shadow-md">
		<h2 class="mb-4 text-3xl font-bold">About Mr. Mythical</h2>
		<p class="mb-4">
			MrMythical.com is a passion project created to elevate World of Warcraft gameplay with clean,
			efficient, and reliable tools for Mythic+ and raid content. Built by an active player and
			developer, the platform aims to provide the community with actionable analytics and utilities
			that make a real difference.
		</p>
		<p class="mb-4">
			The project is open source and thrives on community feedback. Contribute or suggest
			improvements on
			<a
				href="https://github.com/Mr-Mythical/SvelteKit"
				target="_blank"
				class="font-bold text-link underline">GitHub</a
			>.
		</p>
		<p class="mb-4">
			Support is welcome via
			<a
				href="https://www.patreon.com/mrmythical"
				target="_blank"
				class="font-bold text-link underline">Patreon</a
			>
			— it helps cover server costs and enables new features.
		</p>
		<p class="mb-4">
			Your privacy is respected: no tracking or analytics services are used. See our
			<a href="/privacy" class="font-bold text-link underline">Privacy Policy</a>
			for details.
		</p>
		<p class="mb-6">
			Want to learn more? Visit the full <a href="/about" class="font-bold text-link underline"
				>About page</a
			> for the story, philosophy, and ways to get in touch.
		</p>
	</section>
</main>

<Footer />
