<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import SEO from '../components/seo.svelte';
	import Footer from '../components/layout/footer.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import BossPreviewChart from '../components/charts/bossPreviewChart.svelte';
	import ScorePlanner from '../components/calculator/scorePlanner.svelte';
	import { currentSeasonBosses } from '$lib/types/bossData';
	import { extractWarcraftLogsReportCode } from '$lib/data/warcraftlogs';
	import { ADDONS, DISCORD_URL } from '$lib/data/addons';
	import { PAGE_SEO } from '$lib/data/seoCopy';

	let { data = { session: null, validation: null } } = $props();

	const seasonBosses = currentSeasonBosses();

	// Rotate through the current raid's bosses in the encounter preview.
	let bossIndex = $state(0);
	const previewBoss = $derived(seasonBosses[bossIndex] ?? seasonBosses[0]);

	onMount(() => {
		const reduced =
			typeof window !== 'undefined' &&
			window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
		if (reduced || seasonBosses.length <= 1) return;
		const id = window.setInterval(() => {
			bossIndex = (bossIndex + 1) % seasonBosses.length;
		}, 15000);
		return () => window.clearInterval(id);
	});

	// Raid log quick-open form.
	let reportURL = $state('');
	let logError = $state('');

	function openLog(e?: Event) {
		e?.preventDefault();
		const trimmed = reportURL.trim();
		if (!trimmed) {
			logError = 'Paste a Warcraft Logs URL or report code.';
			return;
		}
		const code = extractWarcraftLogsReportCode(trimmed);
		if (!code) {
			logError = 'That does not look like a valid Warcraft Logs report.';
			return;
		}
		logError = '';
		void goto(`/raid/logs=${code}`);
	}

	function onLogInput() {
		if (logError) logError = '';
	}

	const gearingAddon = ADDONS.find((addon) => addon.id === 'dps-predictor');
	const gearingFeatures = [
		'Rank Midnight Season 2 dungeon and raid bosses by upgrade value',
		'Load a character from Battle.net Armory',
		'Typical farm scans finish immediately, with no SimC wait'
	];
</script>

<SEO
	title={PAGE_SEO.home.title}
	description={PAGE_SEO.home.description}
	keywords="World of Warcraft tools, Mythic+ calculator, WoW gearing, season BiS, Battle.net Armory, raid analysis, Warcraft logs, M+ score tracker, WoW addons, Mr Mythical addon"
/>

<main class="home">
	<header class="page-header">
		<p class="page-eyebrow">Mythic+ &amp; raid toolkit</p>
		<h1 class="page-title">Mr. Mythical</h1>
		<p class="page-lede">
			Score plans, a season gearing dashboard, raid logs, and boss profiles for when you need a
			quick answer between keys.
		</p>
	</header>

	<!-- TOOLKIT: editorial rows, not a card grid -->
	<section class="tools">
		<!-- Mythic+ score planner. Title left, tool right. -->
		<article class="tool-row tool-row--planner">
			<div class="tool-copy">
				<p class="tool-eyebrow">Mythic+ Score calculator</p>
				<h2 class="tool-title">See the keys you need.</h2>
				<p class="tool-body">Set a target rating and see the keystones that get you there.</p>
				<a href="/rating-calculator" class="tool-link">
					Open the full calculator
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
			<div class="tool-side tool-side--planner">
				<ScorePlanner />
			</div>
		</article>

		<!-- Gearing dashboard. Tool left, title right. -->
		<article class="tool-row tool-row--reverse">
			<div class="tool-side">
				<ul class="feature-list">
					{#each gearingFeatures as feature (feature)}
						<li>{feature}</li>
					{/each}
				</ul>
				{#if data.validation}
					<div class="accuracy">
						<p class="accuracy-label">Addon compared to simulation</p>
						<ul class="accuracy-metrics">
							<li>
								<span class="accuracy-value">{data.validation.upgrade_picks_pct.toFixed(1)}%</span>
								<span class="accuracy-name">upgrade picks</span>
							</li>
							<li>
								<span class="accuracy-value"
									>{data.validation.upgrade_size_error_pct.toFixed(2)}%</span
								>
								<span class="accuracy-name">gap error</span>
							</li>
							<li>
								<span class="accuracy-value">{data.validation.dps_read_error_pct.toFixed(2)}%</span>
								<span class="accuracy-name">DPS read error</span>
							</li>
						</ul>
						<p class="accuracy-meta">
							{data.validation.spec_count} specs · checked {data.validation.checked_label}
						</p>
					</div>
				{:else}
					<p class="tool-note">Includes SimulationCraft validation</p>
				{/if}
				{#if gearingAddon}
					<div class="addon-links">
						<a href={`/addons/${gearingAddon.id}`} class="addon-link addon-link--muted">
							View the addon
						</a>
					</div>
				{/if}
			</div>
			<div class="tool-copy">
				<p class="tool-eyebrow">Farm priority</p>
				<h2 class="tool-title">See what to farm first, instantly.</h2>
				<p class="tool-body">
					Load a character from Battle.net, then rank season dungeon and raid loot in the browser.
					Typical farm scans finish immediately, with no SimulationCraft wait.
				</p>
				<a href="/gearing" class="tool-link">
					Open farm priority
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
		</article>

		<!-- Raid log visualizer. Title left, tool right. -->
		<article class="tool-row">
			<div class="tool-copy">
				<p class="tool-eyebrow">Raid log visualizer</p>
				<h2 class="tool-title">Visualize your raid logs.</h2>
				<p class="tool-body">
					Per-second damage and healing on a shared timeline, with ability overlays.
				</p>
				<a href="/raid" class="tool-link">
					View the complete raid toolkit
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
				<form class="log-form" onsubmit={openLog} novalidate>
					<label for="home-log-url" class="log-label">Open a Warcraft Logs report</label>
					<div class="log-row">
						<Input
							id="home-log-url"
							type="text"
							placeholder="Paste report URL or 16-character code"
							bind:value={reportURL}
							oninput={onLogInput}
							autocomplete="off"
							spellcheck={false}
							aria-invalid={logError ? 'true' : undefined}
							aria-describedby={logError ? 'home-log-error' : undefined}
							class="log-input"
						/>
						<Button type="submit" variant="default">Open</Button>
					</div>
					{#if logError}
						<p id="home-log-error" class="log-error" role="alert">{logError}</p>
					{:else}
						<p class="log-hint">Per-second damage and healing, with ability overlays.</p>
					{/if}
				</form>
			</div>
		</article>

		<!-- Boss damage and death profile. Tool left, title right. -->
		<article class="tool-row tool-row--featured tool-row--reverse">
			<figure class="tool-preview">
				<div class="tool-preview-frame">
					{#key previewBoss.id}
						<BossPreviewChart bossId={previewBoss.id} />
					{/key}
				</div>
				<figcaption class="tool-preview-caption">
					Mythic {previewBoss.name}
				</figcaption>
			</figure>
			<div class="tool-copy">
				<p class="tool-eyebrow">Boss Damage & Death overview</p>
				<h2 class="tool-title">Read the spikes that decide pulls.</h2>
				<p class="tool-body">
					Averaged damage taken and death hotspots from public Mythic kills, with the spikes that
					decide pulls.
				</p>
				<a href="/raid/boss" class="tool-link">
					Browse encounters
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
		</article>

		<!-- In-game addon suite -->
		<article class="tool-row tool-row--addons" id="addons">
			<div class="tool-copy">
				<p class="tool-eyebrow">In-game addons</p>
				<h2 class="tool-title">Mr. Mythical addons</h2>
				<p class="tool-body">
					The same toolkit in-game. Keystone tooltips, DPS gearing that ranks upgrades immediately,
					leaderboards, gear checks, and a mascot that has opinions.
				</p>
				<a href="/addons" class="tool-link">
					Browse all addons
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
			<ul class="addon-list">
				{#each ADDONS as addon (addon.id)}
					<li class="addon-item">
						<a class="addon-copy" href={`/addons/${addon.id}`}>
							<p class="addon-name">{addon.name}</p>
							<p class="addon-tagline">{addon.tagline}</p>
						</a>
						<div class="addon-links">
							<a
								href={addon.links.curseforge}
								class="addon-link"
								target="_blank"
								rel="noopener noreferrer"
							>
								CurseForge
							</a>
							<a
								href={addon.links.wago}
								class="addon-link addon-link--muted"
								target="_blank"
								rel="noopener noreferrer"
							>
								Wago
							</a>
						</div>
					</li>
				{/each}
			</ul>
		</article>
	</section>

	<section class="discord discord--reverse" aria-labelledby="discord-heading">
		<div class="discord-actions">
			<Button href={DISCORD_URL} target="_blank" rel="noopener noreferrer" variant="default">
				Join Discord
			</Button>
		</div>
		<div class="discord-copy">
			<p class="tool-eyebrow">Community</p>
			<h2 id="discord-heading" class="tool-title">Join the Discord</h2>
			<p class="tool-body">
				Feedback, bug reports, and addon talk between keys. Come say what broke, or what you want
				next.
			</p>
		</div>
	</section>

	<section class="about">
		<p class="tool-eyebrow">About</p>
		<h2 class="tool-title">Built by a player, for keys and pulls.</h2>
		<p class="about-body">
			Mr. Mythical turns Warcraft Logs, keystone math, and season loot into answers you can use
			between runs. It is built by a player who wanted better tools for planning keys, reading raid
			logs, and ranking upgrades, and it stays updated with help from the community. The aim is
			simple: show the data that helps you decide which keystone to run next, what to farm, or how
			to handle a tricky boss.
		</p>
		<a href="/about" class="tool-link">
			Read more
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

	/* ---- PAGE HEADER ---- */

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

	/* ---- TOOLS ---- */

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

	.tool-row--featured {
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
	}

	.tool-row--featured.tool-row--reverse {
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
	}

	.tool-row--planner {
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr);
		align-items: start;
	}

	.tool-row--reverse {
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
		align-items: start;
	}

	.tool-row--addons {
		grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.25fr);
		align-items: start;
	}

	@media (max-width: 800px) {
		.tool-row,
		.tool-row--featured,
		.tool-row--reverse,
		.tool-row--addons {
			grid-template-columns: 1fr;
			gap: 20px;
			padding: 28px 0;
		}

		.tool-row--reverse > :first-child {
			order: 2;
		}
	}

	.tool-side {
		min-width: 0;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
		gap: 10px;
	}

	.tool-side--planner {
		align-items: stretch;
	}

	.tool-copy {
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
		font-size: clamp(4rem, 2.4vw, 1.777rem);
		font-weight: 700;
		line-height: 1.15;
		letter-spacing: -0.015em;
		color: hsl(var(--foreground));
		margin: 0;
	}

	.tool-body {
		font-family: var(--font-body);
		font-size: 1.5rem;
		line-height: 1.55;
		color: hsl(var(--foreground));
		margin: 0;
		max-width: 56ch;
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

	.tool-link:focus-visible {
		outline: 2px solid hsl(var(--ring));
		outline-offset: 4px;
		border-radius: 2px;
	}

	.feature-list {
		list-style: none;
		margin: 4px 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		border-top: 1px solid hsl(var(--border));
		max-width: 56ch;
	}

	.tool-side .feature-list {
		margin-top: 0;
		border-top: none;
	}

	.feature-list li {
		font-family: var(--font-body);
		font-size: 0.875rem;
		line-height: 1.45;
		color: hsl(var(--muted-foreground));
		padding: 10px 0;
		border-bottom: 1px solid hsl(var(--border));
		padding-left: 1em;
		position: relative;
	}

	.feature-list li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 1.05em;
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: hsl(var(--link));
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

	/* ---- LOG FORM ---- */

	.log-form {
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-width: 0;
	}

	.log-label {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground));
	}

	.log-row {
		display: flex;
		gap: 8px;
		min-width: 0;
	}

	.log-row :global(.log-input) {
		flex: 1;
		min-width: 0;
		font-family: var(--font-body);
	}

	.log-hint,
	.log-error {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		line-height: 1.4;
		margin: 0;
	}

	.log-hint {
		color: hsl(var(--muted-foreground));
	}

	.log-error {
		color: hsl(var(--destructive, 0 70% 45%));
	}

	@media (max-width: 480px) {
		.log-row {
			flex-direction: column;
		}
	}

	/* ---- PREVIEW ---- */

	.tool-preview {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
		min-width: 0;
	}

	.tool-preview-frame {
		border: 1px solid hsl(var(--border));
		border-radius: 10px;
		background: hsl(var(--card));
		padding: 16px;
		height: 220px;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.tool-preview-caption {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	/* ---- ADDON LIST ---- */

	.addon-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		border-top: 1px solid hsl(var(--border));
	}

	.addon-item {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 12px 20px;
		align-items: center;
		padding: 14px 0;
		border-bottom: 1px solid hsl(var(--border));
	}

	.addon-copy {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
		text-decoration: none;
		color: inherit;
	}

	.addon-copy:hover .addon-name {
		color: hsl(var(--link));
	}

	.addon-copy:focus-visible {
		outline: 2px solid hsl(var(--ring));
		outline-offset: 4px;
		border-radius: 2px;
	}

	.addon-name {
		font-family: var(--font-heading);
		font-size: 1.0625rem;
		font-weight: 700;
		letter-spacing: -0.01em;
		line-height: 1.2;
		color: hsl(var(--foreground));
		margin: 0;
		transition: color 150ms cubic-bezier(0.25, 1, 0.5, 1);
	}

	.addon-tagline {
		font-family: var(--font-body);
		font-size: 0.875rem;
		line-height: 1.45;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	.addon-links {
		display: flex;
		flex-wrap: wrap;
		gap: 8px 14px;
		justify-content: flex-end;
	}

	.tool-side .addon-links {
		justify-content: flex-start;
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

	.addon-link:focus-visible {
		outline: 2px solid hsl(var(--ring));
		outline-offset: 3px;
		border-radius: 2px;
	}

	@media (max-width: 560px) {
		.addon-item {
			grid-template-columns: 1fr;
			gap: 8px;
		}

		.addon-links {
			justify-content: flex-start;
		}
	}

	/* ---- DISCORD ---- */

	.discord {
		display: grid;
		grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
		gap: clamp(24px, 4vw, 56px);
		align-items: start;
		padding: 36px 0;
		border-top: 1px solid hsl(var(--border));
		border-bottom: 1px solid hsl(var(--border));
	}

	.discord--reverse {
		grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
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

	@media (max-width: 800px) {
		.discord {
			grid-template-columns: 1fr;
			gap: 16px;
			padding: 28px 0;
		}

		.discord--reverse > :first-child {
			order: 2;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.tool-link,
		.addon-link {
			transition: none;
		}
	}

	/* ---- ABOUT ---- */

	.about {
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding-top: 8px;
		max-width: 64ch;
	}

	.about-body {
		color: hsl(var(--muted-foreground));
	}
</style>
