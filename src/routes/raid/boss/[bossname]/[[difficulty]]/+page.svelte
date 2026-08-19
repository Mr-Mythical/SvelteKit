<script lang="ts">
	import { tick } from 'svelte';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import AverageChart from '../../../../../components/charts/averageChart.svelte';
	import DeathHotspots from '../../../../../components/charts/deathHotspots.svelte';
	import GuideText from '../../../../../components/raid/guideText.svelte';
	import SEO from '../../../../../components/seo.svelte';
	import Footer from '../../../../../components/layout/footer.svelte';
	import { refreshWowheadLinks } from '$lib/gearing/wowhead';
	import { plainGuideText, wowheadSpellDataAttr, wowheadSpellHref } from '$lib/guideText';
	import { bossSeoDescription, bossSeoTitle } from '$lib/data/seoCopy';
	import { faqPageJsonLd, howToJsonLd } from '$lib/seo';
	import {
		bossGuidePath,
		bossesForRaid,
		hasSplitGuides,
		RAIDS,
		resolveBossGuide,
		type Boss,
		type GuideDifficulty
	} from '$lib/types/bossData';
	import { configureWowheadTooltips } from '$lib/ui/wowheadTooltips';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let currentBoss = $derived(data.boss as Boss);
	let difficulty = $derived(data.difficulty as GuideDifficulty);
	let currentGuide = $derived(resolveBossGuide(currentBoss, difficulty));
	let difficultyLabel = $derived(difficulty === 'heroic' ? 'Heroic' : 'Mythic');
	let raidBosses = $derived(bossesForRaid(currentBoss.raidId));
	let raid = $derived(RAIDS[currentBoss.raidId]);
	let splitGuides = $derived(hasSplitGuides(currentBoss));
	let isEncounterGuide = $derived(
		Boolean(currentGuide.overview?.length || currentGuide.phases?.length)
	);
	let pageTeaser = $derived(currentGuide.teaser ?? currentBoss.teaser);
	let hasResources = $derived.by(() => {
		const r = currentBoss.resources;
		return !!(r?.method || r?.wowhead || r?.icyVeins);
	});
	let seoSchemas = $derived.by(() => {
		const blocks: Record<string, unknown>[] = [];
		const faqs = faqPageJsonLd(
			(currentGuide.faqs ?? []).map((faq) => ({
				question: faq.question,
				answer: plainGuideText(faq.answer)
			}))
		);
		if (faqs) blocks.push(faqs);
		const phases = currentGuide.phases;
		if (phases?.length) {
			const howTo = howToJsonLd(
				`${difficultyLabel} ${currentBoss.name} encounter guide`,
				phases.map((phase) => ({
					name: phase.title,
					text: phase.body.map(plainGuideText).join(' ')
				}))
			);
			if (howTo) blocks.push(howTo);
		} else if (currentGuide.quick) {
			const quick = currentGuide.quick;
			const howTo = howToJsonLd(`${difficultyLabel} ${currentBoss.name} quick guide`, [
				{ name: 'Tanks', text: plainGuideText(quick.tanks) },
				{ name: 'Healers', text: plainGuideText(quick.healers) },
				{ name: 'Damage dealers', text: plainGuideText(quick.dps) }
			]);
			if (howTo) blocks.push(howTo);
		}
		return blocks;
	});

	let wowheadAttach = $derived.by(() => {
		const bossId = currentBoss.id;
		const pageDifficulty = difficulty;
		return (_node: HTMLElement) => {
			void bossId;
			void pageDifficulty;
			configureWowheadTooltips({
				colorLinks: true,
				iconizeLinks: true,
				renameLinks: false
			});
			const timeout = window.setTimeout(() => {
				void tick().then(() =>
					refreshWowheadLinks({
						colorLinks: true,
						iconizeLinks: true,
						renameLinks: false
					})
				);
			}, 50);
			return () => window.clearTimeout(timeout);
		};
	});
</script>

<SEO
	title={bossSeoTitle(currentBoss.name, difficulty)}
	description={bossSeoDescription(currentBoss.name, pageTeaser, difficulty)}
	keywords={`${difficultyLabel} ${currentBoss.name}, ${currentBoss.slug}, ${raid.name}, Midnight Season ${raid.season}, raid guide, World of Warcraft`}
	schemas={seoSchemas}
/>

<main class="container mx-auto px-4 py-8" {@attach wowheadAttach}>
	<header class="page-header">
		<p class="page-eyebrow">{raid.name} · Midnight Season {raid.season}</p>
		<h1 class="page-title">{difficultyLabel} {currentBoss.name}.</h1>
		{#if isEncounterGuide && currentGuide.intro}
			<GuideText class="page-lede" text={currentGuide.intro} />
		{:else if pageTeaser}
			<p class="page-lede">{pageTeaser}</p>
		{/if}
	</header>

	<nav class="boss-switcher" aria-label="Switch raid boss">
		{#each raidBosses as boss (boss.id)}
			{@const href = bossGuidePath(boss.slug, hasSplitGuides(boss) ? difficulty : 'heroic')}
			<a
				{href}
				class={['pill', boss.id === currentBoss.id && 'pill-active']}
				aria-current={boss.id === currentBoss.id ? 'page' : undefined}
			>
				{boss.name}
			</a>
		{/each}
	</nav>

	<div class="guide-toolbar">
		{#if splitGuides}
			<nav class="diff-switcher" aria-label="Guide difficulty">
				<a
					href={bossGuidePath(currentBoss.slug, 'heroic')}
					class={['pill', difficulty === 'heroic' && 'pill-active']}
					aria-current={difficulty === 'heroic' ? 'page' : undefined}
				>
					Heroic
				</a>
				<a
					href={bossGuidePath(currentBoss.slug, 'mythic')}
					class={['pill', difficulty === 'mythic' && 'pill-active']}
					aria-current={difficulty === 'mythic' ? 'page' : undefined}
				>
					Mythic
				</a>
			</nav>
		{/if}
		<a class="guide-jump" href="#guide">
			Read the guide
			<ChevronDown size={16} aria-hidden="true" />
		</a>
	</div>

	{@render logData()}

	{#if isEncounterGuide}
		<article id="guide" class="encounter-guide" aria-label="Encounter guide">
			{#if currentGuide.changes?.length}
				<aside class="changes-card" aria-labelledby="changes-title">
					<h2 id="changes-title" class="block-title">What changed</h2>
					<ul class="changes-list">
						{#each currentGuide.changes ?? [] as change (change)}
							<li><GuideText text={change} /></li>
						{/each}
					</ul>
				</aside>
			{/if}

			{#if currentGuide.overview?.length}
				<section class="guide-section" aria-labelledby="overview-title">
					<h2 id="overview-title" class="col-title">Overview</h2>
					{#each currentGuide.overview as paragraph, index (`overview-${index}`)}
						<GuideText text={paragraph} />
					{/each}
				</section>
			{/if}

			{#if currentGuide.phases}
				{#each currentGuide.phases as phase, index (`phase-${index}`)}
					<section class="guide-section phase" aria-labelledby={`phase-${index}-title`}>
						<h2 id={`phase-${index}-title`} class="col-title">{phase.title}</h2>
						{#each phase.body as paragraph, pIndex (`phase-${index}-${pIndex}`)}
							<GuideText text={paragraph} />
						{/each}
					</section>
				{/each}
			{/if}

			{#if currentGuide.quick}
				<section class="quick-guide" aria-labelledby="role-plan-title">
					<h2 id="role-plan-title" class="col-title">By role</h2>
					<div class="quick-grid">
						<article class="quick-card">
							<h3 class="block-title">Tanks</h3>
							<GuideText text={currentGuide.quick.tanks} />
						</article>
						<article class="quick-card">
							<h3 class="block-title">Healers</h3>
							<GuideText text={currentGuide.quick.healers} />
						</article>
						<article class="quick-card">
							<h3 class="block-title">DPS</h3>
							<GuideText text={currentGuide.quick.dps} />
						</article>
					</div>
				</section>
			{/if}

			{#if currentGuide.kills}
				<section class="guide-section" aria-labelledby="wipes-title">
					<h2 id="wipes-title" class="col-title">Why pulls die</h2>
					<GuideText text={currentGuide.kills} />
				</section>
			{/if}

			{#if currentGuide.faqs?.length}
				<section class="guide-section" aria-labelledby="faq-title">
					<h2 id="faq-title" class="col-title">Questions</h2>
					{#each currentGuide.faqs ?? [] as faq, index (`faq-${index}`)}
						<article class="faq-item">
							<h3 class="block-title">{faq.question}</h3>
							<GuideText text={faq.answer} />
						</article>
					{/each}
				</section>
			{/if}
		</article>
	{:else}
		<div id="guide" class="season-guide">
			{#if currentGuide.quick}
				<section class="quick-guide" aria-labelledby="quick-guide-title">
					<h2 id="quick-guide-title" class="col-title">Quick guide</h2>
					<div class="quick-grid">
						<article class="quick-card">
							<h3 class="block-title">Tanks</h3>
							<GuideText text={currentGuide.quick.tanks} />
						</article>
						<article class="quick-card">
							<h3 class="block-title">Healers</h3>
							<GuideText text={currentGuide.quick.healers} />
						</article>
						<article class="quick-card">
							<h3 class="block-title">DPS</h3>
							<GuideText text={currentGuide.quick.dps} />
						</article>
					</div>
				</section>
			{/if}

			<div class="reading-row">
				<section class="reading-col" aria-label="Encounter context">
					<h2 class="col-title">Encounter context</h2>

					{#if currentGuide.intro}
						<div class="block">
							<h3 class="block-title">About this encounter</h3>
							<GuideText text={currentGuide.intro} />
						</div>
					{/if}

					{#if currentGuide.kills}
						<div class="block">
							<h3 class="block-title">What kills pulls</h3>
							<GuideText text={currentGuide.kills} />
						</div>
					{/if}

					{#if currentBoss.abilities.length > 0}
						<div class="block">
							<h3 class="block-title">Key abilities</h3>
							<ul class="ability-list">
								{#each currentBoss.abilities as ability (ability.id)}
									<li class="ability-item">
										<a
											class="ability-link"
											href={wowheadSpellHref(ability.id)}
											data-wowhead={wowheadSpellDataAttr(ability.id)}
											target="_blank"
											rel="noopener noreferrer">{ability.name}</a
										>
									</li>
								{/each}
							</ul>
						</div>
					{/if}

					{#if hasResources}
						{@render resources()}
					{/if}
				</section>

				<section class="reading-col" aria-label="How to read the chart">
					<h2 class="col-title">How to read this chart</h2>

					<div class="block">
						<h3 class="block-title">Average damage taken</h3>
						<p class="block-body">
							The primary line shows the average damage taken across all logged pulls at each second
							of the fight. Use it as a baseline to find the consistent spike windows.
						</p>
					</div>

					<div class="block">
						<h3 class="block-title">Standard deviation band</h3>
						<p class="block-body">
							The wider band covers one standard deviation either side of the average. About 68% of
							pulls fall inside it. A wide band points to mechanics with variable outcomes:
							avoidable damage some players miss, random targeting, or differences in mitigation.
						</p>
					</div>

					<div class="block">
						<h3 class="block-title">95% confidence interval</h3>
						<p class="block-body">
							The narrower band is our confidence in the average estimate. A tight band means a lot
							of logs at that second. A wider band points to thinner data or inconsistent execution.
						</p>
					</div>

					<div class="block">
						<h3 class="block-title">Deaths per pull</h3>
						<p class="block-body">
							The death bars on the right axis show the average number of player deaths logged at
							each second. They usually trail the damage spike by a few seconds, since deaths follow
							whatever just hit the raid.
						</p>
					</div>

					<div class="block">
						<h3 class="block-title">Hotspot windows</h3>
						<p class="block-body">
							The table under the chart picks the top death seconds and groups them into windows.
							Useful for matching cooldowns to the moments where pulls actually fall apart.
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
		</div>
	{/if}
</main>
<Footer />

{#snippet resources()}
	<div class="block">
		<h3 class="block-title">Full strategy guides</h3>
		<ul class="resource-list">
			{#if currentBoss.resources?.wowhead}
				<li>
					<a
						class="resource-link"
						href={currentBoss.resources?.wowhead}
						target="_blank"
						rel="noopener noreferrer">Wowhead</a
					>
				</li>
			{/if}
			{#if currentBoss.resources?.icyVeins}
				<li>
					<a
						class="resource-link"
						href={currentBoss.resources?.icyVeins}
						target="_blank"
						rel="noopener noreferrer">Icy Veins</a
					>
				</li>
			{/if}
			{#if currentBoss.resources?.method}
				<li>
					<a
						class="resource-link"
						href={currentBoss.resources?.method}
						target="_blank"
						rel="noopener noreferrer">Method</a
					>
				</li>
			{/if}
		</ul>
	</div>
{/snippet}

{#snippet logData()}
	<section class="chart-section" aria-label="Damage and death profile chart">
		<AverageChart
			encounterId={currentBoss.id}
			encounterName={`${difficultyLabel} ${currentBoss.name}`}
			{difficulty}
		/>
	</section>

	<section class="hotspots-section" aria-label="Death hotspots">
		<DeathHotspots bossId={currentBoss.id} {difficulty} />
	</section>
{/snippet}

<style>
	.page-header {
		display: flex;
		flex-direction: column;
		gap: 6px;
		width: 100%;
		max-width: 72ch;
		margin-inline: auto;
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

	.page-header :global(.page-lede) {
		font-family: var(--font-body);
		font-size: 0.9375rem;
		line-height: 1.55;
		color: hsl(var(--muted-foreground));
		margin: 4px 0 0;
	}

	.diff-switcher,
	.boss-switcher {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.guide-toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px;
		margin: 0 0 clamp(16px, 2.4vw, 24px);
	}

	.diff-switcher {
		padding: 3px;
		border: 1px solid hsl(var(--border));
		border-radius: 9999px;
		background: hsl(var(--muted) / 0.35);
	}

	.boss-switcher {
		padding: clamp(12px, 2vw, 16px) 0 clamp(16px, 2.4vw, 22px);
		justify-content: center;
	}

	.guide-jump {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		margin-left: auto;
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: 600;
		padding: 7px 14px;
		border-radius: 9999px;
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
		text-decoration: none;
	}

	.guide-jump:hover {
		opacity: 0.92;
	}

	.guide-jump:focus-visible {
		outline: 2px solid hsl(var(--link));
		outline-offset: 2px;
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
		text-decoration: none;
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

	.diff-switcher .pill {
		border-color: transparent;
	}

	.diff-switcher .pill:hover {
		border-color: transparent;
	}

	.encounter-guide,
	.season-guide {
		scroll-margin-top: 72px;
	}

	.encounter-guide {
		display: flex;
		flex-direction: column;
		gap: clamp(22px, 3vw, 34px);
		width: 100%;
		max-width: 72ch;
		margin-inline: auto;
		margin-bottom: clamp(28px, 4vw, 44px);
	}

	.guide-section {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.phase {
		padding-left: 14px;
		border-left: 2px solid hsl(var(--border));
	}

	.faq-item {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding-top: 8px;
	}

	.quick-guide {
		margin-bottom: clamp(24px, 3.5vw, 36px);
		display: flex;
		flex-direction: column;
		gap: clamp(12px, 2vw, 18px);
	}

	.encounter-guide .quick-guide {
		margin-bottom: 0;
	}

	.quick-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 12px;
	}

	@media (min-width: 800px) {
		.quick-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.quick-card {
		border: 1px solid hsl(var(--border));
		border-radius: 10px;
		padding: 14px 16px;
		display: flex;
		flex-direction: column;
		gap: 6px;
		background: hsl(var(--muted) / 0.35);
	}

	.changes-card {
		border: 1px solid hsl(var(--border));
		border-left: 3px solid hsl(var(--link));
		border-radius: 10px;
		padding: 14px 16px 16px;
		display: flex;
		flex-direction: column;
		gap: 10px;
		background: hsl(var(--muted) / 0.35);
	}

	.changes-list {
		margin: 0;
		padding-left: 1.15rem;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.changes-list :global(.guide-text) {
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.chart-section {
		padding: 0;
	}

	.hotspots-section {
		margin-top: clamp(20px, 3vw, 32px);
		margin-bottom: clamp(28px, 4vw, 44px);
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
