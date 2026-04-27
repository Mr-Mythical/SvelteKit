<script lang="ts">
	import SEO from '../../../components/seo.svelte';
	import Footer from '../../../components/layout/footer.svelte';
	import BossPreviewChart from '../../../components/charts/bossPreviewChart.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
</script>

<SEO
	title="Boss damage and death profile - Mr. Mythical"
	description="Per-second damage and death timing for every Midnight Season 1 mythic raid boss, aggregated from public progression logs."
	image="https://mrmythical.com/Logo.png"
	keywords="Midnight raid, mythic raid, boss damage charts, raid death timings, Voidspire, Dreamrift, Quel'Danas"
/>

<main class="container mx-auto px-4 py-8">
	<header class="page-header">
		<p class="page-eyebrow">Raid encounters</p>
		<h1 class="page-title">Boss damage and death profile.</h1>
		<p class="page-lede">
			Per-second damage curves and death clusters for every Midnight Season 1 mythic raid
			boss. Aggregated from public progression logs to surface the moments that decide pulls.
		</p>
	</header>

	<ul class="boss-list">
		{#each data.bosses as boss (boss.id)}
			<li class="boss-row">
				<a class="boss-link" href={`/raid/boss/${boss.slug}`}>
					<div class="preview" aria-hidden="true">
						<BossPreviewChart bossId={boss.id} />
					</div>
					<div class="copy">
						<h2 class="boss-name">{boss.name}</h2>
						<p class="boss-teaser">{boss.teaser}</p>
					</div>
					<span class="open-cta" aria-hidden="true">Open profile →</span>
				</a>
			</li>
		{/each}
	</ul>
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

	.boss-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
	}

	.boss-row {
		border-top: 1px solid hsl(var(--border));
	}
	.boss-row:last-child {
		border-bottom: 1px solid hsl(var(--border));
	}

	.boss-link {
		display: grid;
		grid-template-columns: 120px 1fr auto;
		align-items: center;
		gap: clamp(16px, 3vw, 28px);
		padding: clamp(14px, 2.4vw, 22px) 4px;
		text-decoration: none;
		color: inherit;
		transition: background-color 0.15s ease;
	}

	.boss-link:hover {
		background-color: hsl(var(--muted) / 0.5);
	}

	.boss-link:focus-visible {
		outline: 2px solid hsl(var(--link));
		outline-offset: 2px;
		border-radius: 4px;
	}

	.preview {
		height: 60px;
		width: 120px;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.85;
	}

	.copy {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}

	.boss-name {
		font-family: var(--font-heading);
		font-size: 1.125rem;
		font-weight: 600;
		line-height: 1.2;
		margin: 0;
		color: hsl(var(--foreground));
	}

	.boss-teaser {
		font-family: var(--font-body);
		font-size: 0.875rem;
		line-height: 1.45;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	.open-cta {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--link));
		white-space: nowrap;
	}

	@media (max-width: 640px) {
		.boss-link {
			grid-template-columns: 80px 1fr;
		}
		.preview {
			width: 80px;
			height: 48px;
		}
		.open-cta {
			grid-column: 2;
			font-size: 0.75rem;
		}
	}
</style>
