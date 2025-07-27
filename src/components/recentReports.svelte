<script lang="ts">
	import { recentReports, type RecentReport } from '$lib/utils/recentReports';
	import { onDestroy } from 'svelte';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';

	let reports: RecentReport[] = [];
	const unsubscribe = recentReports.subscribe((value) => {
		reports = value;
	});

	onDestroy(() => {
		unsubscribe();
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

{#if reports.length}
	<Card class="recent-reports h-full border-none">
		<div class="p-4">
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
				{#each reports as report}
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
				{/each}
			</div>
		</div>
	</Card>
{/if}
