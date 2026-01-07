<script lang="ts">
	import SEO from '../../components/seo.svelte';
	import Footer from '../../components/footer.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { bosses } from '$lib/types/bossData';
	import RecentReports from '../../components/recentReports.svelte';
	import LogBrowserFilters from '../../components/logBrowser.svelte';
	import LogBrowserResults from '../../components/logBrowserResult.svelte';
	import BossPreviewChart from '../../components/bossPreviewChart.svelte';
	import { goto } from '$app/navigation';

	let reportURL: string = '';
	let loadingFights = false;
	let error: string = '';
	let browseLoading = false;
	let browsedLogs: any[] = [];
	let totalBrowsedLogs = 0;
	let currentBrowsePage = 1;
	const browseItemsPerPage = 10;

	function handleReportSelection(code: string) {
		reportURL = `https://www.warcraftlogs.com/reports/${code}`;
		// Automatically fetch fights after setting the URL
		fetchFights();
	}

	async function fetchFights() {
		if (!reportURL.trim()) {
			error = 'Please enter a report code or URL.';
			return;
		}

		loadingFights = true;
		error = '';
		const codeToFetch = reportURL.split('#')[0].trim().split('/').pop() || reportURL;

		try {
			const response = await fetch('/api/fights', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ code: codeToFetch })
			});
			const data = await response.json();

			if (response.ok) {
				// Redirect to log page with report (keep loading state until navigation)
				await goto(`/raid/logs=${codeToFetch}`);
			} else {
				error = data.error || 'Failed to fetch fights.';
			}
		} catch (err) {
			console.error('Fetch Fights Error:', err);
			error = 'An unexpected error occurred while fetching fights.';
		} finally {
			loadingFights = false;
		}
	}

	async function handleLogSearch(event: CustomEvent) {
		browseLoading = true;
		browsedLogs = [];
		totalBrowsedLogs = 0;
		currentBrowsePage = 1;
		
		const params = { ...event.detail, page: 1, limit: browseItemsPerPage };
		try {
			const response = await fetch('/api/browse-logs', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(params)
			});
			const data = await response.json();

			if (response.ok && data.logs) {
				browsedLogs = data.logs;
				totalBrowsedLogs = data.total || 0;
			} else {
				browsedLogs = [];
				totalBrowsedLogs = 0;
			}
		} catch (err) {
			console.error('Error fetching logs:', err);
			browsedLogs = [];
			totalBrowsedLogs = 0;
		} finally {
			browseLoading = false;
		}
	}

	async function handleBrowsePageChange(event: CustomEvent<{ page: number }>) {
		// Handle page change if needed
	}

	function analyzeLogFromBrowse(log: any) {
		goto(`/raid/logs=${log.log_code}?fight=${log.fight_id}`);
	}
</script>

<SEO
	title="Raid Tools - Mr. Mythical"
	description="Visualize raid encounters, browse logs, and explore damage patterns with interactive charts and timelines."
	image="https://mrmythical.com/Logo.png"
	keywords="Raid tools, encounter visualization, log browser, damage visualization, World of Warcraft, raid planning"
/>

<main class="container mx-auto px-4 py-6">
	<section class="mx-auto mb-12 max-w-7xl">
		<div class="space-y-4 text-center">
			<h1 class="mb-4 text-4xl font-bold">Interactive Raid Visualization & Timeline Analysis</h1>
			<p class="text-lg text-muted-foreground leading-relaxed">
				Visualize your World of Warcraft raid encounters with interactive charts and timelines. 
				Watch damage patterns unfold second-by-second, explore average damage taken across encounters, 
				and analyze healing coverage with filterable ability timelines. Transform raw WarcraftLogs data 
				into clear, actionable visualizations that reveal raid dynamics at a glance.
			</p>
			<div class="grid gap-4 text-left sm:grid-cols-2 md:grid-cols-3 mt-6">
				<div class="rounded-lg border bg-card p-4">
					<h3 class="mb-2 font-semibold text-foreground">Interactive Damage Timeline</h3>
					<p class="text-sm text-muted-foreground">
						See every damage event plotted second-by-second with clickable ability markers and visual event highlighting
					</p>
				</div>
				<div class="rounded-lg border bg-card p-4">
					<h3 class="mb-2 font-semibold text-foreground">Average Damage Taken Charts</h3>
					<p class="text-sm text-muted-foreground">
						Visualize average raid damage taken with statistical bands showing variability and confidence in the data
					</p>
				</div>
				<div class="rounded-lg border bg-card p-4">
					<h3 class="mb-2 font-semibold text-foreground">Boss Encounter Previews</h3>
					<p class="text-sm text-muted-foreground">
						Quick preview charts for each boss showing damage patterns across first-kill progression logs
					</p>
				</div>
			</div>
		</div>
	</section>

	<section class="mx-auto mb-8 max-w-2xl text-center">
		<h2 class="mb-2 text-2xl font-bold">Visualize a WarcraftLogs Report</h2>
		<p class="mb-4 text-sm text-muted-foreground">
			Paste a report URL or code to view interactive damage and healing timelines.
		</p>
		<div class="space-y-2">
			<Label for="reportCodeTop">WarcraftLogs Link or Code</Label>
			<div class="flex gap-2">
				<Input
					id="reportCodeTop"
					class="flex-1"
					type="text"
					bind:value={reportURL}
					placeholder="https://www.warcraftlogs.com/reports/<reportcode>"
				/>
				<Button on:click={fetchFights} disabled={loadingFights}>
					{#if loadingFights}
						Loading...
					{:else}
						Visualize
					{/if}
				</Button>
			</div>
			{#if error && !loadingFights}
				<p class="text-sm text-destructive">{error}</p>
			{/if}
		</div>
	</section>

	<div class="mx-auto max-w-7xl">
		<div class="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
			<div class="space-y-6">
			<Card.Root class="relative overflow-hidden transition hover:shadow-lg">
				<div
					class="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 to-transparent"
				></div>
				<Card.Header>
					<div class="flex items-center gap-3">
						<div class="rounded-lg bg-primary/10 p-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 text-primary"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<Card.Title>Recent Reports</Card.Title>
					</div>
					<Card.Description>Quick access to your recently viewed reports</Card.Description>
				</Card.Header>

				<RecentReports onSelectReport={handleReportSelection} />
			</Card.Root>

				<Card.Root class="relative overflow-hidden transition hover:shadow-lg">
					<div class="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 to-transparent"></div>
					<Card.Header>
						<div class="flex items-center gap-3">
							<div class="rounded-lg bg-primary/10 p-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5 text-primary"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" />
									<path
										fill-rule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z"
										clip-rule="evenodd"
								/>
							</svg>
						</div>
						<Card.Title>Browse Logs From WarcraftLogs</Card.Title>
					</div>
					<Card.Description
						>Search and filter logs based on boss and healer composition</Card.Description
					>
					</Card.Header>
					<Card.Content class="space-y-4">
						<LogBrowserFilters on:search={handleLogSearch} loading={browseLoading} />
						<LogBrowserResults
							logs={browsedLogs}
							loading={browseLoading}
							totalLogs={totalBrowsedLogs}
							currentPage={currentBrowsePage}
							itemsPerPage={browseItemsPerPage}
							on:pageChange={handleBrowsePageChange}
							on:analyzeLog={(e) => analyzeLogFromBrowse(e.detail)}
						/>
					</Card.Content>
				</Card.Root>
			</div>

			<Card.Root class="relative overflow-hidden transition hover:shadow-lg mx-auto w-full max-w-md">
				<div class="absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 to-transparent"></div>
				<Card.Header>
					<div class="flex items-center gap-3">
						<div class="rounded-lg bg-primary/10 p-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-5 w-5 text-primary"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path d="M9 9a2 2 0 114 0 2 2 0 01-4 0z" />
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a4 4 0 00-3.446 6.032l-2.261 2.26a1 1 0 101.414 1.415l2.261-2.261A4 4 0 1011 5z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>
						<Card.Title>Damage Visualization by Boss</Card.Title>
					</div>
					<Card.Description>Interactive damage patterns and timelines for each encounter</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="grid grid-cols-1 gap-2">
						{#each bosses as boss (boss.id)}
							<a
								href={`/raid/boss/${boss.slug}`}
								class="group relative overflow-hidden rounded-lg border bg-card p-3 transition hover:shadow-lg hover:border-primary"
							>
								<div
									class="absolute inset-0 -z-10 bg-gradient-to-br from-purple-500/5 to-transparent group-hover:from-purple-500/10 transition"
								></div>
							<div class="mb-2 flex h-32 items-center justify-center rounded-lg bg-muted/50 group-hover:bg-muted transition overflow-hidden">
								<BossPreviewChart bossId={boss.id} />
								</div>
								<h3 class="text-sm font-semibold text-foreground group-hover:text-primary transition">
									{boss.name}
								</h3>
								<p class="text-xs text-muted-foreground">View patterns</p>
							</a>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>
			</div>
			</div>
</main>

<Footer />
