<script lang="ts">
	import type { BrowsedLog } from '$lib/types/apiTypes';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';
	import { createEventDispatcher } from 'svelte';

	export let logs: BrowsedLog[] = [];
	export let loading = false;
	export let totalLogs = 0;
	export let currentPage = 1;
	export let itemsPerPage = 10;

	const dispatch = createEventDispatcher();

	function formatDuration(seconds: number): string {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}m ${remainingSeconds}s`;
	}

	function handlePageChange(newPage: number) {
		if (newPage > 0 && newPage <= Math.ceil(totalLogs / itemsPerPage)) {
			dispatch('pageChange', { page: newPage });
		}
	}

    function analyzeLog(log: BrowsedLog) {
        dispatch('analyzeLog', log);
    }
</script>

<Card class="mt-6">
	<CardHeader>
		<CardTitle>Found Logs ({totalLogs})</CardTitle>
		{#if logs.length === 0 && !loading}
			<CardDescription>No logs found matching your criteria. Try broadening your search or ensure your Supabase database is populated.</CardDescription>
		{/if}
	</CardHeader>
	<CardContent>
		{#if loading}
			<p class="text-center py-4">Loading results...</p>
		{:else if logs.length > 0}
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Report Title</TableHead>
						<TableHead>Boss</TableHead>
						<TableHead>Duration</TableHead>
						<TableHead>Healer Comp.</TableHead>
						<TableHead class="text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#each logs as log (log.log_code + log.fight_id)}
						<TableRow>
							<TableCell class="font-medium max-w-xs truncate" title={log.title || log.log_code}>{log.title || log.log_code}</TableCell>
							<TableCell>{log.boss_name}</TableCell>
							<TableCell>{formatDuration(log.duration_seconds)}</TableCell>
							<TableCell class="space-x-1">
								{#each log.healer_composition as spec (spec)}
									<Badge variant="outline">{spec.replace('-', ' ')}</Badge>
								{/each}
							</TableCell>
							<TableCell class="text-right space-x-2">
                                <Button variant="outline" size="sm" on:click={() => analyzeLog(log)}>Analyze</Button>
								<a href={log.log_url} target="_blank" rel="noopener noreferrer">
                                    <Button variant="link" size="sm">View on WCL</Button>
                                </a>
							</TableCell>
						</TableRow>
					{/each}
				</TableBody>
			</Table>
			{#if totalLogs > itemsPerPage}
				<div class="flex justify-center items-center space-x-2 mt-6">
					<Button on:click={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Previous</Button>
					<span>Page {currentPage} of {Math.ceil(totalLogs / itemsPerPage)}</span>
					<Button on:click={() => handlePageChange(currentPage + 1)} disabled={currentPage * itemsPerPage >= totalLogs}>Next</Button>
				</div>
			{/if}
		{/if}
	</CardContent>
</Card>