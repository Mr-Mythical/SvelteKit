<script lang="ts">
	import { recentReports, type RecentReport } from '$lib/utils/recentReports';
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import Loader2 from 'lucide-svelte/icons/loader-2';

	let reports: RecentReport[] = [];
	let isLoading = true;
	
	const unsubscribe = recentReports.subscribe((value) => {
		reports = value;
	});

	const unsubscribeLoading = recentReports.loading.subscribe((value) => {
		isLoading = value;
	});

	$: session = $page.data.session;

	onMount(async () => {
		// Initialize by loading from API
		await recentReports.init();
	});

	onDestroy(() => {
		unsubscribe();
		unsubscribeLoading();
	});

	export let onSelectReport: (code: string) => void;

	function formatTimestamp(timestamp: number): string {
		const date = new Date(timestamp);
		return date.toLocaleDateString('en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		});
	}
</script>

<Card class="recent-reports h-full border-none">
	<div class="p-4">
		{#if isLoading && session}
			<div class="text-center py-8">
				<Loader2 class="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
				<p class="text-sm text-muted-foreground mt-2">Loading recent reports...</p>
			</div>
		{:else if !session}
			<div class="text-center py-8 text-muted-foreground">
				<p class="text-sm">Login to sync recent reports across devices</p>
			</div>
		{:else if reports.length === 0}
			<div class="text-center py-8 text-muted-foreground">
				<p class="text-sm">No recent reports yet</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
				{#each reports as report (report.code)}
					<div class="animate-in fade-in-0 slide-in-from-top-2 duration-300">
						<Button
							variant="outline"
							class="h-50 w-full p-3 text-left"
							on:click={() => onSelectReport(report.code)}
						>
							<div class="w-full">
								<div class="flex items-start justify-between">
									<span class="truncate text-base font-medium">{report.title}</span>
								</div>
								{#if report.guild?.name}
									<span class="block truncate text-sm text-muted-foreground">
										Guild: {report.guild.name}
									</span>
								{/if}
								<div class="mt-1 flex items-center justify-between">
									<span class="text-sm text-muted-foreground">By: {report.owner.name}</span>
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
	</div>
</Card>
