<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { recentReports, type RecentReport } from '$lib/utils/recentReports';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import { logClientError } from '$lib/utils/clientLog';

	interface CharacterReport {
		code: string;
		title: string;
		timestamp: number;
		guild: { name: string } | null;
		owner: { name: string };
		sourceCharacter: { name: string; realm: string; region: string };
	}

	interface GuildSummary {
		name: string;
		count: number;
	}

	interface Props {
		onSelectReport: (code: string) => void;
	}

	const MAX_PERSONAL_GUILD_REPORTS_SHOWN = 6;

	let { onSelectReport }: Props = $props();

	let session = $derived($page.data.session);

	let recent: RecentReport[] = $state([]);
	let recentLoading = $state(true);
	let characterReports: CharacterReport[] = $state([]);
	let guilds: GuildSummary[] = $state([]);
	let characterLoading = $state(true);
	let guildFilter: string | null = $state(null);

	const unsubscribeRecent = recentReports.subscribe((value) => {
		recent = value;
	});

	const unsubscribeRecentLoading = recentReports.loading.subscribe((value) => {
		recentLoading = value;
	});

	const filteredCharacterReports = $derived(
		guildFilter
			? characterReports.filter((report) => report.guild?.name === guildFilter)
			: characterReports
	);

	const visibleCharacterReports = $derived(
		filteredCharacterReports.slice(0, MAX_PERSONAL_GUILD_REPORTS_SHOWN)
	);

	onMount(async () => {
		await recentReports.init();

		if (!session) {
			characterLoading = false;
			return;
		}

		try {
			const response = await fetch('/api/character-reports');
			if (response.ok) {
				const data = await response.json();
				characterReports = data.reports ?? [];
				guilds = data.guilds ?? [];
				if (guilds.length > 0) {
					const topGuild = guilds.reduce((best, current) =>
						current.count > best.count ? current : best
					);
					guildFilter = topGuild.name;
				}
			}
		} catch (error) {
			logClientError('yourReports', 'Failed to load character reports', error);
		} finally {
			characterLoading = false;
		}
	});

	onDestroy(() => {
		unsubscribeRecent();
		unsubscribeRecentLoading();
	});

	function formatTimestamp(timestamp: number): string {
		if (!timestamp) return '';
		return new Date(timestamp).toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

<Card class="your-reports h-full border-none">
	<div class="p-2">
		{#if !session}
			<section class="reports-logged-out">
				<h3 class="report-title">Your reports</h3>
				<p class="report-note">Sign in to sync reports across devices and keep recent history.</p>
				<Button href="/auth/signin?provider=battlenet" size="sm" class="h-8 w-full text-xs">
					Sign in with Battle.net
				</Button>
			</section>
		{:else}
			<div class="report-columns">
				<section class="report-column">
					<h3 class="report-title">From your characters</h3>

					{#if characterLoading}
					<div class="py-2 text-center">
						<Loader2 class="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
					</div>
					{:else if characterReports.length === 0}
						<p class="report-note">No reports found from your imported characters.</p>
					{:else}
						{#if guilds.length > 0}
							<div class="guild-filters">
								<button
									type="button"
									class="guild-chip"
									class:guild-chip-active={guildFilter === null}
									onclick={() => (guildFilter = null)}
								>
									All
								</button>
								{#each guilds as guild (guild.name)}
									<button
										type="button"
										class="guild-chip"
										class:guild-chip-active={guildFilter === guild.name}
										onclick={() => (guildFilter = guild.name)}
									>
										{guild.name}
										<span class="guild-chip-count">{guild.count}</span>
									</button>
								{/each}
							</div>
						{/if}

						{#if visibleCharacterReports.length === 0}
							<p class="report-note">No reports match that guild filter.</p>
						{:else}
							<div class="report-list">
								{#each visibleCharacterReports as report (report.code)}
									<Button
										variant="outline"
										class="h-auto w-full justify-start px-2.5 py-2 text-left"
										onclick={() => onSelectReport(report.code)}
									>
										<div class="min-w-0 w-full">
											<div class="flex items-start justify-between gap-2">
												<span class="truncate text-sm font-medium">{report.title}</span>
												<span class="shrink-0 text-[10px] text-muted-foreground">
													{formatTimestamp(report.timestamp)}
												</span>
											</div>
											<div class="flex items-center justify-between gap-2 text-xs text-muted-foreground">
												<span class="truncate">
													{#if report.guild?.name}
														Guild: {report.guild.name}
													{:else}
														Guild: -
													{/if}
												</span>
												<span class="shrink-0">By: {report.owner.name}</span>
											</div>
										</div>
									</Button>
								{/each}
							</div>
						{/if}
					{/if}
				</section>

				<section class="report-column">
					<h3 class="report-title">Recent reports</h3>
					{#if guilds.length > 0}
						<div class="guild-filters-spacer" aria-hidden="true"></div>
					{/if}

					{#if recentLoading}
						<div class="py-2 text-center">
							<Loader2 class="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
						</div>
					{:else if recent.length === 0}
						<p class="report-note">No recent reports yet.</p>
					{:else}
						<div class="report-list">
							{#each recent as report (report.code)}
								<Button
									variant="outline"
									class="h-auto w-full justify-start px-2.5 py-2 text-left"
									onclick={() => onSelectReport(report.code)}
								>
									<div class="min-w-0 w-full">
										<div class="flex items-start justify-between gap-2">
											<span class="truncate text-sm font-medium">{report.title}</span>
											<span class="shrink-0 text-[10px] text-muted-foreground">
												{formatTimestamp(report.timestamp)}
											</span>
										</div>
										<div class="flex items-center justify-between gap-2 text-xs text-muted-foreground">
											<span class="truncate">
												{#if report.guild?.name}
													Guild: {report.guild.name}
												{:else}
													Guild: -
												{/if}
											</span>
											<span class="shrink-0">By: {report.owner.name}</span>
										</div>
									</div>
								</Button>
							{/each}
						</div>
					{/if}
				</section>
			</div>
		{/if}
	</div>
</Card>

<style>
	.report-columns {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.625rem;
	}

	.report-column {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		min-width: 0;
	}

	.report-title {
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	.report-note {
		font-size: 0.75rem;
		line-height: 1.4;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	.reports-logged-out {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.report-list {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.25rem;
	}

	.guild-filters {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.35rem;
	}

	.guild-filters-spacer {
		height: 1.65rem;
	}

	.guild-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		padding: 0.22rem 0.6rem;
		border-radius: 999px;
		border: 1px solid hsl(var(--border));
		background: transparent;
		color: hsl(var(--foreground));
		font-size: 0.7rem;
		line-height: 1;
		cursor: pointer;
		transition:
			background-color 140ms ease-out,
			border-color 140ms ease-out,
			color 140ms ease-out;
	}

	.guild-chip:hover {
		background: hsl(var(--muted) / 0.4);
	}

	.guild-chip-active {
		background: hsl(var(--primary) / 0.12);
		border-color: hsl(var(--primary) / 0.5);
		color: hsl(var(--primary));
	}

	.guild-chip-count {
		font-variant-numeric: tabular-nums;
		font-size: 0.65rem;
		color: hsl(var(--muted-foreground));
	}

	.guild-chip-active .guild-chip-count {
		color: hsl(var(--primary));
	}

	@media (min-width: 860px) {
		.report-columns {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.625rem;
		}
	}
</style>
