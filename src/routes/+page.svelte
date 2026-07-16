<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import SEO from '../components/seo.svelte';
	import Footer from '../components/layout/footer.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import BossPreviewChart from '../components/charts/bossPreviewChart.svelte';
	import ScorePlanner from '../components/calculator/scorePlanner.svelte';
	import { bosses } from '$lib/types/bossData';
	import { extractWarcraftLogsReportCode } from '$lib/data/warcraftlogs';
	import { ADDONS, DISCORD_URL, FLAGSHIP_ADDON } from '$lib/data/addons';

	// Rotate through the current raid's bosses in the encounter preview.
	let bossIndex = $state(0);
	const previewBoss = $derived(bosses[bossIndex] ?? bosses[0]);

	onMount(() => {
		const reduced =
			typeof window !== 'undefined' &&
			window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
		if (reduced || bosses.length <= 1) return;
		const id = window.setInterval(() => {
			bossIndex = (bossIndex + 1) % bosses.length;
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
</script>

<SEO
	title="Mr. Mythical | Mythic+ & Raid Tools"
	description="Master WoW with Mr. Mythical: Mythic+ score calculator, raid visualizations, and in-game addons for keystones, gear, and DPS."
	image="https://mrmythical.com/Logo.png"
	keywords="World of Warcraft tools, Mythic+ calculator, raid analysis, WoW dungeon optimization, Warcraft logs, M+ score tracker, WoW addons, Mr Mythical addon, raid progression"
/>

<main class="home">
	<header class="page-header">
		<p class="page-eyebrow">Mythic+ &amp; raid toolkit</p>
		<h1 class="page-title">Mr. Mythical</h1>
		<p class="page-lede">
			Score plans, raid logs, and boss profiles for when you need a quick answer between keys.
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

		<!-- Raid log visualizer. Tool left, title right. -->
		<article class="tool-row tool-row--reverse">
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
			<div class="tool-copy">
				<p class="tool-eyebrow">Raid log visualizer</p>
				<h3 class="tool-title">Visualize your raid logs.</h3>
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
		</article>

		<!-- Boss damage and death profile. Title left, tool right. -->
		<article class="tool-row tool-row--featured">
			<div class="tool-copy">
				<p class="tool-eyebrow">Boss Damage & Death overview</p>
				<h3 class="tool-title">Read the spikes that decide pulls.</h3>
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
		</article>

		<!-- In-game addon suite -->
		<article class="tool-row tool-row--addons" id="addons">
			<div class="tool-copy">
				<p class="tool-eyebrow">In-game addons</p>
				<h3 class="tool-title">Mr. Mythical addons</h3>
				<p class="tool-body">
					The same toolkit in-game. Keystone tooltips, DPS gearing, leaderboards, gear checks, and a
					mascot that has opinions.
				</p>
			</div>
			<ul class="addon-list">
				{#each ADDONS as addon (addon.id)}
					<li class="addon-item" class:addon-item--flagship={addon.id === FLAGSHIP_ADDON.id}>
						<div class="addon-copy">
							<p class="addon-name">{addon.name}</p>
							<p class="addon-tagline">{addon.tagline}</p>
						</div>
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

	<section class="discord" aria-labelledby="discord-heading">
		<div class="discord-copy">
			<p class="tool-eyebrow">Community</p>
			<h2 id="discord-heading" class="tool-title">Join the Discord</h2>
			<p class="tool-body">
				Feedback, bug reports, and addon talk between keys. Come say what broke, or what you want
				next.
			</p>
		</div>
		<div class="discord-actions">
			<Button href={DISCORD_URL} target="_blank" rel="noopener noreferrer" variant="default">
				Join Discord
			</Button>
			<a href="#addons" class="tool-link">
				Browse the addons
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
	</section>

	<section class="about">
		<p class="tool-eyebrow">About</p>
		<h2 class="tool-title">Built by a player, for keys and pulls.</h2>
		<p class="about-body">
			Mr. Mythical turns Warcraft Logs and keystone math into answers you can use between runs. It
			is built by a player who wanted better tools for planning keys and reading raid logs, and it
			stays updated with help from the community. The aim is simple: show the data that helps you
			decide which keystone to run next, or how to handle a tricky boss.
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

		.tool-row--reverse > .tool-side {
			order: 2;
		}
	}

	.tool-side {
		min-width: 0;
		display: flex;
		flex-direction: column;
		justify-content: flex-start;
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

	.tool-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
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

	.addon-item--flagship .addon-name {
		color: hsl(var(--link));
	}

	.addon-copy {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}

	.addon-name {
		font-family: var(--font-heading);
		font-size: 1.0625rem;
		font-weight: 700;
		letter-spacing: -0.01em;
		line-height: 1.2;
		color: hsl(var(--foreground));
		margin: 0;
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
