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
    <Card class="recent-reports h-full">
        <div class="p-4">
            <h3 class="text-lg font-semibold mb-4">Recent Reports</h3>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {#each reports as report}
                    <Button
                        variant="outline"
                        class="h-50 w-full text-left p-3" 
                        on:click={() => onSelectReport(report.code)}
                    >
                        <div class="w-full">
                            <div class="flex justify-between items-start">
                                <span class="font-medium text-base truncate">{report.title}</span>
                            </div>
                            {#if report.guild?.name}
                                <span class="text-sm text-muted-foreground block truncate">
                                    Guild: {report.guild.name}
                                </span>
                            {/if}
                            <div class="flex justify-between items-center mt-1">
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