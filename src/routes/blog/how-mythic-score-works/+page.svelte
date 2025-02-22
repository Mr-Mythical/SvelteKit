<script lang="ts">
	import Header from '../../../components/header.svelte';
	import SEO from '../../../components/seo.svelte';
	import Footer from '../../../components/footer.svelte';

	import { Button } from '$lib/components/ui/button';
</script>

<SEO
	title="Understanding the Mythic+ Score System in World of Warcraft"
	description="Learn how the Mythic+ score is calculated, including key levels, breakpoints, and time bonuses. Maximize your score with our tips and tools."
	image="https://mrmythical.com/Logo.png"
	keywords="Mythic Plus, Mythic+, Score System, WoW Tools, how does m+ score works, raider.io score, mythic+ score, how does mythic+ score work, mythic+ score explained"
/>

<Header />

<main>
	<article class="container mx-auto p-4 md:px-16 lg:px-52 xl:px-80">
		<h1 class="mb-2 text-2xl font-bold">
			Understanding the Mythic+ Score System in World of Warcraft
		</h1>

        <h4 class="text-sm italic mb-2">Up To Date For TWW Season 1</h4>

		<p>
			If you’ve been running Mythic+ dungeons in World of Warcraft, you already know how crucial
			your Mythic+ score can be. Not only does it reflect your progress and skill, but it also
			affects how quickly you can find groups and push higher keys. In this guide, we’ll break down
			exactly how your Mythic+ score is calculated and how you can maximize it.
		</p>

		<h2 class="mb-4 mt-4 text-xl font-bold">Keystone Levels and Base Score</h2>
		<ul class="ml-6 list-disc">
			<li>Keystones start at +2 and scale infinitely.</li>
			<li>The base score for a +2 keystone is 165 points.</li>
			<li>Every additional key level adds 15 points to this base score.</li>
		</ul>

		<h2 class="mb-4 mt-4 text-xl font-bold">Affix Breakpoints</h2>
		<p>
			Besides the base score, you’ll earn extra points at specific affix breakpoints: +4, +7, +10,
			and +12. These affixes introduce increased difficulty, and clearing these threshold levels
			rewards additional points. Specifically:
		</p>
		<ul class="mb-2 ml-6 mt-2 list-disc">
			<li><strong>+4 Breakpoint:</strong> 10 points (Tyrannical/Fortified)</li>
			<li><strong>+7 Breakpoint:</strong> 15 points (Peril)</li>
			<li><strong>+10 Breakpoint:</strong> 10 points (Tyrannical/Fortified)</li>
			<li><strong>+12 Breakpoint:</strong> 15 points (Guile)</li>
		</ul>

		<p>For quick reference:</p>
		<ul class="ml-6 list-disc space-y-1">
			<li><strong>+2 Key:</strong> 165 points</li>
			<li><strong>+3 Key:</strong> 180 points</li>
			<li><strong>+4 Key:</strong> 205 points</li>
			<li><strong>+5 Key:</strong> 220 points</li>
			<li><strong>+6 Key:</strong> 235 points</li>
			<li><strong>+7 Key:</strong> 265 points</li>
			<li><strong>+8 Key:</strong> 280 points</li>
			<li><strong>+9 Key:</strong> 295 points</li>
			<li><strong>+10 Key:</strong> 320 points</li>
			<li><strong>+11 Key:</strong> 335 points</li>
			<li><strong>+12 Key:</strong> 365 points</li>
		</ul>

		<h2 class="mb-4 mt-4 text-xl font-bold">Time Bonus (Linear Scaling from 0–40%)</h2>
		<p>
			Completing a Mythic+ dungeon quickly not only awards you an even higher keystone but also
			grants extra score. The time bonus scales linearly from 0% to 40% faster than the par time,
			awarding up to an additional 15 points.
		</p>
		<ul class="mb-2 ml-6 mt-2 list-disc">
			<li><strong>0% faster (just on time):</strong> 0 bonus points</li>
			<li><strong>20% faster (2 Chesting):</strong> 7.5 bonus points</li>
			<li><strong>40% faster (3 Chesting):</strong> 15 bonus points</li>
		</ul>

		<p>
			Which means a 3 Chested key awards the same score as the next one up on par time if theres no
			new affix
		</p>

		<h2 class="mb-4 mt-4 text-xl font-bold">Using MrMythical.com Tools to Boost Your Score</h2>
		<h3 class="mb-4 text-lg font-bold">In-Game Tooltip Addon</h3>
		<p>
			To help you keep track of these bonuses and breakpoints without switching back and forth
			between spreadsheets, we’ve developed a convenient <Button
				class="h-5 p-0 text-base font-bold"
				variant="link"
				target="_blank"
				><a href="https://www.curseforge.com/wow/addons/mr-mythical">Tooltip Addon</a></Button
			>. When you hover over your keystone in the game, you’ll see:
		</p>
		<ul class="mb-2 ml-6 mt-2 list-disc">
			<li>Predicted scores gain for completing the key.</li>
			<li>
				Potential reward item level, upgrade track and crests for end of dungeon and great vault.
			</li>
		</ul>
		<p>Having all this info on the fly makes it much easier to decide which keystones to run.</p>

		<h3 class="mb-4 mt-4 text-lg font-bold">Web Based Mythic+ Score Calculator</h3>
		<p>
			Our <Button class="h-5 p-0 text-base font-bold" variant="link" target="_blank"
				><a href="/rating-calculator">Mythic+ Score Calculator</a></Button
			> is perfect for out-of-game planning. It allows you to:
		</p>
		<ul class="mb-2 ml-6 mt-2 list-disc">
			<li>Calculate which dungeon levels you need to achieve your desired Mythic+ score.</li>
			<li>Import your characters directly into the planner.</li>
			<li>Edit your imported characters to find your next key.</li>
			<li>Share your combinations with friends or guildmates to coordinate runs.</li>
		</ul>
		<p>
			With this tool, you can see exactly which keystones to focus on, plan out your affix
			breakpoints, and ensure you’re hitting the time bonuses for maximum score gains.
		</p>

		<h2 class="mb-4 mt-4 text-xl font-bold">Tips for Maximizing Your Mythic+ Score</h2>
		<ol class="ml-6 list-decimal">
			<li>
				<strong>Hit Affix Breakpoints:</strong> Make sure to clear dungeons at +4, +7, +10, and +12.
				These yield bonus points that can tip your overall score well above your competition.
			</li>
			<li>
				<strong>Focus on Timer Efficiency:</strong> Remember, the time bonus is linear from 0%–40% faster.
				If your team can handle it, pushing for 2 Chests or 3 Chests will net you a significant chunk
				of additional points.
			</li>
			<li>
				<strong>Leverage the Tools:</strong> Use the Tooltip Addon to get real-time predictions and rely
				on the Web-Based Score Calculator for strategic planning.
			</li>
		</ol>

		<h2 class="mb-4 mt-4 text-xl font-bold">Conclusion</h2>
		<p>
			The Mythic+ score system rewards both consistency (higher key levels, covering all dungeons)
			and speed (finishing faster nets you more points). With affix breakpoints, linear time
			bonuses, and base score increments, there’s a lot to juggle, but that’s exactly why we created
			our Tooltip Addon and Score Calculator.
		</p>
		<p class=" mt-2">
			By knowing how each factor works, you can make smarter decisions on which keys to run and how
			aggressively to push for those speedy finishes. Here’s to climbing the leaderboards and
			showing off your Mythic+ prowess. good luck, and we’ll see you in the dungeons!
		</p>
	</article>
</main>

<Footer />
