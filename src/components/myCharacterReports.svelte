<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
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

	interface Props {
		onSelectReport: (code: string) => void;
	}

	let { onSelectReport }: Props = $props();

	let reports: CharacterReport[] = $state([]);
	let guilds: { name: string; count: number }[] = $state([]);
	let isLoading = $state(true);
	let guildFilter: string | null = $state(null);

	let session = $derived($page.data.session);

	const filteredReports = $derived(
		guildFilter
			? reports.filter((report) => report.guild?.name === guildFilter)
			: reports
	);

	onMount(async () => {
		if (!session) {
			isLoading = false;
			return;
		}
		try {
			const response = await fetch('/api/character-reports');
			if (response.ok) {
				const data = await response.json();
				reports = data.reports ?? [];
				guilds = data.guilds ?? [];
			}
		} catch (error) {
			logClientError('myCharacterReports', 'Failed to load character reports', error);
		} finally {
			isLoading = false;
		}
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

<Card class="my-character-reports h-full border-none">
	<div class="p-3">
		{#if isLoading && session}
			<div class="py-8 text-center">
				<Loader2 class="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
				<p class="mt-2 text-sm text-muted-foreground">Loading reports from your characters...</p>
			</div>
		{:else if !session}
			<div class="py-8 text-center text-muted-foreground">
				<p class="text-sm">Login to see reports from your characters and guilds</p>
			</div>
		{:else if reports.length === 0}
			<div class="py-8 text-center text-muted-foreground">
				<p class="text-sm">
					No public WarcraftLogs reports found for your characters yet.
				</p>
			</div>
		{:else}
			{#if guilds.length > 0}
				<div class="mb-3 flex flex-wrap items-center gap-1.5">
					<span class="text-xs uppercase tracking-wide text-muted-foreground">Filter by guild</span>
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

			{#if filteredReports.length === 0}
				<div class="py-6 text-center text-muted-foreground">
					<p class="text-sm">No reports match that guild filter.</p>
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
					{#each filteredReports as report (report.code)}
						<div class="animate-in fade-in-0 slide-in-from-top-2 duration-300">
							<Button
								variant="outline"
								class="h-auto w-full px-2.5 py-2 text-left"
								onclick={() => onSelectReport(report.code)}
							>
								<div class="w-full">
									<div class="flex items-start justify-between">
										<span class="truncate text-sm font-medium">{report.title}</span>
									</div>
									{#if report.guild?.name}
										<span class="block truncate text-xs text-muted-foreground">
											Guild: {report.guild.name}
										</span>
									{/if}
									<span class="mt-0.5 block truncate text-xs text-muted-foreground">
										Seen via {report.sourceCharacter.name}
									</span>
									<div class="mt-0.5 flex items-center justify-between">
										<span class="text-xs text-muted-foreground">By: {report.owner.name}</span>
										<span class="text-xs text-muted-foreground">
											{formatTimestamp(report.timestamp)}
										</span>
									</div>
								</div>
							</Button>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</Card>

<style>
	.guild-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.3rem 0.7rem;
		border-radius: 999px;
		border: 1px solid hsl(var(--border));
		background: transparent;
		color: hsl(var(--foreground));
		font-size: 0.8rem;
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
		font-size: 0.7rem;
		color: hsl(var(--muted-foreground));
	}

	.guild-chip-active .guild-chip-count {
		color: hsl(var(--primary));
	}
</style>
