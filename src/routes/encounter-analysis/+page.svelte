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
	import Header from '../../components/header.svelte';
	import SEO from '../../components/seo.svelte';
	import Footer from '../../components/footer.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import RecentReports from '../../components/recentReports.svelte';
	import { recentReports as recentReportsStore } from '$lib/utils/recentReports';

	import LogBrowserFilters from '../../components/logBrowser.svelte';
	import LogBrowserResults from '../../components/logBrowserResult.svelte';
	import { goto } from '$app/navigation';
	import { page as pageStore } from '$app/stores';
	import { onMount } from 'svelte';

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

	onMount(() => {
		const urlParams = $pageStore.url.searchParams;
		initialReportCodeFromUrl = urlParams.get('report');
		const fightIdParam = urlParams.get('fight');
		initialFightIdFromUrl = fightIdParam ? parseInt(fightIdParam, 10) : null;

		if (initialReportCodeFromUrl) {
			reportURL = `https://www.warcraftlogs.com/reports/${initialReportCodeFromUrl}`;
			fetchFights().then(() => {
				if (initialFightIdFromUrl && fights.length > 0) {
					const fightToSelect = fights.find((f) => f.id === initialFightIdFromUrl);
					if (fightToSelect) {
						handleFightSelection(fightToSelect);
					}
				}
			});
		}
	});

	function extractReportCode(reportString: string): string {
		try {
			const url = new URL(reportString);
			const pathParts = url.pathname.split('/').filter(Boolean);
			if (pathParts.length > 1 && pathParts[0] === 'reports') {
				return pathParts[1];
			}
		} catch (err) {
		}
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
					recentReportsStore.addReport(codeToFetch, reportTitle!, reportGuild, reportOwner!);
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
	}

	function goBackToReportInput() {
		reportURL = '';
		resetForNewReport();
		showFightSelection = true; 
		error = '';
		reportTitle = undefined;
		reportOwner = undefined;
		reportGuild = undefined;
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

	function analyzeLogFromBrowse(logToAnalyze: BrowsedLog) {
		reportURL = `https://www.warcraftlogs.com/reports/${logToAnalyze.log_code}`;
		goto(`/encounter-analysis?report=${logToAnalyze.log_code}&fight=${logToAnalyze.fight_id}`);
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
</script>

<SEO
	title="Raid Encounter Analysis & Log Browser - Mr. Mythical"
	description="Analyze raid encounters from Warcraft Logs or browse community logs. Detailed damage, healing graphs, and ability overlays for deeper insights."
	image="https://mrmythical.com/Logo.png"
	keywords="Raid analysis, Log browser, Encounter analysis, Warcraft Logs, World of Warcraft, damage graphs, healing graphs, raid performance, ability overlays"
/>

<Header />

<main class="container mx-auto space-y-8 p-4 md:p-6 lg:p-8">
	{#if !selectedFight && reportURL && fights.length > 0}
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
				<div class="mb-6 rounded-lg border p-4 shadow">
					<h2 class="mb-3 text-xl font-bold">{name}</h2>
					{#each Object.entries(difficulties) as [difficulty, difficultyFights]}
						<div class="mt-2">
							<h3 class="text-lg font-semibold text-primary">
								{difficultyMap[Number(difficulty)]}
							</h3>
							<div class="mt-1 space-y-2">
								{#each difficultyFights.filter((f) => f.kill === true || f.kill === null) as fight (fight.id)}
									<Button
										on:click={() => handleFightSelection(fight)}
										variant="outline"
										class="relative flex w-full items-center justify-between rounded-md p-3 text-left shadow-sm hover:bg-accent"
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
		<div class="mb-6">
			<div class="mb-6 text-center">
				<h1 class="text-3xl font-bold">
					{difficultyMap[Number(selectedFight.difficulty)]}
					{selectedFight.name}
					({selectedFight.kill ? 'Kill' : `Wipe at ${selectedFight.bossPercentage}%`})
				</h1>
				<p class="text-muted-foreground">
					Duration: {formatDuration(selectedFight.startTime, selectedFight.endTime)}
				</p>
				<Button on:click={goBackToFightSelection} variant="outline" class="mt-4"
					>Back to Fight Selection</Button
				>
			</div>
			{#if loadingData}
				<p class="py-10 text-center">Loading detailed fight data...</p>
			{:else if damageEvents.length > 0 || healingEvents.length > 0}
				<DamageChart
					{damageEvents}
					{healingEvents}
					{castEvents}
					{bossEvents}
					{allHealers}
					encounterId={selectedFight.encounterID}
				/>
			{:else}
				<p class="py-10 text-center text-destructive">
					{error || 'No analysis data found for this fight.'}
				</p>
			{/if}
		</div>
	{:else}
		<div class="mb-10 text-center">
			<h1 class="mb-2 text-4xl font-bold">Encounter Analysis</h1>
			<p class="text-lg text-muted-foreground">
				Enter a WarcraftLogs report URL/code to analyze fights, or browse community logs below.
			</p>
		</div>
		<div class="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
			<div class="space-y-4 rounded-lg border p-6 shadow-lg">
				<h2 class="mb-3 text-2xl font-semibold">Load a Report</h2>
				<Label class="block text-sm font-medium" for="reportCode"
					>Enter WarcraftLogs link or Code:</Label
				>
				<Input
					class="w-full"
					type="text"
					id="reportCode"
					bind:value={reportURL}
					placeholder="https://www.warcraftlogs.com/reports/<reportcode>"
				/>
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
			<div class="rounded-lg border p-6 shadow-lg">
				<h2 class="mb-3 text-2xl font-semibold">Recent Reports</h2>
				<RecentReports onSelectReport={handleReportSelection} />
			</div>
		</div>
	{/if}

	<section aria-labelledby="log-browser-heading" class="mt-12 border-t pt-8">
		<h2 id="log-browser-heading" class="mb-6 text-center text-3xl font-bold">
			Browse Community Logs
		</h2>
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
	</section>
</main>

<Footer />
