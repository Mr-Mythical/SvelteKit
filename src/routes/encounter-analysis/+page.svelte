<script lang="ts">
	import type {
		Fight,
		CastEvent,
		Series,
		Player,
		ReportOwner,
		ReportGuild,
		BrowsedLog,
		BrowseLogsParams
	} from '$lib/types/apiTypes';
	import DamageChart from '../../components/damageChart.svelte';
	import SEO from '../../components/seo.svelte';
	import Footer from '../../components/footer.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import RecentReports from '../../components/recentReports.svelte';
	import { recentReports as recentReportsStore } from '$lib/utils/recentReports';

	import LogBrowserFilters from '../../components/logBrowser.svelte';
	import LogBrowserResults from '../../components/logBrowserResult.svelte';
	import { goto } from '$app/navigation';
	import { page as pageStore } from '$app/stores';
	import { onMount } from 'svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Tabs from '$lib/components/ui/tabs';
	import EncounterSkeleton from '../../components/skeletons/encounterSkeleton.svelte';

	let reportURL: string = '';
	let fights: Fight[] = [];
	let selectedFight: Fight | null = null;
	let damageEvents: Series[] = [];
	let healingEvents: Series[] = [];
	let castEvents: CastEvent[] = [];
	let bossEvents: CastEvent[] = [];
	let allHealers: Player[] = [];
	let error: string = '';
	let loadingFights = false;
	let loadingData = false;
	let killsOnly = false;
	let showFightSelection = true;

	let reportTitle: string | undefined;
	let reportOwner: ReportOwner | undefined;
	let reportGuild: ReportGuild | undefined;

	let browsedLogs: BrowsedLog[] = [];
	let browseLoading = false;
	let totalBrowsedLogs = 0;
	let currentBrowsePage = 1;
	const browseItemsPerPage = 10;
	let lastBrowseParams: BrowseLogsParams | null = null;

	const difficultyMap: Record<number, string> = {
		2: 'Raid Finder',
		3: 'Normal',
		4: 'Heroic',
		5: 'Mythic'
	};

	$: groupedFights = groupFightsByNameAndDifficulty(
		killsOnly ? fights.filter((fight) => fight.kill) : fights
	);

	let initialReportCodeFromUrl: string | null = null;
	let initialFightIdFromUrl: number | null = null;

	onMount(async () => {
		const urlParams = $pageStore.url.searchParams;
		initialReportCodeFromUrl = urlParams.get('report');
		const fightIdParam = urlParams.get('fight');
		initialFightIdFromUrl = fightIdParam ? parseInt(fightIdParam, 10) : null;

		if (initialReportCodeFromUrl) {
			reportURL = `https://www.warcraftlogs.com/reports/${initialReportCodeFromUrl}`;
			await fetchFights();

			if (initialFightIdFromUrl && fights.length > 0) {
				const fightToSelect = fights.find((f) => f.id === initialFightIdFromUrl);
				if (fightToSelect) {
					await handleFightSelection(fightToSelect);
				}
			}
		}
	});

	function extractReportCode(reportString: string): string {
		try {
			const url = new URL(reportString);
			const pathParts = url.pathname.split('/').filter(Boolean);
			if (pathParts.length > 1 && pathParts[0] === 'reports') {
				return pathParts[1];
			}
		} catch (err) {}
		return reportString.split('#')[0].trim();
	}

	function handleReportSelection(code: string) {
		reportURL = `https://www.warcraftlogs.com/reports/${code}`;
		resetForNewReport();
		fetchFights();
	}

	function resetForNewReport() {
		selectedFight = null;
		fights = [];
		showFightSelection = true;
		resetEvents();
		resetLogBrowser();
	}

	// URL management functions
	function updateUrlParams(reportCode: string | null = null, fightId: number | null = null) {
		const url = new URL(window.location.href);

		if (reportCode) {
			url.searchParams.set('report', reportCode);
		} else {
			url.searchParams.delete('report');
		}

		if (fightId) {
			url.searchParams.set('fight', fightId.toString());
		} else {
			url.searchParams.delete('fight');
		}

		goto(url.pathname + url.search, { replaceState: true });
	}

	function clearUrlParams() {
		const url = new URL(window.location.href);
		url.searchParams.delete('report');
		url.searchParams.delete('fight');
		goto(url.pathname + url.search, { replaceState: true });
	}

	async function fetchFights() {
		if (!reportURL.trim()) {
			error = 'Please enter a report code or URL.';
			resetForNewReport();
			return;
		}

		loadingFights = true;
		resetForNewReport();
		error = '';
		const codeToFetch = extractReportCode(reportURL.trim());
		try {
			const response = await fetch('/api/fights', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ code: codeToFetch })
			});
			const data = await response.json();

			if (response.ok) {
				reportTitle = data.title;
				reportOwner = data.owner;
				reportGuild = data.guild;
				fights = data.fights.filter((fight: Fight) => fight.difficulty !== null);
				if (fights.length === 0) {
					error = 'No suitable fights found for the provided report code.';
				} else {
					await recentReportsStore.addReport(codeToFetch, reportTitle!, reportGuild, reportOwner!);
					// Update URL with report code (but no fight selected yet)
					updateUrlParams(codeToFetch, null);
				}
				showFightSelection = true;
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

	async function handleFightSelection(fight: Fight) {
		const codeToFetch = extractReportCode(reportURL.trim());
		selectedFight = fight;
		resetEvents();
		error = '';
		loadingData = true;
		showFightSelection = false;

		// Update URL with fight parameter
		updateUrlParams(codeToFetch, fight.id);

		try {
			const [damageResponse, healingResponse, castResponse, bossResponse, playerDetailsResponse] =
				await Promise.all([
					fetch('/api/damage-events', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							fightID: fight.id,
							code: codeToFetch,
							startTime: fight.startTime,
							endTime: fight.endTime
						})
					}),
					fetch('/api/healing-events', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							fightID: fight.id,
							code: codeToFetch,
							startTime: fight.startTime,
							endTime: fight.endTime
						})
					}),
					fetch('/api/cast-events', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							fightID: fight.id,
							code: codeToFetch,
							startTime: fight.startTime,
							endTime: fight.endTime
						})
					}),
					fetch('/api/boss-events', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							fightID: fight.id,
							code: codeToFetch,
							startTime: fight.startTime,
							endTime: fight.endTime
						})
					}),
					fetch('/api/player-details', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							code: codeToFetch,
							fightID: fight.id
						})
					})
				]);

			const damageData = await damageResponse.json();
			const healingData = await healingResponse.json();
			const castData = await castResponse.json();
			const bossData = await bossResponse.json();
			const playerDetailsData = await playerDetailsResponse.json();

			if (
				damageResponse.ok &&
				healingResponse.ok &&
				castResponse.ok &&
				bossResponse.ok &&
				playerDetailsResponse.ok
			) {
				damageEvents = damageData.seriesData || [];
				healingEvents = healingData.seriesData || [];
				castEvents = castData.castEvents || [];
				bossEvents = bossData.castEvents || [];
				allHealers = playerDetailsData.healerData || [];

				if (
					damageEvents.length === 0 &&
					healingEvents.length === 0 &&
					castEvents.length === 0 &&
					bossEvents.length === 0
				) {
					error = 'No data found for the selected fight.';
				}
			} else {
				error = 'Failed to fetch some data for the selected fight. Check console for details.';
				console.error({ damageData, healingData, castData, bossData, playerDetailsData });
			}
		} catch (err) {
			console.error('Fetch Events Error:', err);
			error = 'An unexpected error occurred while fetching fight data.';
		} finally {
			loadingData = false;
		}
	}

	function goBackToFightSelection() {
		selectedFight = null;
		showFightSelection = true;
		resetEvents();
		resetLogBrowser();
		// Remove fight parameter but keep report parameter
		const currentReport = extractReportCode(reportURL.trim());
		updateUrlParams(currentReport, null);
	}

	function goBackToReportInput() {
		reportURL = '';
		resetForNewReport();
		resetLogBrowser();
		showFightSelection = true;
		error = '';
		reportTitle = undefined;
		reportOwner = undefined;
		reportGuild = undefined;
		// Clear all URL parameters when going back to report input
		clearUrlParams();
	}

	async function handleLogSearch(event: CustomEvent<BrowseLogsParams>) {
		browseLoading = true;
		browsedLogs = [];
		totalBrowsedLogs = 0;
		currentBrowsePage = 1;
		lastBrowseParams = event.detail;
		await fetchAndSetBrowsedLogs(event.detail, 1);
	}

	async function handleBrowsePageChange(event: CustomEvent<{ page: number }>) {
		if (!lastBrowseParams) return;
		currentBrowsePage = event.detail.page;
		await fetchAndSetBrowsedLogs(lastBrowseParams, currentBrowsePage);
	}

	async function fetchAndSetBrowsedLogs(params: BrowseLogsParams, pageNum: number) {
		browseLoading = true;
		const fetchParams = { ...params, page: pageNum, limit: browseItemsPerPage };
		console.log('Fetching browsed logs with params:', JSON.stringify(fetchParams, null, 2));
		try {
			const response = await fetch('/api/browse-logs', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(fetchParams)
			});
			const responseText = await response.text();

			if (response.ok) {
				const data = JSON.parse(responseText);
				if (data.logs) {
					browsedLogs = data.logs;
					totalBrowsedLogs = data.total || 0;
				} else {
					console.error('API response OK, but no logs array:', data);
					browsedLogs = [];
					totalBrowsedLogs = 0;
				}
			} else {
				console.error(
					'Failed to fetch browsed logs (response not OK):',
					response.status,
					responseText
				);
				error = `API Error ${response.status}: ${JSON.parse(responseText).error || 'Unknown API error'}`;
				browsedLogs = [];
				totalBrowsedLogs = 0;
			}
		} catch (err) {
			console.error('Error in fetchAndSetBrowsedLogs (catch block):', err);
			error = 'Network error or API unavailable while Browse logs.';
			browsedLogs = [];
			totalBrowsedLogs = 0;
		} finally {
			browseLoading = false;
		}
	}

	let loadingLogFromBrowse = false;

	async function analyzeLogFromBrowse(logToAnalyze: BrowsedLog) {
		loadingLogFromBrowse = true;
		loadingData = true;
		showFightSelection = false;

		try {
			reportURL = `https://www.warcraftlogs.com/reports/${logToAnalyze.log_code}`;

			await goto(
				`/encounter-analysis?report=${logToAnalyze.log_code}&fight=${logToAnalyze.fight_id}`,
				{
					replaceState: true
				}
			);

			await fetchFights();

			const fightToSelect = fights.find((f) => f.id === logToAnalyze.fight_id);
			if (fightToSelect) {
				await handleFightSelection(fightToSelect);
			} else {
				throw new Error('Fight not found in report');
			}
		} catch (err) {
			console.error('Error analyzing log:', err);
			error = 'Failed to load the selected fight.';
		} finally {
			loadingLogFromBrowse = false;
		}
	}

	function groupFightsByNameAndDifficulty(fights: Fight[]) {
		return fights.reduce(
			(grouped, fight) => {
				grouped[fight.name] = grouped[fight.name] || {};
				grouped[fight.name][fight.difficulty] = grouped[fight.name][fight.difficulty] || [];
				grouped[fight.name][fight.difficulty].push(fight);
				return grouped;
			},
			{} as Record<string, Record<number, Fight[]>>
		);
	}

	function formatDuration(start: number, end: number): string {
		const duration = Math.floor((end - start) / 1000);
		const minutes = Math.floor(duration / 60);
		const seconds = duration % 60;
		return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
	}

	function resetEvents() {
		damageEvents = [];
		healingEvents = [];
		castEvents = [];
		bossEvents = [];
		allHealers = [];
	}

	function resetLogBrowser() {
		browsedLogs = [];
		browseLoading = false;
		totalBrowsedLogs = 0;
		currentBrowsePage = 1;
		lastBrowseParams = null;
	}

	let activeTab = 'manual';
	let showFilters = false;

	$: if (!loadingData && damageEvents.length > 0 && allHealers.length > 0 && selectedFight) {
		handleLogSearch(
			new CustomEvent<BrowseLogsParams>('search', {
				detail: {
					bossId: selectedFight.encounterID,
					healerSpecs: allHealers.map((healer) => `${healer.type}-${healer.specs[0]?.spec}`)
				}
			})
		);
	}
</script>

<SEO
	title="Raid Encounter Healing Analysis & Log Browser - Mr. Mythical"
	description="Analyze raid encounters from Warcraft Logs. Input manual logs or browse the top logs filtered by healer compositions. Detailed damage, healing graphs, and ability overlays for deeper insights."
	image="https://mrmythical.com/Logo.png"
	keywords="Raid analysis, Raid analyzer, Encounter analysis, healing analysis, Warcraft Logs, World of Warcraft, wow raids, cooldown planning, boss tactics, raid leading, damage graphs, healing graphs, raid performance, ability overlays"
/>

<main class="container mx-auto px-4 py-8">
	{#if loadingLogFromBrowse || (selectedFight && loadingData)}
		<EncounterSkeleton />
	{:else if !selectedFight && reportURL && fights.length > 0}
		<div class="mt-8 flex flex-col gap-8">
			<div class="mt-4 flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold">{reportTitle || 'Report Details'}</h1>
					{#if reportGuild?.name}
						<h2 class="text-xl font-semibold text-muted-foreground">Guild: {reportGuild.name}</h2>
					{/if}
					{#if reportOwner?.name}
						<p class="text-sm text-muted-foreground">Uploaded by: {reportOwner.name}</p>
					{/if}
				</div>
				<div class="flex items-center gap-4">
					<Label class="flex items-center space-x-2">
						<span class="text-sm">Kills only</span>
						<input type="checkbox" bind:checked={killsOnly} class="toggle toggle-primary" />
					</Label>
					<Button on:click={goBackToReportInput} variant="outline">Load Different Report</Button>
				</div>
			</div>

			{#each Object.entries(groupedFights) as [name, difficulties]}
				<div class="mb-8 overflow-hidden rounded-xl border bg-card shadow-lg">
					<div class="border-b bg-muted/30 px-6 py-4">
						<h2 class="text-2xl font-bold tracking-tight">{name}</h2>
					</div>
					{#each Object.entries(difficulties) as [difficulty, difficultyFights]}
						<div class="p-4">
							<h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-primary">
								<span class="flex h-2 w-2 rounded-full bg-primary"></span>
								{difficultyMap[Number(difficulty)]}
							</h3>
							<div class="grid gap-3 md:grid-cols-2">
								{#each difficultyFights.filter((f) => f.kill === true || f.kill === null) as fight (fight.id)}
									<Button
										on:click={() => handleFightSelection(fight)}
										variant="outline"
										class="relative flex h-auto w-full flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all hover:scale-[1.02] hover:bg-accent hover:shadow-md"
									>
										<span class="flex-grow">
											{fight.kill ? 'Kill' : fight.bossPercentage != null ? 'Wipe' : 'Attempt'} - {formatDuration(
												fight.startTime,
												fight.endTime
											)}
										</span>
										{#if fight.bossPercentage != null}
											<div
												class="mx-2 flex h-2 w-1/4 flex-shrink-0 overflow-hidden rounded-md bg-muted"
											>
												<div
													class="h-full {fight.kill ? 'bg-green-500' : 'bg-red-500'}"
													style="width: {100 - fight.bossPercentage}%;"
												></div>
											</div>
											<span class="w-10 flex-shrink-0 text-right text-sm">
												{fight.kill ? `0%` : `${fight.bossPercentage}%`}
											</span>
										{/if}
									</Button>
								{/each}
								{#if !killsOnly}
									{#each difficultyFights.filter((f) => f.kill === false) as fight, index (fight.id)}
										<Button
											on:click={() => handleFightSelection(fight)}
											variant="outline"
											class="relative flex w-full items-center justify-between rounded-md p-3 text-left shadow-sm hover:bg-accent"
										>
											<span class="flex-grow">
												Wipe {index + 1} - {formatDuration(fight.startTime, fight.endTime)}
											</span>
											{#if fight.bossPercentage != null}
												<div
													class="mx-2 flex h-2 w-1/4 flex-shrink-0 overflow-hidden rounded-md bg-muted"
												>
													<div
														class="h-full bg-destructive"
														style="width: {100 - fight.bossPercentage}%;"
													></div>
												</div>
												<span class="w-10 flex-shrink-0 text-right text-sm">
													{fight.bossPercentage}%
												</span>
											{/if}
										</Button>
									{/each}
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/each}
		</div>
	{:else if selectedFight}
		<div class="mb-6 space-y-8">
			<div
				class="sticky top-0 z-50 -mx-4 mb-6 bg-background/80 px-4 py-4 backdrop-blur-lg md:-mx-6 md:px-6 lg:-mx-8 lg:px-8"
			>
				<div class="flex flex-col items-center justify-between gap-4 md:flex-row">
					<div class="text-center md:text-left">
						<div class="flex items-center gap-3">
							<h1 class="text-3xl font-bold tracking-tight">
								{selectedFight.name}
							</h1>
							<span class="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
								{difficultyMap[Number(selectedFight.difficulty)]}
							</span>
							<span
								class={`rounded-full px-3 py-1 text-sm font-medium ${selectedFight.kill ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}
							>
								{selectedFight.kill ? 'Kill' : `${selectedFight.bossPercentage}% Wipe`}
							</span>
						</div>
						<p class="mt-1 text-sm text-muted-foreground">
							Duration: {formatDuration(selectedFight.startTime, selectedFight.endTime)}
						</p>
					</div>
					<div class="flex gap-4">
						<Button on:click={goBackToFightSelection} variant="outline" class="gap-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
									clip-rule="evenodd"
								/>
							</svg>
							Back to Fights
						</Button>
						<Button on:click={goBackToReportInput} variant="outline" class="gap-2">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
									clip-rule="evenodd"
								/>
							</svg>
							Back to Start
						</Button>
					</div>
				</div>
			</div>

			{#if loadingData}
				<EncounterSkeleton />
			{:else if damageEvents.length > 0 || healingEvents.length > 0}
				<DamageChart
					{damageEvents}
					{healingEvents}
					{castEvents}
					{bossEvents}
					{allHealers}
					encounterId={selectedFight.encounterID}
				/>

				<div class="mt-8">
					<h2 class="text-center text-2xl font-bold">
						More {selectedFight.name} logs with the same healers
					</h2>

					<LogBrowserResults
						logs={browsedLogs}
						loading={browseLoading}
						totalLogs={totalBrowsedLogs}
						currentPage={currentBrowsePage}
						itemsPerPage={browseItemsPerPage}
						on:pageChange={handleBrowsePageChange}
						on:analyzeLog={(e) => analyzeLogFromBrowse(e.detail)}
					/>

					<Separator />
					<div class="pt-2">
						<Button
							variant="ghost"
							class="w-full justify-between"
							on:click={() => (showFilters = !showFilters)}
						>
							<span>Refine Search</span>
							<span class="text-xs">▼</span>
						</Button>

						{#if showFilters}
							<div class="mt-4">
								<LogBrowserFilters
									on:search={handleLogSearch}
									loading={browseLoading}
									initialBossId={selectedFight.encounterID}
									initialHealerSpecs={allHealers.map(
										(healer) => `${healer.type}-${healer.specs[0]?.spec}`
									)}
								/>
							</div>
						{/if}
					</div>
				</div>
			{:else}
				<p class="py-10 text-center text-destructive">
					{error || 'No analysis data found for this fight.'}
				</p>
			{/if}
		</div>
	{:else}
		<div class="mb-6 text-center">
			<h1 class="mb-2 text-4xl font-bold">Encounter Analysis</h1>
			<p class="text-lg text-muted-foreground">
				Load a specific log or browse community logs to analyze healing performance
			</p>
		</div>

		<div class="mx-auto max-w-6xl space-y-6">
			<div class="grid gap-6 lg:grid-cols-2">
				<Card.Root class="relative overflow-hidden transition hover:shadow-lg">
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
										d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586L7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z"
										clip-rule="evenodd"
									/>
								</svg>
							</div>
							<Card.Title>Load a Specific Report</Card.Title>
						</div>
						<Card.Description>
							Enter a WarcraftLogs report URL or code to analyze specific fights
						</Card.Description>
					</Card.Header>
					<Card.Content>
						<div class="space-y-4">
							<div class="space-y-2">
								<Label for="reportCode">WarcraftLogs Link or Code</Label>
								<Input
									type="text"
									id="reportCode"
									bind:value={reportURL}
									placeholder="https://www.warcraftlogs.com/reports/<reportcode>"
								/>
							</div>
							<Button class="w-full" on:click={fetchFights} disabled={loadingFights}>
								{#if loadingFights}
									Loading...
								{:else}
									Fetch Fights
								{/if}
							</Button>
							{#if error && !loadingFights && !selectedFight && fights.length === 0}
								<p class="mt-2 text-sm text-destructive">{error}</p>
							{/if}
						</div>
					</Card.Content>
				</Card.Root>

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
			</div>

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
				<Card.Content class="space-y-6">
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
	{/if}
</main>

<Footer />
