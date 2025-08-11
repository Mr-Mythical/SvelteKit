<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
</script>

<div class="container mx-auto flex flex-col gap-10 p-4 md:px-8 xl:px-40 2xl:px-72">
	<article class="w-full" aria-labelledby="mythic-score-explanation">
		<header>
			<h2 id="score-explanation" class="mb-2 scroll-mt-24 text-2xl font-extrabold leading-tight">
				How the Mythic+ Score System Works in World of Warcraft
			</h2>
			<p class="mb-4 text-sm italic text-muted-foreground">Updated for The War Within, Season 2</p>
		</header>

		<section class="mb-8" aria-labelledby="why-mplus-score-matters">
			<h3 id="why-mplus-score-matters" class="mb-2 text-lg font-bold">
				Why Your Mythic+ Score Matters
			</h3>
			<p>
				If you’ve been running Mythic+ dungeons in World of Warcraft, you already know how crucial
				your Mythic+ score can be. Not only does it reflect your progress and skill, but it also
				affects how quickly you can find groups and push higher keys. In this guide, we’ll break
				down exactly how your Mythic+ score is calculated and how you can maximize it.
			</p>
		</section>

		<section class="mb-8" aria-labelledby="keystone-base-score">
			<h3 id="keystone-base-score" class="mb-2 text-lg font-bold">
				Keystone Levels &amp; Base Score Calculation
			</h3>
			<ul class="mb-4 ml-6 list-disc space-y-1">
				<li>Keystones start at <b>+2</b> and scale infinitely.</li>
				<li>The base score for a <b>+2</b> keystone is <b>155 points</b>.</li>
				<li>Each additional key level adds <b>15 points</b> to the base score.</li>
			</ul>
		</section>

		<section class="mb-8" aria-labelledby="affix-breakpoints">
			<h3 id="affix-breakpoints" class="mb-2 text-lg font-bold">
				Affix Breakpoints &amp; Bonus Points
			</h3>
			<p>
				Besides the base score, clearing certain key levels with new affixes will earn you <strong
					>bonus points</strong
				>:
				<b>+4, +7, +10, and +12</b> each award an extra <b>15 points</b> for increased difficulty.
				And should therefore be your priority when pushing keys early in the season. <br /> <br />
				Below is a quick reference for the base score and bonus affix points at each key level:
			</p>
			<Table.Root class="mb-6">
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-1/2">Key Level</Table.Head>
						<Table.Head class="w-1/2">Total Score</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					<Table.Row>
						<Table.Cell>+2</Table.Cell>
						<Table.Cell>155</Table.Cell>
					</Table.Row>
					<Table.Row>
						<Table.Cell>+3</Table.Cell>
						<Table.Cell>170</Table.Cell>
					</Table.Row>
					<Table.Row class="bg-muted/50">
						<Table.Cell>+4</Table.Cell>
						<Table.Cell>200</Table.Cell>
					</Table.Row>
					<Table.Row>
						<Table.Cell>+5</Table.Cell>
						<Table.Cell>215</Table.Cell>
					</Table.Row>
					<Table.Row>
						<Table.Cell>+6</Table.Cell>
						<Table.Cell>230</Table.Cell>
					</Table.Row>
					<Table.Row class="bg-muted/50">
						<Table.Cell>+7</Table.Cell>
						<Table.Cell>260</Table.Cell>
					</Table.Row>
					<Table.Row>
						<Table.Cell>+8</Table.Cell>
						<Table.Cell>275</Table.Cell>
					</Table.Row>
					<Table.Row>
						<Table.Cell>+9</Table.Cell>
						<Table.Cell>290</Table.Cell>
					</Table.Row>
					<Table.Row class="bg-muted/50">
						<Table.Cell>+10</Table.Cell>
						<Table.Cell>320</Table.Cell>
					</Table.Row>
					<Table.Row>
						<Table.Cell>+11</Table.Cell>
						<Table.Cell>335</Table.Cell>
					</Table.Row>
					<Table.Row class="bg-muted/50">
						<Table.Cell>+12</Table.Cell>
						<Table.Cell>365</Table.Cell>
					</Table.Row>
				</Table.Body>
			</Table.Root>
		</section>

		<section class="mb-8" aria-labelledby="time-bonus">
			<h3 id="time-bonus" class="mb-2 text-lg font-bold">Time Bonus (Linear Scaling from 0–40%)</h3>
			<p class="mb-4">
				Completing a Mythic+ dungeon quickly not only awards you an even higher keystone but also
				grants extra score. The time bonus scales linearly from 0% to 40% faster than the par time,
				awarding up to an additional 15 points.
			</p>
			<Table.Root class="mb-6">
				<Table.Header>
					<Table.Row>
						<Table.Head class="w-1/2">Completion Speed</Table.Head>
						<Table.Head class="w-1/2">Bonus Points</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					<Table.Row>
						<Table.Cell>0% faster (just on time)</Table.Cell>
						<Table.Cell>0</Table.Cell>
					</Table.Row>
					<Table.Row>
						<Table.Cell>20% faster (2 Chesting)</Table.Cell>
						<Table.Cell>7.5</Table.Cell>
					</Table.Row>
					<Table.Row>
						<Table.Cell>40% faster (3 Chesting)</Table.Cell>
						<Table.Cell>15</Table.Cell>
					</Table.Row>
				</Table.Body>
			</Table.Root>
			<p class="mb-6 italic">
				Which means a 3 Chested key awards the same score as the next one up on par time if theres
				no new affix
			</p>
		</section>

		<section class="mb-8" aria-labelledby="tools-to-boost-score">
			<h3 id="tools-to-boost-score" class="mb-2 text-lg font-bold">
				Using MrMythical.com Tools to Boost Your Score
			</h3>

			<h4 class="text-md mb-2 font-semibold">In-Game Tooltip Addon</h4>
			<p>
				<Button
					class="p-0 text-[1.03rem] font-bold text-link"
					variant="link"
					href="https://www.curseforge.com/wow/addons/mr-mythical"
					target="_blank"
				>
					Download on CurseForge
				</Button>
				Or
				<Button
					class="p-0 text-[1.03rem] font-bold text-link"
					variant="link"
					href="https://addons.wago.io/addons/mr-mythical"
					target="_blank"
				>
					Download on Wago Addons
				</Button>
			</p>
			<p class="mb-4">
				The Mr. Mythical addon gives you enhanced and customizable Mythic+ keystone tooltips with
				instant, detailed information. See dungeon rewards, crest earnings, and your potential score
				directly in tooltips and chat.
			</p>

			<ul class="mb-6 ml-6 list-disc space-y-1">
				<li>Predicted score gains for completing keys</li>
				<li>Potential reward item levels and crests</li>
				<li>Tooltip and chat integration for fast group planning</li>
				<li>Highly customizable display options</li>
			</ul>

			<h4 class="text-md mb-2 font-semibold">Web-Based Mythic+ Score Calculator</h4>
			<p class="mb-4">
				Or using the calculator on this page, you can plan your key pushing strategy with real-time
				calculations. Just enter your desired score and necessary dungeon levels will be calculated
				instantly, allowing you to optimize your keystone runs and share plans with your team. Or
				import your own characters and edit them to see how higher keystones affect your score.
			</p>
		</section>

		<section aria-labelledby="tips-for-maximizing-score">
			<h3 id="tips-for-maximizing-score" class="mb-2 text-lg font-bold">
				Tips for Maximizing Your Mythic+ Score
			</h3>
			<Table.Root class="mb-6">
				<Table.Body>
					<Table.Row>
						<Table.Cell class="w-1/3 font-semibold">1. Hit Affix Breakpoints</Table.Cell>
						<Table.Cell>Prioritize clearing dungeons at +4, +7, +10, and +12</Table.Cell>
					</Table.Row>
					<Table.Row>
						<Table.Cell class="w-1/3 font-semibold">2. Focus on Timer Efficiency</Table.Cell>
						<Table.Cell>Push for 2-3 chest runs to maximize bonus points</Table.Cell>
					</Table.Row>
					<Table.Row>
						<Table.Cell class="w-1/3 font-semibold">3. Leverage Tools</Table.Cell>
						<Table.Cell>Use our addon and calculator for real-time insights</Table.Cell>
					</Table.Row>
				</Table.Body>
			</Table.Root>
			<p class="mb-6">
				The Mythic+ score system rewards both consistency and speed. With affix breakpoints and
				linear time bonuses, strategic planning is key - which is exactly why i created these tools
				to help you climb the leaderboards.
			</p>
		</section>
	</article>
</div>
