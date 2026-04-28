<script lang="ts">
	interface HotspotRow {
		time_seconds: number;
		death_count: number;
		sample_count: number;
	}

	interface HotspotWindow {
		start_seconds: number;
		end_seconds: number;
		death_count: number;
		sample_count: number;
	}

	interface Props {
		bossId: number;
	}

	let { bossId }: Props = $props();

	let rows: HotspotRow[] = $state([]);
	let loading = $state(true);
	let error: string | null = $state(null);
	let lastFetchedBossId: number | null = $state(null);

	const WINDOW_SECONDS = 5;

	let activeFetchId = 0;

	async function fetchHotspots(id: number) {
		const fetchId = ++activeFetchId;
		loading = true;
		error = null;
		rows = [];
		try {
			const response = await fetch(`/api/death-hotspots?bossId=${id}`);
			if (!response.ok) {
				error = 'Failed to load death hotspots.';
				return;
			}
			const data = (await response.json()) as HotspotRow[];
			if (fetchId !== activeFetchId) return;
			rows = Array.isArray(data) ? data : [];
		} catch (err) {
			console.warn('death hotspots fetch failed', err);
			if (fetchId === activeFetchId) {
				error = 'Failed to load death hotspots.';
			}
		} finally {
			if (fetchId === activeFetchId) loading = false;
		}
	}

	$effect(() => {
		if (bossId !== lastFetchedBossId) {
			lastFetchedBossId = bossId;
			void fetchHotspots(bossId);
		}
	});

	function fmtTime(seconds: number) {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	function fmtWindow(startSeconds: number, endSeconds: number) {
		return `${fmtTime(startSeconds)}-${fmtTime(endSeconds)}`;
	}

	function buildHotspotWindows(sourceRows: HotspotRow[]): HotspotWindow[] {
		const positiveRows = sourceRows.filter((row) => row.death_count > 0);
		if (positiveRows.length === 0) return [];

		const rowsBySecond = new Map(sourceRows.map((row) => [row.time_seconds, row]));
		const firstSecond = Math.min(...positiveRows.map((row) => row.time_seconds));
		const lastSecond = Math.max(...positiveRows.map((row) => row.time_seconds));
		const fallbackSampleCount = sourceRows.reduce((max, row) => Math.max(max, row.sample_count), 0);
		const windows: HotspotWindow[] = [];

		for (let startSecond = firstSecond; startSecond <= lastSecond; startSecond += 1) {
			let deathCount = 0;
			let sampleCount = 0;

			for (let offset = 0; offset < WINDOW_SECONDS; offset += 1) {
				const row = rowsBySecond.get(startSecond + offset);
				if (!row) continue;
				deathCount += row.death_count;
				sampleCount = Math.max(sampleCount, row.sample_count);
			}

			if (deathCount > 0) {
				windows.push({
					start_seconds: startSecond,
					end_seconds: startSecond + WINDOW_SECONDS - 1,
					death_count: deathCount,
					sample_count: sampleCount || fallbackSampleCount
				});
			}
		}

		const selected: HotspotWindow[] = [];
		for (const hotspotWindow of windows.sort(
			(a, b) => b.death_count - a.death_count || a.start_seconds - b.start_seconds
		)) {
			const overlapsSelectedWindow = selected.some(
				(selectedWindow) =>
					hotspotWindow.start_seconds <= selectedWindow.end_seconds &&
					selectedWindow.start_seconds <= hotspotWindow.end_seconds
			);
			if (overlapsSelectedWindow) continue;

			selected.push(hotspotWindow);
			if (selected.length >= 8) break;
		}

		return selected;
	}

	let topWindows = $derived(buildHotspotWindows(rows));

	let maxDeathCount = $derived(
		topWindows.reduce((max, hotspotWindow) => Math.max(max, hotspotWindow.death_count), 0) || 1
	);

	let totalDeaths = $derived(rows.reduce((sum, r) => sum + r.death_count, 0));
	let totalSamples = $derived(rows.reduce((max, r) => Math.max(max, r.sample_count), 0));
</script>

<section class="hotspots">
	<header class="hotspots-head">
		<div>
			<h2>Death hotspots</h2>
			<p class="sub">The worst five-second death windows in this fight.</p>
		</div>
		{#if !loading && !error && totalSamples > 0}
			<div class="meta">
				<span class="meta-num">{totalDeaths.toLocaleString()}</span>
				<span class="meta-label">deaths · {totalSamples.toLocaleString()} fights</span>
			</div>
		{/if}
	</header>

	{#if loading}
		<p class="state">Loading death data…</p>
	{:else if error}
		<p class="state error">{error}</p>
	{:else if topWindows.length === 0}
		<p class="state">No death data recorded for this encounter yet.</p>
	{:else}
		<ol class="moments">
			{#each topWindows as hotspotWindow, i (`${hotspotWindow.start_seconds}-${hotspotWindow.end_seconds}`)}
				{@const widthPct = (hotspotWindow.death_count / maxDeathCount) * 100}
				{@const deathsPerPull = hotspotWindow.sample_count
					? hotspotWindow.death_count / hotspotWindow.sample_count
					: 0}
				<li class="moment">
					<span class="rank">#{i + 1}</span>
					<span class="time"
						>{fmtWindow(hotspotWindow.start_seconds, hotspotWindow.end_seconds)}</span
					>
					<div class="bar-track" aria-hidden="true">
						<span class="bar-fill" style="width: {widthPct}%"></span>
					</div>
					<span class="deaths">{hotspotWindow.death_count.toLocaleString()}</span>
					<span class="rate">{deathsPerPull.toFixed(2)}/pull</span>
				</li>
			{/each}
		</ol>
		<p class="legend">
			<span class="legend-key">Bar</span> length = total deaths recorded ·
			<span class="legend-key">/pull</span> = average deaths in that five-second window per logged kill.
		</p>
	{/if}
</section>

<style>
	.hotspots {
		margin-top: 2rem;
	}

	.hotspots-head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.875rem;
		padding-bottom: 0.625rem;
		border-bottom: 1px solid hsl(var(--border));
	}

	.hotspots-head h2 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.sub {
		margin: 0.125rem 0 0;
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
	}

	.meta {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		text-align: right;
	}

	.meta-num {
		font-size: 1.125rem;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		color: oklch(0.7 0.18 25);
	}

	.meta-label {
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: hsl(var(--muted-foreground));
	}

	.state {
		margin: 0.75rem 0;
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
	}

	.state.error {
		color: oklch(0.65 0.18 25);
	}

	.moments {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 0.5rem;
	}

	.moment {
		display: grid;
		grid-template-columns: 2.25rem 5.75rem minmax(0, 1fr) 4rem 3.5rem;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		background: hsl(var(--card));
		font-size: 0.875rem;
	}

	.rank {
		font-variant-numeric: tabular-nums;
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		font-weight: 600;
	}

	.time {
		font-variant-numeric: tabular-nums;
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.bar-track {
		position: relative;
		width: 100%;
		height: 0.5rem;
		border-radius: 999px;
		background: hsl(var(--muted) / 0.5);
		overflow: hidden;
	}

	.bar-fill {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		background: linear-gradient(90deg, oklch(0.7 0.16 25 / 0.85), oklch(0.65 0.2 18 / 0.95));
		border-radius: inherit;
	}

	.deaths {
		text-align: right;
		font-variant-numeric: tabular-nums;
		font-weight: 600;
	}

	.rate {
		text-align: right;
		font-variant-numeric: tabular-nums;
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
	}

	.legend {
		margin: 0.875rem 0 0;
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	.legend-key {
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	@media (max-width: 640px) {
		.moment {
			grid-template-columns: 2rem 5rem minmax(0, 1fr) 3rem 2.75rem;
			gap: 0.5rem;
			padding: 0.5rem;
			font-size: 0.8125rem;
		}

		.hotspots-head {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}

		.meta {
			align-items: flex-start;
			text-align: left;
		}
	}
</style>
