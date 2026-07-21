<script lang="ts">
	import type { ValidationExport, ValidationSpecDisplay } from '$lib/data/validation';
	import { VALIDATION_METRIC_COPY } from '$lib/data/validation';

	interface Props {
		data: ValidationExport;
		specs: ValidationSpecDisplay[];
	}

	let { data, specs }: Props = $props();

	const overall = $derived(data.overall);

	function fmtPct(value: number, digits = 0): string {
		return `${value.toFixed(digits)}%`;
	}

	function picksTone(value: number): 'good' | 'ok' | 'low' {
		if (value >= 95) return 'good';
		if (value >= 85) return 'ok';
		return 'low';
	}
</script>

<section class="validation" id="validation" aria-labelledby="validation-heading">
	<div class="validation-intro">
		<p class="eyebrow">SimulationCraft validation</p>
		<h2 id="validation-heading" class="title">How close is the DPS model to SimC?</h2>
		<p class="lede">
			Before a model ships, we run fresh SimulationCraft tests on gear swaps the model did not train
			on. Same numbers ship in the addon. Use them to decide if the tooltip DPS is good enough for
			your gearing.
		</p>
		<p class="meta">
			Last checked {data.checked_label}
			{#if data.is_full_run}
				· full run
			{/if}
			· {overall.spec_count} specs · {overall.scored_pairs} scored pairs
		</p>
	</div>

	<div class="metrics" role="list">
		<div class="metric" role="listitem">
			<p class="metric-label">{VALIDATION_METRIC_COPY.upgrade_picks.label}</p>
			<p class="metric-value" data-tone={picksTone(overall.upgrade_picks_pct)}>
				{fmtPct(overall.upgrade_picks_pct, 1)}
			</p>
			<p class="metric-hint">{VALIDATION_METRIC_COPY.upgrade_picks.hint}</p>
		</div>
		<div class="metric" role="listitem">
			<p class="metric-label">{VALIDATION_METRIC_COPY.gap_error.label}</p>
			<p class="metric-value">{fmtPct(overall.upgrade_size_error_pct, 3)}</p>
			<p class="metric-hint">{VALIDATION_METRIC_COPY.gap_error.hint}</p>
		</div>
		<div class="metric" role="listitem">
			<p class="metric-label">{VALIDATION_METRIC_COPY.dps_read_error.label}</p>
			<p class="metric-value">{fmtPct(overall.dps_read_error_pct, 2)}</p>
			<p class="metric-hint">{VALIDATION_METRIC_COPY.dps_read_error.hint}</p>
		</div>
	</div>

	<details class="spec-details">
		<summary>Per-spec results ({specs.length})</summary>
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th scope="col">Spec</th>
						<th scope="col">Upgrade picks</th>
						<th scope="col">Gap error</th>
						<th scope="col">DPS read error</th>
						<th scope="col">Pairs</th>
					</tr>
				</thead>
				<tbody>
					{#each specs as row (row.profileKey)}
						<tr>
							<td>
								<span class="spec-label">{row.label}</span>
							</td>
							<td data-tone={picksTone(row.upgrade_picks_pct)}>
								{fmtPct(row.upgrade_picks_pct, 1)}
							</td>
							<td>{fmtPct(row.upgrade_size_error_pct, 3)}</td>
							<td>{fmtPct(row.dps_read_error_pct, 2)}</td>
							<td class="pairs">
								{row.n_scored_pairs}{#if row.n_tie_pairs > 0}
									<span class="ties">+{row.n_tie_pairs} ties</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</details>
</section>

<style>
	.validation {
		display: flex;
		flex-direction: column;
		gap: 28px;
		width: 100%;
		min-width: 0;
	}

	.validation-intro {
		display: flex;
		flex-direction: column;
		gap: 10px;
		max-width: 68ch;
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

	.title {
		font-family: var(--font-heading);
		font-size: clamp(1.5rem, 2.4vw, 1.777rem);
		font-weight: 700;
		line-height: 1.15;
		letter-spacing: -0.015em;
		color: hsl(var(--foreground));
		margin: 0;
	}

	.lede,
	.meta,
	.metric-hint {
		font-family: var(--font-body);
		margin: 0;
	}

	.lede {
		font-size: 1rem;
		line-height: 1.55;
		color: hsl(var(--foreground));
	}

	.meta {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
	}

	.metrics {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 20px 28px;
	}

	@media (max-width: 800px) {
		.metrics {
			grid-template-columns: 1fr;
		}
	}

	.metric {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding-top: 4px;
		border-top: 1px solid hsl(var(--border));
	}

	.metric-label {
		font-family: var(--font-body);
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	.metric-value {
		font-family: var(--font-heading);
		font-size: clamp(1.75rem, 3vw, 2.25rem);
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.1;
		color: hsl(var(--foreground));
		margin: 0;
	}

	.metric-value[data-tone='good'],
	td[data-tone='good'] {
		color: hsl(142 45% 32%);
	}

	:global(.dark) .metric-value[data-tone='good'],
	:global(.dark) td[data-tone='good'] {
		color: hsl(142 50% 58%);
	}

	.metric-value[data-tone='ok'],
	td[data-tone='ok'] {
		color: hsl(38 70% 36%);
	}

	:global(.dark) .metric-value[data-tone='ok'],
	:global(.dark) td[data-tone='ok'] {
		color: hsl(42 80% 62%);
	}

	.metric-value[data-tone='low'],
	td[data-tone='low'] {
		color: hsl(var(--link));
	}

	.metric-hint {
		font-size: 0.8125rem;
		line-height: 1.45;
		color: hsl(var(--muted-foreground));
		max-width: 42ch;
	}

	.spec-details {
		border-top: 1px solid hsl(var(--border));
		padding-top: 12px;
	}

	.spec-details summary {
		font-family: var(--font-body);
		font-size: 0.9375rem;
		font-weight: 500;
		color: hsl(var(--foreground));
		cursor: pointer;
		width: fit-content;
		border-bottom: 1px solid hsl(var(--primary));
		padding-bottom: 2px;
		list-style: none;
	}

	.spec-details summary::-webkit-details-marker {
		display: none;
	}

	.spec-details summary:hover {
		color: hsl(var(--link));
		border-bottom-color: hsl(var(--link));
	}

	.spec-details[open] summary {
		margin-bottom: 16px;
	}

	.table-wrap {
		overflow-x: auto;
		border: 1px solid hsl(var(--border));
		border-radius: 8px;
		background: hsl(var(--card));
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-family: var(--font-body);
		font-size: 0.875rem;
	}

	th,
	td {
		padding: 10px 14px;
		text-align: left;
		border-bottom: 1px solid hsl(var(--border));
		white-space: nowrap;
	}

	th {
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground));
		background: hsl(var(--secondary) / 0.45);
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

	.spec-label {
		font-weight: 500;
		color: hsl(var(--foreground));
	}

	.pairs {
		color: hsl(var(--muted-foreground));
	}

	.ties {
		margin-left: 6px;
		font-size: 0.75rem;
	}
</style>
