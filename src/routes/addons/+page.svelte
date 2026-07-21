<script lang="ts">
	import SEO from '../../components/seo.svelte';
	import Footer from '../../components/layout/footer.svelte';
	import { Button } from '$lib/components/ui/button';
	import { DISCORD_URL } from '$lib/data/addons';

	let { data } = $props();
</script>

<SEO
	title="WoW Addons for Mythic+ & Gearing | Mr. Mythical"
	description="Download Mr. Mythical WoW addons. Mythic+ keystone tooltips, SimulationCraft gearing dashboard, Raider.IO leaderboards, gear checks, and more on CurseForge and Wago."
	image="https://mrmythical.com/Logo.png"
	keywords="WoW addons, Mythic+ addon, DPS gearing dashboard, SimulationCraft, keystone tooltips, CurseForge, Mr Mythical"
/>

<main class="home">
	<header class="page-header">
		<p class="page-eyebrow">World of Warcraft</p>
		<h1 class="page-title">Mr. Mythical WoW addons</h1>
		<p class="page-lede">
			Free World of Warcraft addons for Mythic+ and gearing. Keystone tooltips, a SimC-checked
			gearing dashboard, Raider.IO leaderboards, gear checks, and a unicorn that talks too much.
			Grab them on CurseForge or Wago.
		</p>
	</header>

	<section class="tools">
		{#each data.addons as addon (addon.id)}
			<article class="tool-row">
				<div class="tool-copy">
					<p class="tool-eyebrow">{addon.name}</p>
					<h2 class="tool-title">{addon.headline}</h2>
					<p class="tool-body">{addon.blurb}</p>
					{#if addon.hasValidation && data.validation}
						<div class="accuracy">
							<p class="accuracy-label">Addon compared to simulation</p>
							<ul class="accuracy-metrics">
								<li>
									<span class="accuracy-value">{data.validation.upgrade_picks_pct.toFixed(1)}%</span
									>
									<span class="accuracy-name">upgrade picks</span>
								</li>
								<li>
									<span class="accuracy-value"
										>{data.validation.upgrade_size_error_pct.toFixed(2)}%</span
									>
									<span class="accuracy-name">gap error</span>
								</li>
								<li>
									<span class="accuracy-value"
										>{data.validation.dps_read_error_pct.toFixed(2)}%</span
									>
									<span class="accuracy-name">DPS read error</span>
								</li>
							</ul>
							<p class="accuracy-meta">
								{data.validation.spec_count} specs · checked {data.validation.checked_label}
							</p>
						</div>
					{:else if addon.hasValidation}
						<p class="tool-note">Includes SimulationCraft validation</p>
					{/if}
					<a href={`/addons/${addon.id}`} class="tool-link">
						{addon.ctaLabel}
						<svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true" fill="none">
							<path
								d="M3 2l5 4-5 4"
								stroke="currentColor"
								stroke-width="1.5"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</a>
				</div>
				<div class="tool-side">
					<ul class="feature-list">
						{#each addon.features as feature (feature)}
							<li>{feature}</li>
						{/each}
					</ul>
					<div class="addon-links">
						<a
							href={addon.links.curseforge}
							class="addon-link"
							target="_blank"
							rel="noopener noreferrer"
						>
							Download on CurseForge
						</a>
						<a
							href={addon.links.wago}
							class="addon-link addon-link--muted"
							target="_blank"
							rel="noopener noreferrer"
						>
							Get it on Wago
						</a>
					</div>
				</div>
			</article>
		{/each}
	</section>

	<section class="discord" aria-labelledby="discord-heading">
		<div class="discord-copy">
			<p class="tool-eyebrow">Community</p>
			<h2 id="discord-heading" class="tool-title">Need help with an addon?</h2>
			<p class="tool-body">Ask on Discord for bug reports, feedback, and Mythic+ addon talk.</p>
		</div>
		<div class="discord-actions">
			<Button href={DISCORD_URL} target="_blank" rel="noopener noreferrer" variant="default">
				Join the Discord
			</Button>
		</div>
	</section>
</main>

<Footer />

<style>
	.home {
		max-width: 1200px;
		margin: 0 auto;
		padding: 32px 24px 80px;
		display: flex;
		flex-direction: column;
		gap: 40px;
	}

	@media (max-width: 720px) {
		.home {
			padding: 16px 16px 48px;
			gap: 28px;
		}
	}

	.page-header {
		display: flex;
		flex-direction: column;
		gap: 6px;
		max-width: 72ch;
		padding-bottom: clamp(8px, 1.5vw, 16px);
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

	.tools {
		display: flex;
		flex-direction: column;
	}

	.tool-row {
		display: grid;
		grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
		gap: clamp(24px, 4vw, 56px);
		padding: 36px 0;
		border-top: 1px solid hsl(var(--border));
		align-items: start;
	}

	@media (max-width: 800px) {
		.tool-row {
			grid-template-columns: 1fr;
			gap: 20px;
			padding: 28px 0;
		}
	}

	.tool-copy,
	.tool-side {
		display: flex;
		flex-direction: column;
		gap: 10px;
		min-width: 0;
	}

	.tool-eyebrow {
		font-family: var(--font-body);
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: hsl(var(--link));
		margin: 0;
	}

	.tool-title {
		font-family: var(--font-heading);
		font-size: clamp(1.5rem, 2.4vw, 1.777rem);
		font-weight: 700;
		line-height: 1.15;
		letter-spacing: -0.015em;
		color: hsl(var(--foreground));
		margin: 0;
	}

	.tool-body {
		font-family: var(--font-body);
		font-size: 1rem;
		line-height: 1.55;
		color: hsl(var(--foreground));
		margin: 0;
		max-width: 56ch;
	}

	.tool-note {
		font-family: var(--font-body);
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: hsl(var(--link));
		margin: 0;
	}

	.accuracy {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 4px;
		padding-top: 12px;
		border-top: 1px solid hsl(var(--border));
		max-width: 42ch;
	}

	.accuracy-label {
		font-family: var(--font-body);
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: hsl(var(--link));
		margin: 0;
	}

	.accuracy-metrics {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 10px 12px;
	}

	.accuracy-metrics li {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.accuracy-value {
		font-family: var(--font-heading);
		font-size: 1.25rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.1;
		color: hsl(var(--foreground));
	}

	.accuracy-name {
		font-family: var(--font-body);
		font-size: 0.75rem;
		line-height: 1.3;
		color: hsl(var(--muted-foreground));
	}

	.accuracy-meta {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	@media (max-width: 560px) {
		.accuracy-metrics {
			grid-template-columns: 1fr;
		}
	}

	.tool-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin-top: 8px;
		font-family: var(--font-body);
		font-size: 0.9375rem;
		font-weight: 500;
		color: hsl(var(--foreground));
		text-decoration: none;
		border-bottom: 1px solid hsl(var(--primary));
		padding-bottom: 2px;
		width: fit-content;
		transition: color 150ms cubic-bezier(0.25, 1, 0.5, 1);
	}

	.tool-link:hover {
		color: hsl(var(--link));
		border-bottom-color: hsl(var(--link));
	}

	.feature-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		border-top: 1px solid hsl(var(--border));
	}

	.feature-list li {
		font-family: var(--font-body);
		font-size: 0.875rem;
		line-height: 1.45;
		color: hsl(var(--muted-foreground));
		padding: 10px 0;
		border-bottom: 1px solid hsl(var(--border));
	}

	.addon-links {
		display: flex;
		flex-wrap: wrap;
		gap: 8px 14px;
		margin-top: 4px;
	}

	.addon-link {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		text-decoration: none;
		border-bottom: 1px solid hsl(var(--primary));
		padding-bottom: 1px;
		transition: color 150ms cubic-bezier(0.25, 1, 0.5, 1);
	}

	.addon-link--muted {
		font-weight: 500;
		color: hsl(var(--muted-foreground));
		border-bottom-color: hsl(var(--border));
	}

	.addon-link:hover {
		color: hsl(var(--link));
		border-bottom-color: hsl(var(--link));
	}

	.discord {
		display: grid;
		grid-template-columns: minmax(0, 1.4fr) auto;
		gap: clamp(20px, 3vw, 40px);
		align-items: center;
		padding: 28px 0;
		border-top: 1px solid hsl(var(--border));
		border-bottom: 1px solid hsl(var(--border));
	}

	.discord-copy {
		display: flex;
		flex-direction: column;
		gap: 10px;
		min-width: 0;
	}

	.discord-actions {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 12px;
	}

	@media (max-width: 720px) {
		.discord {
			grid-template-columns: 1fr;
			gap: 16px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.tool-link,
		.addon-link {
			transition: none;
		}
	}
</style>
