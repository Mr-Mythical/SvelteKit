<script lang="ts">
	import SEO from '../../components/seo.svelte';
	import Footer from '../../components/footer.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { bosses } from '$lib/types/bossData';
	import YourReports from '../../components/yourReports.svelte';
	import LogBrowserFilters from '../../components/logBrowser.svelte';
	import LogBrowserResults from '../../components/logBrowserResult.svelte';
	import BossPreviewChart from '../../components/bossPreviewChart.svelte';
	import { goto } from '$app/navigation';
	import { reveal } from '$lib/actions/reveal';
	import { extractWarcraftLogsReportCode } from '$lib/utils/warcraftlogs';

	let reportURL: string = $state('');
	let loadingFights = $state(false);
	let error: string = $state('');
	let browseLoading = $state(false);
	let browsedLogs: any[] = $state([]);
	let totalBrowsedLogs = $state(0);
	let currentBrowsePage = $state(1);
	const browseItemsPerPage = 10;

	function handleReportSelection(code: string) {
		reportURL = `https://www.warcraftlogs.com/reports/${code}`;
		fetchFights();
	}

	async function fetchFights() {
		if (!reportURL.trim()) {
			error = 'Enter a report URL or code.';
			return;
		}

		loadingFights = true;
		error = '';
		const codeToFetch = extractWarcraftLogsReportCode(reportURL);
		if (!codeToFetch) {
			error = 'Enter a valid WarcraftLogs report URL or 16-character report code.';
			loadingFights = false;
			return;
		}

		try {
			const response = await fetch('/api/fights', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ code: codeToFetch })
			});
			const data = await response.json();

			if (response.ok) {
				await goto(`/raid/logs=${codeToFetch}`);
			} else {
				error = data.error || 'Failed to fetch fights.';
			}
		} catch (err) {
			console.error('Fetch Fights Error:', err);
			error = 'Something went wrong. Try again in a moment.';
		} finally {
			loadingFights = false;
		}
	}

	function onUrlKey(e: KeyboardEvent) {
		if (e.key === 'Enter') fetchFights();
	}

	function onUrlInput() {
		if (error) error = '';
	}

	async function handleLogSearch(detail: {
		bossId?: number;
		minDuration?: number;
		maxDuration?: number;
		healerSpecs?: string[];
	}) {
		browseLoading = true;
		browsedLogs = [];
		totalBrowsedLogs = 0;
		currentBrowsePage = 1;

		const params = { ...detail, page: 1, limit: browseItemsPerPage };
		try {
			const response = await fetch('/api/browse-logs', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(params)
			});
			const data = await response.json();

			if (response.ok && data.logs) {
				browsedLogs = data.logs;
				totalBrowsedLogs = data.total || 0;
			} else {
				browsedLogs = [];
				totalBrowsedLogs = 0;
			}
		} catch (err) {
			console.error('Error fetching logs:', err);
			browsedLogs = [];
			totalBrowsedLogs = 0;
		} finally {
			browseLoading = false;
		}
	}

	async function handleBrowsePageChange(_detail: { page: number }) {
		// Pagination is handled by the LogBrowser component itself; this stub
		// exists only to satisfy its `onPageChange` prop until server-side paging
		// is wired up here.
	}

	function analyzeLogFromBrowse(log: any) {
		goto(`/raid/logs=${log.log_code}?fight=${log.fight_id}`);
	}
</script>

<SEO
	title="WoW Raid Log Visualizer & WarcraftLogs Analysis | Mr. Mythical"
	description="Visualize WarcraftLogs reports second-by-second, study aggregate boss damage profiles from Mythic progression kills, and browse public logs by encounter and healer comp."
	image="https://mrmythical.com/Logo.png"
	keywords="WoW raid log visualizer, WarcraftLogs analysis, Mythic raid damage timeline, healer cooldown planning, raid log browser, boss damage profiles, WoW raid tools"
/>

<main class="page">
	<header class="tool-header">
		<p class="eyebrow">Raid toolkit</p>
		<h1 class="tool-title">WoW Raid Log Visualizer.</h1>
		<p class="tool-sub">
			Paste a WarcraftLogs report, browse comparable public kills, or study aggregate boss damage
			profiles and death hotspots from Mythic progression kills.
		</p>
		<div class="tool-input">
			<label for="reportCodeTop" class="sr-only">WarcraftLogs link or code</label>
			<Input
				id="reportCodeTop"
				type="text"
				bind:value={reportURL}
				oninput={onUrlInput}
				onkeydown={onUrlKey}
				placeholder="Paste a WarcraftLogs report URL or code"
				class="h-10"
				aria-describedby="reportCodeTopHint"
			/>
			<Button onclick={fetchFights} disabled={loadingFights} class="h-10 shrink-0">
				{loadingFights ? 'Opening…' : 'Open report'}
			</Button>
		</div>
		<p id="reportCodeTopHint" class="tool-hint">
			Accepts full WarcraftLogs URLs (including query/hash params) or a 16-character report code.
		</p>
		{#if error && !loadingFights}
			<p class="tool-error" role="alert">{error}</p>
		{/if}
	</header>

	<div class="raid-grid">
		<div class="raid-col-main">
			<section class="reveal-block" use:reveal={{ delay: 0 }}>
				<header class="section-head">
					<h2 class="section-label">Your reports</h2>
					<span class="section-hint">Recent logs you opened, plus reports from your characters and guild</span>
				</header>
				<div class="reveal-surface" use:reveal={{ delay: 40 }}>
					<YourReports onSelectReport={handleReportSelection} />
				</div>
			</section>

			<section class="reveal-block" use:reveal={{ delay: 0 }}>
				<header class="section-head">
					<h2 class="section-label">Browse public logs</h2>
					<span class="section-hint">Filter public WarcraftLogs reports by boss, pull length, and healer comp</span>
				</header>
				<div class="reveal-surface" use:reveal={{ delay: 40 }}>
					<LogBrowserFilters onsearch={handleLogSearch} loading={browseLoading} />
					<LogBrowserResults
						logs={browsedLogs}
						loading={browseLoading}
						totalLogs={totalBrowsedLogs}
						currentPage={currentBrowsePage}
						itemsPerPage={browseItemsPerPage}
						onpageChange={handleBrowsePageChange}
						onanalyzeLog={(log) => analyzeLogFromBrowse(log)}
					/>
				</div>
			</section>
		</div>

		<aside class="raid-col-side reveal-block" use:reveal={{ delay: 0 }}>
			<header class="section-head">
				<h2 class="section-label">Boss damage profiles</h2>
				<span class="section-hint">Averaged damage timelines with five-second death windows</span>
			</header>
			<div class="boss-grid reveal-surface" use:reveal={{ delay: 40 }}>
				{#each bosses as boss (boss.id)}
					<a href={`/raid/boss/${boss.slug}`} class="boss-tile">
						<div class="boss-thumb">
							<BossPreviewChart bossId={boss.id} />
						</div>
						<div class="boss-meta">
							<span class="boss-name">{boss.name}</span>
							<span class="boss-action" aria-hidden="true">→</span>
						</div>
					</a>
				{/each}
			</div>
		</aside>
	</div>

	<section class="about reveal-block" use:reveal={{ delay: 0 }}>
		<h2 class="section-label">About the raid toolkit</h2>
		<div class="reveal-surface" use:reveal={{ delay: 40 }}>
			<p class="raid-lede">
				WarcraftLogs analysis for raid leaders, healer cores, and officers who would rather read
				a chart than scroll a damage-taken table. Paste a report to watch a fight unfold
				second-by-second, open a boss damage profile to see aggregate pressure from real Mythic
				kills, or browse public logs filtered by comp when your own pulls stop teaching you
				anything new.
			</p>
			<dl class="feature-list">
				<div class="feature-row">
					<dt>Interactive damage and healing timelines</dt>
					<dd>
						Every damage and healing event on a shared second-by-second axis. Click an ability
						to isolate it, overlay boss casts to anchor mechanics, and toggle healer cooldowns
						to see which windows were actually covered. The spike you felt in the pull gets a
						timestamp, a source, and a visible window for the external that should have covered
						it.
					</dd>
				</div>
				<div class="feature-row">
					<dt>Aggregate boss damage profiles</dt>
					<dd>
						Per-second damage-taken averages with standard deviation bands and 95% confidence
						intervals, computed from public Mythic progression kills. Death hotspots group deaths
						into five-second review windows, so raid leaders can separate one-off deaths from
						repeatable mechanic failures.
					</dd>
				</div>
				<div class="feature-row">
					<dt>Raid log browser with composition filters</dt>
					<dd>
						Search public WarcraftLogs reports by encounter, pull length, and healer spec to
						find kills close to your own comp. Useful when your roster does not match the meta
						build the guide was written for.
					</dd>
				</div>
				<div class="feature-row">
					<dt>Per-account recent and guild reports</dt>
					<dd>
						Sign in with Battle.net and the site remembers reports from your characters and the
						guilds they raid with. One list for every alt, and every chart, fight, and profile
						stays shareable by plain URL.
					</dd>
				</div>
			</dl>
		</div>
	</section>
</main>

<Footer />

<style>
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.page {
		max-width: 80rem;
		margin: 0 auto;
		padding: clamp(20px, 3vw, 36px) clamp(20px, 4vw, 48px) 64px;
	}

	.tool-header {
		display: flex;
		flex-direction: column;
		gap: 6px;
		max-width: 72ch;
		padding-bottom: clamp(20px, 3vw, 32px);
	}

	.eyebrow {
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
		font-size: clamp(1.75rem, 4vw, 2.5rem);
		font-weight: 700;
		line-height: 1.08;
		letter-spacing: -0.02em;
		color: hsl(var(--foreground));
		margin: 0;
	}

	.tool-sub {
		font-family: var(--font-body);
		font-size: 0.9375rem;
		line-height: 1.45;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	.tool-input {
		display: flex;
		gap: 8px;
		margin-top: 16px;
		max-width: 36rem;
	}

	.tool-error {
		margin: 10px 0 0;
		font-family: var(--font-body);
		font-size: 0.8125rem;
		color: hsl(var(--destructive));
	}

	.tool-hint {
		margin: 8px 0 0;
		font-family: var(--font-body);
		font-size: 0.75rem;
		line-height: 1.35;
		color: hsl(var(--muted-foreground));
	}

	.section-label {
		font-family: var(--font-body);
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	.section-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 20px;
	}

	.section-hint {
		font-family: var(--font-body);
		font-size: 0.75rem;
		line-height: 1.4;
		color: hsl(var(--muted-foreground));
		text-align: right;
		max-width: 36ch;
	}

	.raid-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: clamp(40px, 5vw, 56px);
		margin-top: clamp(28px, 4vw, 40px);
		padding-top: clamp(32px, 4vw, 48px);
		border-top: 1px solid hsl(var(--border));
	}

	@media (min-width: 1024px) {
		.raid-grid {
			grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
			gap: 3.5rem;
		}
	}

	.raid-col-main {
		display: flex;
		flex-direction: column;
		gap: clamp(40px, 5vw, 60px);
		min-width: 0;
	}

	.raid-col-side {
		min-width: 0;
	}

	.about {
		margin-top: clamp(40px, 5vw, 60px);
		padding-top: clamp(32px, 4vw, 48px);
		border-top: 1px solid hsl(var(--border));
	}

	.raid-lede {
		font-family: var(--font-body);
		font-size: 0.9375rem;
		line-height: 1.65;
		color: hsl(var(--muted-foreground));
		margin: 20px 0 24px;
		max-width: 72ch;
	}

	.feature-list {
		display: grid;
		gap: 0;
		margin: 0;
		padding: 0;
		max-width: 80ch;
	}

	.feature-row {
		display: grid;
		grid-template-columns: minmax(12rem, 16rem) 1fr;
		gap: 1.25rem;
		padding: 16px 0;
		border-top: 1px solid hsl(var(--border));
	}

	.feature-row:last-child {
		border-bottom: 1px solid hsl(var(--border));
	}

	.feature-row dt {
		font-family: var(--font-heading);
		font-size: 0.9375rem;
		font-weight: 600;
		letter-spacing: -0.005em;
		color: hsl(var(--foreground));
		margin: 0;
		line-height: 1.35;
	}

	.feature-row dd {
		font-family: var(--font-body);
		font-size: 0.875rem;
		line-height: 1.6;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	@media (max-width: 640px) {
		.feature-row {
			grid-template-columns: 1fr;
			gap: 4px;
		}
		.section-head {
			flex-direction: column;
			align-items: flex-start;
			gap: 6px;
		}
		.section-hint {
			text-align: left;
			max-width: none;
		}
	}

	.reveal-block,
	.reveal-surface {
		opacity: 0;
		transform: translate3d(0, 10px, 0);
		transition:
			opacity 220ms cubic-bezier(0.16, 1, 0.3, 1),
			transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
		transition-delay: var(--reveal-delay, 0ms);
	}

	.reveal-block:global([data-revealed='true']),
	.reveal-surface:global([data-revealed='true']) {
		opacity: 1;
		transform: translate3d(0, 0, 0);
	}

	.boss-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 10px;
	}

	.boss-tile {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 10px;
		border: 1px solid hsl(var(--border));
		border-radius: 8px;
		background: transparent;
		text-decoration: none;
		color: inherit;
		transition:
			border-color 160ms cubic-bezier(0.25, 1, 0.5, 1),
			transform 160ms cubic-bezier(0.25, 1, 0.5, 1),
			background-color 160ms cubic-bezier(0.25, 1, 0.5, 1);
	}

	.boss-tile:hover {
		border-color: hsl(var(--primary) / 0.6);
		transform: translateY(-1px);
	}

	.boss-tile:focus-visible {
		outline: none;
		border-color: hsl(var(--primary));
		box-shadow: 0 0 0 3px hsl(var(--primary) / 0.25);
	}

	.boss-thumb {
		height: 5.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		border-radius: 6px;
		background: transparent;
	}

	.boss-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}

	.boss-name {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: 500;
		letter-spacing: -0.005em;
	}

	.boss-action {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		transition:
			transform 160ms cubic-bezier(0.25, 1, 0.5, 1),
			color 160ms;
	}

	.boss-tile:hover .boss-action {
		transform: translateX(2px);
		color: hsl(var(--primary));
	}

	@media (prefers-reduced-motion: reduce) {
		.reveal-block,
		.reveal-surface {
			opacity: 1;
			transform: none;
			transition: none;
		}
		.boss-tile,
		.boss-action {
			transition: none;
		}
	}
</style>
