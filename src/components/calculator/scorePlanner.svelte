<script lang="ts">
	import { calculateKeystoneBreakdown } from '$lib/calculations/keystoneCalculations';

	let input = $state('3200');

	const target = $derived.by(() => {
		const n = Number(input.replace(/[^\d]/g, ''));
		if (!Number.isFinite(n) || n <= 0) return 0;
		return Math.min(n, 5000);
	});

	const breakdown = $derived(target > 0 ? calculateKeystoneBreakdown(target) : []);

	const hasPlan = $derived(breakdown.length > 0);
</script>

<section class="planner" aria-label="Mythic+ score planner">
	<div class="planner-grid">
		<!-- Target input -->
		<div class="field">
			<label for="planner-target" class="field-label">Type your target score</label>
			<div class="field-shell">
				<input
					id="planner-target"
					type="text"
					inputmode="numeric"
					pattern="[0-9]*"
					autocomplete="off"
					class="field-input"
					bind:value={input}
					placeholder="3200"
					aria-label="Target Mythic+ score"
					aria-describedby="planner-hint"
				/>
			</div>
			<p id="planner-hint" class="field-hint">
				{#if !hasPlan}
					Enter a score to see the keys you need.
				{:else if target >= 5000}
					Capped at 5000.
				{:else}
					Type any score to update this plan instantly.
				{/if}
			</p>
		</div>
	</div>

	<!-- Key breakdown -->
	<div class="breakdown" aria-label="Keystone breakdown">
		{#if hasPlan}
			{#each breakdown as row (row.level)}
				<div class="breakdown-row">
					<span class="breakdown-level tabular">+{row.level}</span>
					<span class="breakdown-bar" aria-hidden="true">
						{#each { length: row.count } as _, j (j)}
							<span class="tick"></span>
						{/each}
					</span>
					<span class="breakdown-count tabular">× {row.count}</span>
				</div>
			{/each}
		{:else}
			<p class="empty">Your plan will appear here.</p>
		{/if}
	</div>

	<div class="planner-footer">
		<a href="/rating-calculator" class="footer-link">
			Open full calculator
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
		<span class="footer-meta">Import character, share plans, and tune by affix.</span>
	</div>
</section>

<style>
	.planner {
		background: hsl(var(--card));
		border: 1px solid hsl(var(--border));
		border-radius: 12px;
		padding: clamp(20px, 3vw, 32px);
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.planner-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0;
		align-items: stretch;
	}

	@media (max-width: 640px) {
		.planner-grid {
			grid-template-columns: 1fr;
			gap: 0;
			align-items: stretch;
		}
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
	}

	.field-label {
		font-family: var(--font-body);
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.02em;
		color: hsl(var(--muted-foreground));
		text-transform: uppercase;
	}

	.field-shell {
		position: relative;
	}

	.field-input {
		font-family: var(--font-heading);
		font-size: clamp(2.4rem, 5.5vw, 3.2rem);
		font-weight: 700;
		line-height: 1;
		letter-spacing: -0.02em;
		color: hsl(var(--foreground));
		background: transparent;
		border: none;
		border-bottom: 2px solid hsl(var(--border));
		padding: 0 0 8px 0;
		width: 100%;
		outline: none;
		transition: border-color 150ms cubic-bezier(0.25, 1, 0.5, 1);
		font-variant-numeric: tabular-nums;
	}

	.field-input:focus-visible {
		border-bottom-color: hsl(var(--primary));
	}

	.field-hint {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		margin: 0;
		line-height: 1.4;
		min-height: 1.2em;
	}

	.tabular {
		font-variant-numeric: tabular-nums;
	}

	.breakdown {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 16px 0 4px 0;
		border-top: 1px solid hsl(var(--border));
		min-height: 100px;
	}

	.breakdown-row {
		display: grid;
		grid-template-columns: 48px 1fr auto;
		align-items: center;
		gap: 16px;
	}

	.breakdown-level {
		font-family: var(--font-heading);
		font-size: 1.125rem;
		font-weight: 700;
		color: hsl(var(--foreground));
	}

	.breakdown-bar {
		display: inline-flex;
		gap: 4px;
		flex-wrap: wrap;
	}

	.tick {
		display: inline-block;
		height: 10px;
		width: 22px;
		background: hsl(var(--primary));
		border-radius: 2px;
	}

	.breakdown-count {
		font-family: var(--font-body);
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
	}

	.empty {
		font-family: var(--font-body);
		font-size: 0.9375rem;
		color: hsl(var(--muted-foreground));
		margin: 0;
		padding: 8px 0;
	}

	.planner-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		padding-top: 16px;
		border-top: 1px solid hsl(var(--border));
		flex-wrap: wrap;
	}

	.footer-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-family: var(--font-body);
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--foreground));
		text-decoration: none;
		transition: color 150ms cubic-bezier(0.25, 1, 0.5, 1);
	}

	.footer-link:hover {
		color: hsl(var(--link));
	}

	.footer-link:focus-visible {
		outline: 2px solid hsl(var(--ring));
		outline-offset: 4px;
		border-radius: 2px;
	}

	.footer-meta {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
	}

	@media (prefers-reduced-motion: reduce) {
		.field-input,
		.footer-link {
			transition: none;
		}
	}
</style>
