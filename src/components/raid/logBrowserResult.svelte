<script lang="ts">
	import type { BrowsedLog } from '$lib/types/apiTypes';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';

	interface Props {
		logs?: BrowsedLog[];
		loading?: boolean;
		totalLogs?: number;
		currentPage?: number;
		itemsPerPage?: number;
		title?: string;
		description?: string;
		cardClass?: string;
		titleClass?: string;
		bare?: boolean;
		onpageChange?: (detail: { page: number }) => void;
		onanalyzeLog?: (log: BrowsedLog) => void;
	}

	let {
		logs = [],
		loading = false,
		totalLogs = 0,
		currentPage = 1,
		itemsPerPage = 10,
		title = `Found Logs (${totalLogs})`,
		description,
		cardClass = 'mt-6',
		titleClass = '',
		bare = false,
		onpageChange,
		onanalyzeLog
	}: Props = $props();

	function formatDuration(seconds: number): string {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}m ${remainingSeconds}s`;
	}

	function handlePageChange(newPage: number) {
		if (newPage > 0 && newPage <= Math.ceil(totalLogs / itemsPerPage)) {
			onpageChange?.({ page: newPage });
		}
	}

	function analyzeLog(log: BrowsedLog) {
		onanalyzeLog?.(log);
	}
</script>

{#snippet ResultsContent()}
	{#if loading}
		<p class="py-4 text-center">Loading results...</p>
	{:else if logs.length > 0}
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Boss</TableHead>
					<TableHead>Duration</TableHead>
					<TableHead>Healer Comp</TableHead>
					<TableHead class="text-right">Actions</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each logs as log (log.log_code + log.fight_id)}
					<TableRow>
						<TableCell>{log.boss_name}</TableCell>
						<TableCell>{formatDuration(log.duration_seconds)}</TableCell>
						<TableCell class="space-x-1">
							{#each log.healer_composition as spec, index (spec + index)}
								<Badge variant="outline">{spec.replace('-', ' ')}</Badge>
							{/each}
						</TableCell>
						<TableCell class="space-x-2 text-right">
							<Button variant="outline" size="sm" onclick={() => analyzeLog(log)}>Analyze</Button>
							<a href={log.log_url} target="_blank" rel="noopener noreferrer">
								<Button variant="link" size="sm">View on WCL</Button>
							</a>
						</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
		{#if totalLogs > itemsPerPage}
			<div class="mt-6 flex items-center justify-center space-x-2">
				<Button onclick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
					>Previous</Button
				>
				<span>Page {currentPage} of {Math.ceil(totalLogs / itemsPerPage)}</span>
				<Button
					onclick={() => handlePageChange(currentPage + 1)}
					disabled={currentPage * itemsPerPage >= totalLogs}>Next</Button
				>
			</div>
		{/if}
	{:else if !description}
		<p class="text-muted-foreground py-4 text-center">
			No logs found matching your criteria. Try broadening your search.
		</p>
	{/if}
{/snippet}

{#if bare}
	{#if description}
		<div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
			<div>
				<h3 class={titleClass || 'text-xl font-semibold'}>{title}</h3>
				<p class="text-muted-foreground text-sm">{description}</p>
			</div>
			<p class="text-muted-foreground text-sm">{totalLogs} total logs</p>
		</div>
	{/if}
	<div class={description ? 'mt-4' : ''}>
		{@render ResultsContent()}
	</div>
{:else}
	<Card class={cardClass}>
		<CardHeader>
			<CardTitle class={titleClass}>{title}</CardTitle>
			{#if description}
				<CardDescription>{description}</CardDescription>
			{:else if logs.length === 0 && !loading}
				<CardDescription
					>No logs found matching your criteria. Try broadening your search.</CardDescription
				>
			{/if}
		</CardHeader>
		<CardContent>
			{@render ResultsContent()}
		</CardContent>
	</Card>
{/if}
