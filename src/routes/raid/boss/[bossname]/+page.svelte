<script lang="ts">
	import AverageChart from '../../../../components/averageChart.svelte';
	import BossPreviewChart from '../../../../components/bossPreviewChart.svelte';
	import SEO from '../../../../components/seo.svelte';
	import Footer from '../../../../components/footer.svelte';
	import { bosses } from '$lib/types/bossData';
	import { Button } from '$lib/components/ui/button';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';

	export let data;

	$: currentBoss = bosses.find((b) => b.id === data.bossId);

	function goBack() {
		goto('/raid');
	}

	function selectBoss(bossSlug: string) {
		goto(`/raid/boss/${bossSlug}`);
	}

	function hideImgOnError(e: Event) {
		const target = e.currentTarget as EventTarget & Element;
		// Narrow to HTMLImageElement safely
		(target as HTMLImageElement).style.display = 'none';
	}
</script>

<SEO
	title={`${currentBoss?.name} Damage Visualization - Mr. Mythical`}
	description={`${currentBoss?.name} raid boss damage charts with averages, variance bands, confidence intervals, and key ability timings for cooldown planning.`}
	image="https://mrmythical.com/Logo.png"
	keywords={`${currentBoss?.name}, ${currentBoss?.slug}, raid boss visualization, damage patterns, World of Warcraft, WoW raid, encounter charts, standard deviation, confidence interval`}
/>

<main class="container mx-auto px-4 py-8">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="mb-2 text-4xl font-bold">{currentBoss?.name || 'Boss'} - Damage Visualization</h1>
			<p class="text-lg text-muted-foreground">
				Interactive damage patterns across different raid encounters
			</p>
		</div>
		<Button variant="outline" on:click={goBack}>Back</Button>
	</div>

	<!-- Boss Selection Grid -->
	<div class="mx-auto mb-8 rounded-lg border bg-card p-4">
		<h3 class="mb-3 text-center text-base font-semibold">Select a raid boss</h3>
		<div class="flex flex-wrap justify-center gap-2">
			{#each bosses as boss (boss.id)}
				<button
					on:click={() => selectBoss(boss.slug)}
					class="group relative flex-shrink-0 overflow-hidden rounded-lg border bg-card p-2 transition hover:shadow-lg {boss.id ===
					currentBoss?.id
						? 'border-primary ring-2 ring-primary'
						: 'hover:border-primary'} w-40"
				>
					<div
						class="absolute inset-0 -z-10 bg-gradient-to-br from-purple-500/5 to-transparent transition group-hover:from-purple-500/10"
					></div>
					<div
						class="mb-1 flex h-20 items-center justify-center overflow-hidden rounded-lg bg-muted/50 transition group-hover:bg-muted"
					>
						<BossPreviewChart bossId={boss.id} />
					</div>
					<h3
						class="line-clamp-2 text-center text-xs font-semibold text-foreground transition group-hover:text-primary"
					>
						{boss.name}
					</h3>
				</button>
			{/each}
		</div>
	</div>

	<!-- Chart row: full-width single column -->
	<div class="rounded-lg border bg-card p-4">
		{#if currentBoss}
			<AverageChart encounterId={currentBoss.id} encounterName={`${currentBoss.name} Mythic`} />
		{/if}
	</div>

	<div class="mt-8 w-full rounded-lg bg-card p-6 text-center shadow-md">
		<h3 class="mb-4 text-2xl font-semibold">Support on Patreon</h3>
		<p class="mb-6">
			Enjoying these tools? Support MrMythical.com on Patreon to help keep these free, open-source
			WoW utilities accurate and up-to-date. Your contribution enables new features and ongoing
			improvements for the Mythic+ and raid community.
		</p>
		<Button>
			<a
				href="https://www.patreon.com/MrMythical"
				target="_blank"
				rel="noopener noreferrer"
				class="px-6 py-3"
			>
				Support on Patreon
			</a>
		</Button>
	</div>

	<!-- Text below: two columns (left: details, right: understanding) -->
	<div class="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
		<!-- Left column: Boss details -->
		<div class="space-y-8">
			{#if currentBoss}
				<section class="rounded-lg border bg-card p-6">
					<h2 class="mb-3 text-2xl font-semibold text-foreground">About {currentBoss.name}</h2>
					<p class="mb-4 text-foreground">
						Explore detailed damage visualization for {currentBoss.name}. These charts highlight
						second-by-second trends, variability, and confidence around raid-wide damage intake,
						using aggregated progression logs to surface consistent patterns and spike moments. Use
						this view to align cooldown rotations, healer assignments, and mitigation windows.
					</p>

					{#if currentBoss.abilities && currentBoss.abilities.length > 0}
						<h3 class="mb-2 text-xl font-medium text-foreground">Key Abilities</h3>
						<div class="flex flex-col space-y-2">
							{#each currentBoss.abilities as ability}
								<div class="flex items-center space-x-2">
									<img
										src={`${base}/icons/${ability.id}.webp`}
										alt={ability.name + ' icon'}
										width="26"
										height="26"
										class="object-contain"
										loading="lazy"
										on:error={hideImgOnError}
									/>
									<a
										href={'https://www.wowhead.com/spell=' + ability.id}
										target="_blank"
										rel="noopener noreferrer"
										class="underline hover:text-blue-400"
									>
										{ability.name}
									</a>
								</div>
							{/each}
						</div>
					{/if}

					<p class="mt-4 text-foreground">
						For deeper analysis, compare spikes against boss timers and raid cooldowns, note outlier
						phases in the standard deviation band, and leverage the confidence interval to judge
						data reliability across publicly available first-kill logs.
					</p>
				</section>
			{/if}
		</div>

		<!-- Right column: Understanding the visualization -->
		<div>
			<section class="rounded-lg border bg-card p-6">
				<h3 class="mb-6 pb-2 text-xl font-semibold text-foreground">
					Understanding the visualization for {currentBoss?.name || 'this boss'}
				</h3>

				<div class="metric-group mb-6">
					<h3 class="mb-2 text-xl font-medium text-foreground">Average Damage (Blue Line)</h3>
					<p class="text-foreground">
						The blue line highlights the average damage taken by players at each second across all
						analyzed fights. This serves as a baseline to identify consistent damage patterns and
						critical moments during encounters.
					</p>
				</div>

				<div class="mb-6">
					<h3 class="mb-2 text-xl font-medium text-foreground">
						Standard Deviation Range (Blue Area)
					</h3>
					<p class="text-foreground">
						The light blue area shows the range within one standard deviation (±1), where 68% of
						actual damage values fall. A wider blue band often indicates:
					</p>
					<ul class="list-inside list-disc text-foreground">
						<li>Mechanics with variable outcomes (e.g., avoidable abilities some players miss)</li>
						<li>Random elements (e.g., bosses targeting random players)</li>
						<li>Differences in player skill or damage mitigation</li>
					</ul>
				</div>

				<div class="mb-6">
					<h3 class="mb-2 text-xl font-medium text-foreground">
						95% Confidence Interval (Red Area)
					</h3>
					<p class="text-foreground">
						The red shaded region reflects our confidence in the average estimate. A narrow band
						indicates:
					</p>
					<ul class="list-inside list-disc text-foreground">
						<li>Reliable data from many logs</li>
						<li>Consistent execution across encounters</li>
					</ul>
					<p class="text-foreground">Wider bands suggest variability or areas needing more data.</p>
				</div>

				<div class="mb-6">
					<h3 class="mb-2 text-xl font-medium text-foreground">Source & Selection</h3>
					<p class="list-inside list-disc text-foreground">
						Data comes from public progression logs (first successful kills).
					</p>
				</div>
			</section>
		</div>
	</div>
</main>
<Footer />

<style>
	:global(.list-item) {
		transition: background-color 0.2s ease;
	}
</style>
