<script lang="ts">
	import AverageChart from '../../../../components/charts/averageChart.svelte';
	import DeathHotspots from '../../../../components/charts/deathHotspots.svelte';
	import SEO from '../../../../components/seo.svelte';
	import Footer from '../../../../components/layout/footer.svelte';
	import { bosses } from '$lib/types/bossData';
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let currentBoss = $derived(bosses.find((b) => b.id === data.bossId));

	function selectBoss(bossSlug: string) {
		goto(`/raid/boss/${bossSlug}`);
	}

	function hideImgOnError(e: Event) {
		const target = e.currentTarget as EventTarget & Element;
		(target as HTMLImageElement).style.display = 'none';
	}

	let hasResources = $derived.by(() => {
		const r = currentBoss?.resources;
		return !!(r && (r.method || r.wowhead || r.icyVeins));
	});
</script>

<SEO
	title={`Mythic ${currentBoss?.name} damage and death profile - Mr. Mythical`}
	description={`Mythic ${currentBoss?.name} per-second damage curve and death timing aggregated from public progression logs, with sourced encounter notes and key abilities.`}
	image="https://mrmythical.com/Logo.png"
	keywords={`Mythic ${currentBoss?.name}, ${currentBoss?.slug}, Midnight raid, raid boss visualization, damage patterns, death timings, World of Warcraft, encounter charts`}
/>

<main class="container mx-auto px-4 py-8">
	<header class="page-header">
		<p class="page-eyebrow">Boss profile</p>
		<h1 class="page-title">Mythic {currentBoss?.name || 'Boss'}.</h1>
		{#if currentBoss?.teaser}
			<p class="page-lede">{currentBoss.teaser}</p>
		{/if}
	</header>

	<nav class="boss-switcher" aria-label="Switch raid boss">
		{#each bosses as boss (boss.id)}
			<button
				type="button"
				class="pill"
				class:pill-active={boss.id === currentBoss?.id}
				onclick={() => selectBoss(boss.slug)}
			>
				{boss.name}
			</button>
		{/each}
	</nav>

	<section class="chart-section" aria-label="Damage and death profile chart">
		{#if currentBoss}
			<AverageChart
				encounterId={currentBoss.id}
				encounterName={`Mythic ${currentBoss.name}`}
			/>
		{/if}
	</section>

	<section class="hotspots-section" aria-label="Death hotspots">
		{#if currentBoss}
			<DeathHotspots bossId={currentBoss.id} />
		{/if}
	</section>

	<div class="reading-row">
		<section class="reading-col" aria-label="Encounter context">
			<h2 class="col-title">Encounter context</h2>

			{#if currentBoss?.guide?.intro}
				<div class="block">
					<h3 class="block-title">About this encounter</h3>
					<p class="block-body">{currentBoss.guide.intro}</p>
				</div>
			{/if}

			{#if currentBoss?.guide?.kills}
				<div class="block">
					<h3 class="block-title">What kills pulls</h3>
					<p class="block-body">{currentBoss.guide.kills}</p>
				</div>
			{/if}

			{#if hasResources && currentBoss?.resources}
				<div class="block">
					<h3 class="block-title">Recommended reading</h3>
					<ul class="resource-list">
						{#if currentBoss.resources.method}
							<li>
								<a
									href={currentBoss.resources.method}
									target="_blank"
									rel="noopener noreferrer"
									class="resource-link"
								>
									Method guide
								</a>
							</li>
						{/if}
						{#if currentBoss.resources.wowhead}
							<li>
								<a
									href={currentBoss.resources.wowhead}
									target="_blank"
									rel="noopener noreferrer"
									class="resource-link"
								>
									Wowhead strategy
								</a>
							</li>
						{/if}
						{#if currentBoss.resources.icyVeins}
							<li>
								<a
									href={currentBoss.resources.icyVeins}
									target="_blank"
									rel="noopener noreferrer"
									class="resource-link"
								>
									Icy Veins guide
								</a>
							</li>
						{/if}
					</ul>
				</div>
			{/if}

			{#if currentBoss?.abilities && currentBoss.abilities.length > 0}
				<div class="block">
					<h3 class="block-title">Key abilities</h3>
					<ul class="ability-list">
						{#each currentBoss.abilities as ability (ability.id)}
							<li class="ability-item">
								<img
									src={`${base}/icons/${ability.id}.webp`}
									alt=""
									width="22"
									height="22"
									class="ability-icon"
									loading="lazy"
									onerror={hideImgOnError}
								/>
								<a
									href={`https://www.wowhead.com/spell=${ability.id}`}
									target="_blank"
									rel="noopener noreferrer"
									class="ability-link"
								>
									{ability.name}
								</a>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</section>

		<section class="reading-col" aria-label="How to read the chart">
			<h2 class="col-title">How to read this chart</h2>

			<div class="block">
				<h3 class="block-title">Average damage taken</h3>
				<p class="block-body">
					The primary line shows the average damage taken across all logged pulls at each
					second of the fight. Use it as a baseline to find the consistent spike windows.
				</p>
			</div>

			<div class="block">
				<h3 class="block-title">Standard deviation band</h3>
				<p class="block-body">
					The wider band covers one standard deviation either side of the average. About
					68% of pulls fall inside it. A wide band points to mechanics with variable
					outcomes: avoidable damage some players miss, random targeting, or differences
					in mitigation.
				</p>
			</div>

			<div class="block">
				<h3 class="block-title">95% confidence interval</h3>
				<p class="block-body">
					The narrower band is our confidence in the average estimate. A tight band means
					a lot of consistent logs at that second. A wider band points to thinner data or
					inconsistent execution.
				</p>
			</div>

			<div class="block">
				<h3 class="block-title">Deaths per pull</h3>
				<p class="block-body">
					The death bars on the right axis show the average number of player deaths
					logged at each second. They usually trail the damage spike by a few seconds,
					since deaths follow whatever just hit the raid.
				</p>
			</div>

			<div class="block">
				<h3 class="block-title">Hotspot windows</h3>
				<p class="block-body">
					The table under the chart picks the top death seconds and groups them into
					windows. Useful for matching cooldowns to the moments where pulls actually fall
					apart.
				</p>
			</div>

			<div class="block">
				<h3 class="block-title">Source and selection</h3>
				<p class="block-body">
					Data is aggregated from public progression logs (first successful kills) and is
					anonymized before display.
				</p>
			</div>
		</section>
	</div>
</main>
<Footer />

<style>
	.page-header {
		display: flex;
		flex-direction: column;
		gap: 6px;
		max-width: 72ch;
		padding-bottom: clamp(20px, 3vw, 32px);
	}

	.page-eyebrow {
		font-family: var(--font-body);
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: hsl(var(--link));
		margin: 0;
	}

	.page-title {
		font-family: var(--font-heading);
		font-size: clamp(1.75rem, 4vw, 2.5rem);
		font-weight: 700;
		line-height: 1.08;
		letter-spacing: -0.02em;
		color: hsl(var(--foreground));
		margin: 0;
	}

	.page-lede {
		font-family: var(--font-body);
		font-size: 0.9375rem;
		line-height: 1.45;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	.boss-switcher {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		padding: clamp(12px, 2vw, 16px) 0 clamp(20px, 3vw, 28px);
	}

	.pill {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: 500;
		padding: 6px 14px;
		border-radius: 9999px;
		border: 1px solid hsl(var(--border));
		background: transparent;
		color: hsl(var(--muted-foreground));
		cursor: pointer;
		transition:
			color 0.15s,
			border-color 0.15s,
			background-color 0.15s;
	}

	.pill:hover {
		color: hsl(var(--foreground));
		border-color: hsl(var(--foreground) / 0.4);
	}

	.pill:focus-visible {
		outline: 2px solid hsl(var(--link));
		outline-offset: 2px;
	}

	.pill-active {
		background: hsl(var(--primary));
		border-color: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
	}
	.pill-active:hover {
		color: hsl(var(--primary-foreground));
		border-color: hsl(var(--primary));
	}

	.chart-section {
		padding: 0;
	}

	.hotspots-section {
		margin-top: clamp(20px, 3vw, 32px);
	}

	.reading-row {
		margin-top: clamp(28px, 4vw, 44px);
		display: grid;
		grid-template-columns: 1fr;
		gap: clamp(24px, 4vw, 40px);
	}

	@media (min-width: 900px) {
		.reading-row {
			grid-template-columns: 1fr 1fr;
		}
	}

	.reading-col {
		display: flex;
		flex-direction: column;
		gap: clamp(16px, 2vw, 22px);
	}

	.col-title {
		font-family: var(--font-heading);
		font-size: 1.25rem;
		font-weight: 600;
		line-height: 1.2;
		margin: 0;
		color: hsl(var(--foreground));
	}

	.block {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.block-title {
		font-family: var(--font-heading);
		font-size: 1rem;
		font-weight: 600;
		margin: 0;
		color: hsl(var(--foreground));
	}

	.block-body {
		font-family: var(--font-body);
		font-size: 0.9375rem;
		line-height: 1.55;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	.resource-list,
	.ability-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.resource-link {
		font-family: var(--font-body);
		font-size: 0.9375rem;
		color: hsl(var(--link));
		text-decoration: none;
	}
	.resource-link:hover {
		text-decoration: underline;
	}

	.ability-item {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.ability-icon {
		flex-shrink: 0;
		object-fit: contain;
		border-radius: 3px;
	}

	.ability-link {
		font-family: var(--font-body);
		font-size: 0.9375rem;
		color: hsl(var(--link));
		text-decoration: none;
	}
	.ability-link:hover {
		text-decoration: underline;
	}
</style>
