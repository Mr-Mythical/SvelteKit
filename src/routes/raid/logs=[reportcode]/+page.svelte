<script lang="ts">
	import type {
		Fight,
		CastEvent,
		DeathEvent,
		BossAbility,
		Series,
		Player,
		ReportOwner,
		ReportGuild,
		BrowsedLog,
		BrowseLogsParams
	} from '$lib/types/apiTypes';
	import DamageChart from '../../../components/charts/damageChart.svelte';
	import LogBrowserFilters from '../../../components/raid/logBrowser.svelte';
	import LogBrowserResults from '../../../components/raid/logBrowserResult.svelte';
	import SEO from '../../../components/seo.svelte';
	import Footer from '../../../components/layout/footer.svelte';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import { recentReports as recentReportsStore } from '$lib/stores/recentReports';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import EncounterSkeleton from '../../../components/skeletons/encounterSkeleton.svelte';
	import { logClientError } from '$lib/clientLog';
	import { bosses } from '$lib/types/bossData';
	import { getClassColor } from '$lib/ui/classColors';

	let reportURL: string = $state('');
	let fights: Fight[] = $state([]);
	let selectedFight: Fight | null = $state(null);
	let damageEvents: Series[] = $state([]);
	let healingEvents: Series[] = $state([]);
	let castEvents: CastEvent[] = $state([]);
	let bossEvents: CastEvent[] = $state([]);
	let deathEvents: DeathEvent[] = $state([]);
	let bossAbilities: BossAbility[] = $state([]);
	let allHealers: Player[] = $state([]);
	let error: string = $state('');
	let loadingFights = false;
	let loadingData = $state(false);
	let loadingAverageSummary = $state(false);
	let loadingSimilarLogs = $state(false);
	let killsOnly = $state(false);
	let showFightSelection = true;
	let initializing = $state(false);
	let averageDamageSummary: {
		peakAverageDamage: number;
		peakAverageTime: number;
		fightPeakDamage: number;
		fightPeakTime: number;
	} | null = $state(null);
	let averageDamageTimeline: { time_seconds: number; avg: number }[] = $state([]);
	let similarLogs: BrowsedLog[] = $state([]);
	let totalSimilarLogs = $state(0);
	let currentSimilarPage = $state(1);
	const similarLogsItemsPerPage = 5;

	interface AverageRecord {
		time_seconds: number;
		avg: number;
		std: number;
		n: number;
		ci: number;
		encounter_id: number;
	}

	let reportTitle: string | undefined = $state();
	let reportOwner: ReportOwner | undefined = $state();
	let reportGuild: ReportGuild | undefined = $state();

	const difficultyMap: Record<number, string> = {
		2: 'Raid Finder',
		3: 'Normal',
		4: 'Heroic',
		5: 'Mythic'
	};

	let initialReportCodeFromUrl: string | null = null;
	let initialFightIdFromUrl: number | null = null;

	function getCache<T>(key: string): T | null {
		try {
			const raw = localStorage.getItem(key);
			if (!raw) return null;
			const parsed = JSON.parse(raw);
			if (!parsed || typeof parsed !== 'object') return null;
			const { ts, ttl, value } = parsed as { ts: number; ttl: number; value: T };
			if (!ts || !ttl) return null;
			if (Date.now() - ts > ttl) {
				localStorage.removeItem(key);
				return null;
			}
			return value;
		} catch {
			return null;
		}
	}

	function setCache<T>(key: string, value: T, ttlMs: number) {
		try {
			localStorage.setItem(key, JSON.stringify({ ts: Date.now(), ttl: ttlMs, value }));
		} catch {
			// ignore storage failures
		}
	}

	function getFightHealerSpecs(players: Player[]): string[] {
		return [
			...new Set(
				players
					.map((player) => {
						const spec = player.specs?.[0]?.spec;
						return spec ? `${player.type}-${spec}` : null;
					})
					.filter((value): value is string => Boolean(value))
			)
		];
	}

	function buildBrowseLogsCacheKey(params: BrowseLogsParams) {
		const sortedSpecs = [...(params.healerSpecs ?? [])].sort();
		return `browse-logs:${params.bossId ?? 'any'}:${params.minDuration ?? 'none'}:${params.maxDuration ?? 'none'}:${params.page ?? 1}:${params.limit ?? similarLogsItemsPerPage}:${sortedSpecs.join(',')}`;
	}

	function formatTimeFromSeconds(totalSeconds: number) {
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = Math.floor(totalSeconds % 60);
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}

	function formatDamageValue(value: number) {
		if (value >= 1000000) return `${(value / 1000000).toFixed(2)}M`;
		if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
		return Math.round(value).toLocaleString();
	}

	function formatRelativeTimestamp(timestamp: number) {
		if (!damageEvents[0]) return '0:00';
		const totalSeconds = Math.max(0, Math.round((timestamp - damageEvents[0].pointStart) / 1000));
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}

	let selectedBoss = $derived.by(() => {
		const encounterId = selectedFight?.encounterID;
		if (encounterId == null) return null;
		return bosses.find((boss) => boss.id === encounterId) ?? null;
	});
	let selectedFightHealerSpecs = $derived(selectedFight ? getFightHealerSpecs(allHealers) : []);
	let damageChartExtraProps = $derived({ averageDamageLine: averageDamageTimeline } as Record<
		string,
		{ time_seconds: number; avg: number }[]
	>);
	let sortedDeathEvents = $derived([...deathEvents].sort((a, b) => a.timestamp - b.timestamp));

	onMount(async () => {
		const params = page.params as { reportcode?: string };
		initialReportCodeFromUrl = params?.reportcode ?? null;

		const urlParams = page.url.searchParams;
		const fightIdParam = urlParams.get('fight');
		initialFightIdFromUrl = fightIdParam ? parseInt(fightIdParam, 10) : null;

		if (initialReportCodeFromUrl) {
			initializing = true;
			reportURL = `https://www.warcraftlogs.com/reports/${initialReportCodeFromUrl}`;
			await fetchFights();

			if (initialFightIdFromUrl && fights.length > 0) {
				const fightToSelect = fights.find((f) => f.id === initialFightIdFromUrl);
				if (fightToSelect) {
					await handleFightSelection(fightToSelect);
				}
			}
			initializing = false;
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
		averageDamageSummary = null;
		similarLogs = [];
		totalSimilarLogs = 0;
	}

	// URL management functions
	function updateUrlParams(reportCode: string | null = null, fightId: number | null = null) {
		const url = new URL(window.location.href);
		const code = reportCode ?? (page.params as { reportcode?: string }).reportcode ?? '';

		if (fightId) {
			url.searchParams.set('fight', fightId.toString());
		} else {
			url.searchParams.delete('fight');
		}

		goto(`/raid/logs=${code}` + url.search, { replaceState: true });
	}

	function clearUrlParams() {
		// Send users back to the raid hub when clearing state
		goto('/raid', { replaceState: true });
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
		const cacheKey = `raid-log:${codeToFetch}:${fight.id}`;
		const cachedFightData = getCache<{
			damageEvents: Series[];
			healingEvents: Series[];
			castEvents: CastEvent[];
			bossEvents: CastEvent[];
			bossAbilities: BossAbility[];
			deathEvents: DeathEvent[];
			allHealers: Player[];
		}>(cacheKey);
		selectedFight = fight;
		resetEvents();
		averageDamageSummary = null;
		similarLogs = [];
		totalSimilarLogs = 0;
		currentSimilarPage = 1;
		error = '';
		loadingData = true;
		loadingAverageSummary = true;
		loadingSimilarLogs = true;
		showFightSelection = false;

		updateUrlParams(codeToFetch, fight.id);

		try {
			if (cachedFightData) {
				damageEvents = cachedFightData.damageEvents;
				healingEvents = cachedFightData.healingEvents;
				castEvents = cachedFightData.castEvents;
				bossEvents = cachedFightData.bossEvents;
				bossAbilities = cachedFightData.bossAbilities;
				deathEvents = cachedFightData.deathEvents;
				allHealers = cachedFightData.allHealers;

				if (
					damageEvents.length === 0 &&
					healingEvents.length === 0 &&
					castEvents.length === 0 &&
					bossEvents.length === 0
				) {
					error = 'No data found for the selected fight.';
				}

				loadingData = false;
				void fetchAverageDamageSummary(fight, damageEvents);
				void fetchSimilarLogs({
					bossId: fight.encounterID,
					healerSpecs: getFightHealerSpecs(allHealers),
					page: 1,
					limit: similarLogsItemsPerPage
				});
				return;
			}

			const [
				damageResponse,
				healingResponse,
				castResponse,
				bossResponse,
				deathResponse,
				playerDetailsResponse
			] = await Promise.all([
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
				fetch('/api/death-events', {
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
			const deathData = await deathResponse.json();
			const playerDetailsData = await playerDetailsResponse.json();

			if (
				damageResponse.ok &&
				healingResponse.ok &&
				castResponse.ok &&
				bossResponse.ok &&
				deathResponse.ok &&
				playerDetailsResponse.ok
			) {
				damageEvents = damageData.seriesData || [];
				healingEvents = healingData.seriesData || [];
				castEvents = castData.castEvents || [];
				bossEvents = bossData.castEvents || [];
				bossAbilities = bossData.abilities || [];
				deathEvents = deathData.deathEvents || [];
				allHealers = playerDetailsData.healerData || [];

				setCache(
					cacheKey,
					{
						damageEvents,
						healingEvents,
						castEvents,
						bossEvents,
						bossAbilities,
						deathEvents,
						allHealers
					},
					15 * 60 * 1000
				);

				if (
					damageEvents.length === 0 &&
					healingEvents.length === 0 &&
					castEvents.length === 0 &&
					bossEvents.length === 0
				) {
					error = 'No data found for the selected fight.';
				}

				void fetchAverageDamageSummary(fight, damageData.seriesData || []);
				void fetchSimilarLogs({
					bossId: fight.encounterID,
					healerSpecs: getFightHealerSpecs(playerDetailsData.healerData || []),
					page: 1,
					limit: similarLogsItemsPerPage
				});
			} else {
				const failed = [
					!damageResponse.ok && 'damage-events',
					!healingResponse.ok && 'healing-events',
					!castResponse.ok && 'cast-events',
					!bossResponse.ok && 'boss-events',
					!deathResponse.ok && 'death-events',
					!playerDetailsResponse.ok && 'player-details'
				].filter(Boolean);
				error = 'Failed to fetch some data for the selected fight.';
				logClientError('raid/logs', `fight fetch failed: ${failed.join(', ')}`, {
					fightId: fight.id,
					report: codeToFetch
				});
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
		const currentReport = extractReportCode(reportURL.trim());
		updateUrlParams(currentReport, null);
	}

	function goBackToReportInput() {
		reportURL = '';
		resetForNewReport();
		showFightSelection = true;
		error = '';
		reportTitle = undefined;
		reportOwner = undefined;
		reportGuild = undefined;
		clearUrlParams();
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
		deathEvents = [];
		bossAbilities = [];
		allHealers = [];
		averageDamageTimeline = [];
	}

	async function fetchAverageDamageSummary(fight: Fight, seriesData: Series[]) {
		loadingAverageSummary = true;
		try {
			const cacheKey = `damage-average:${fight.encounterID}`;
			let records = getCache<AverageRecord[]>(cacheKey);
			if (!records) {
				const response = await fetch(`/api/damage-average?bossId=${fight.encounterID}`);
				const apiData = await response.json();
				if (!Array.isArray(apiData)) {
					averageDamageSummary = null;
					return;
				}
				records = apiData as AverageRecord[];
				setCache(cacheKey, records, 24 * 60 * 60 * 1000);
			}

			const filtered = records.filter((record) => record.n >= 5);
			averageDamageTimeline = filtered.map((record) => ({
				time_seconds: record.time_seconds,
				avg: record.avg
			}));
			if (filtered.length === 0) {
				averageDamageSummary = null;
				return;
			}

			const peakAverage = filtered.reduce((best, record) =>
				record.avg > best.avg ? record : best
			);
			const fightSeries = seriesData.find((entry) => entry.name === 'Total') ?? seriesData[0];
			if (!fightSeries || fightSeries.data.length === 0) {
				averageDamageSummary = null;
				return;
			}

			const fightPeakValue = Math.max(...fightSeries.data);
			const fightPeakIndex = fightSeries.data.findIndex((value) => value === fightPeakValue);
			averageDamageSummary = {
				peakAverageDamage: peakAverage.avg,
				peakAverageTime: peakAverage.time_seconds,
				fightPeakDamage: fightPeakValue,
				fightPeakTime: (fightPeakIndex * fightSeries.pointInterval) / 1000
			};
		} catch (err) {
			logClientError('raid/logs', 'damage-average summary failed', err);
			averageDamageSummary = null;
			averageDamageTimeline = [];
		} finally {
			loadingAverageSummary = false;
		}
	}

	async function fetchSimilarLogs(params: BrowseLogsParams) {
		loadingSimilarLogs = true;
		currentSimilarPage = params.page ?? 1;
		const cacheKey = buildBrowseLogsCacheKey(params);
		try {
			const cached = getCache<{ logs: BrowsedLog[]; total: number; page: number; limit: number }>(
				cacheKey
			);
			if (cached) {
				similarLogs = cached.logs;
				totalSimilarLogs = cached.total;
				currentSimilarPage = cached.page;
				return;
			}

			const response = await fetch('/api/browse-logs', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(params)
			});
			const data = await response.json();
			if (response.ok && data.logs) {
				similarLogs = data.logs;
				totalSimilarLogs = data.total ?? 0;
				currentSimilarPage = data.page ?? params.page ?? 1;
				setCache(cacheKey, data, 10 * 60 * 1000);
			} else {
				similarLogs = [];
				totalSimilarLogs = 0;
			}
		} catch (err) {
			logClientError('raid/logs', 'browse-logs fetch failed', err);
			similarLogs = [];
			totalSimilarLogs = 0;
		} finally {
			loadingSimilarLogs = false;
		}
	}

	async function handleSimilarLogSearch(detail: BrowseLogsParams) {
		await fetchSimilarLogs({
			...detail,
			bossId: detail.bossId ?? selectedFight?.encounterID,
			page: 1,
			limit: similarLogsItemsPerPage
		});
	}

	async function handleSimilarLogsPageChange(detail: { page: number }) {
		await fetchSimilarLogs({
			bossId: selectedFight?.encounterID,
			healerSpecs: selectedFightHealerSpecs,
			page: detail.page,
			limit: similarLogsItemsPerPage
		});
	}

	function analyzeLogFromBrowse(log: BrowsedLog) {
		goto(`/raid/logs=${log.log_code}?fight=${log.fight_id}`);
	}
	let groupedFights = $derived(
		groupFightsByNameAndDifficulty(killsOnly ? fights.filter((fight) => fight.kill) : fights)
	);
</script>

<SEO
	title="Raid Encounter Visualization & Log Browser - Mr. Mythical"
	description="Visualize raid encounters from Warcraft Logs. Interactive damage and healing timelines with ability overlays for deeper insights into raid performance."
	image="https://mrmythical.com/Logo.png"
	keywords="Raid visualization, Encounter visualization, healing visualization, Warcraft Logs, World of Warcraft, wow raids, cooldown planning, boss tactics, raid leading, damage graphs, healing graphs, raid performance, ability overlays"
/>

<main class="container mx-auto px-4 py-8">
	{#if initializing || (selectedFight && loadingData)}
		<EncounterSkeleton />
	{:else if !selectedFight && reportURL && fights.length > 0}
		<div class="mt-8 flex flex-col gap-8">
			<div class="mt-4 flex items-center justify-between">
				<div>
					<h1 class="text-2xl font-bold">{reportTitle || 'Report Details'}</h1>
					{#if reportGuild?.name}
						<h2 class="text-muted-foreground text-xl font-semibold">Guild: {reportGuild.name}</h2>
					{/if}
					{#if reportOwner?.name}
						<p class="text-muted-foreground text-sm">Uploaded by: {reportOwner.name}</p>
					{/if}
				</div>
				<div class="flex items-center gap-4">
					<Label class="flex items-center space-x-2">
						<span class="text-sm">Kills only</span>
						<input type="checkbox" bind:checked={killsOnly} class="toggle toggle-primary" />
					</Label>
					<Button onclick={goBackToReportInput} variant="outline">Load Different Report</Button>
				</div>
			</div>

			{#each Object.entries(groupedFights) as [name, difficulties]}
				<div class="bg-card mb-8 overflow-hidden rounded-xl border shadow-lg">
					<div class="bg-muted/30 border-b px-6 py-4">
						<h2 class="text-2xl font-bold tracking-tight">{name}</h2>
					</div>
					{#each Object.entries(difficulties) as [difficulty, difficultyFights]}
						<div class="p-4">
							<h3 class="text-primary mb-4 flex items-center gap-2 text-lg font-semibold">
								<span class="bg-primary flex h-2 w-2 rounded-full"></span>
								{difficultyMap[Number(difficulty)]}
							</h3>
							<div class="grid gap-3 md:grid-cols-2">
								{#each difficultyFights.filter((f) => f.kill === true || f.kill === null) as fight (fight.id)}
									<Button
										onclick={() => handleFightSelection(fight)}
										variant="outline"
										class="hover:bg-accent relative flex h-auto w-full flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all hover:scale-[1.02] hover:shadow-md"
									>
										<span class="flex-grow">
											{fight.kill ? 'Kill' : fight.bossPercentage != null ? 'Wipe' : 'Attempt'} - {formatDuration(
												fight.startTime,
												fight.endTime
											)}
										</span>
										{#if fight.bossPercentage != null}
											<div
												class="bg-muted mx-2 flex h-2 w-1/4 flex-shrink-0 overflow-hidden rounded-md"
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
											onclick={() => handleFightSelection(fight)}
											variant="outline"
											class="hover:bg-accent relative flex w-full items-center justify-between rounded-md p-3 text-left shadow-sm"
										>
											<span class="flex-grow">
												Wipe {index + 1} - {formatDuration(fight.startTime, fight.endTime)}
											</span>
											{#if fight.bossPercentage != null}
												<div
													class="bg-muted mx-2 flex h-2 w-1/4 flex-shrink-0 overflow-hidden rounded-md"
												>
													<div
														class="bg-destructive h-full"
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
				class="bg-background/80 sticky top-0 z-50 -mx-4 mb-6 px-4 py-4 backdrop-blur-lg md:-mx-6 md:px-6 lg:-mx-8 lg:px-8"
			>
				<div class="flex flex-col items-center justify-between gap-4 md:flex-row">
					<div class="text-center md:text-left">
						<div class="flex items-center gap-3">
							<h1 class="text-3xl font-bold tracking-tight">
								{selectedFight.name}
							</h1>
							<span class="bg-primary/10 text-primary rounded-full px-3 py-1 text-sm font-medium">
								{difficultyMap[Number(selectedFight.difficulty)]}
							</span>
							<span
								class={`rounded-full px-3 py-1 text-sm font-medium ${selectedFight.kill ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}
							>
								{selectedFight.kill ? 'Kill' : `${selectedFight.bossPercentage}% Wipe`}
							</span>
						</div>
						<p class="text-muted-foreground mt-1 text-sm">
							Duration: {formatDuration(selectedFight.startTime, selectedFight.endTime)}
						</p>
					</div>
					<div class="flex gap-4">
						<Button onclick={goBackToFightSelection} variant="outline" class="gap-2">
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
						<Button onclick={goBackToReportInput} variant="outline" class="gap-2">
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
				<div class="space-y-6">
					<DamageChart
						{damageEvents}
						{healingEvents}
						{castEvents}
						{bossEvents}
						{deathEvents}
						{bossAbilities}
						{...damageChartExtraProps}
						{allHealers}
						encounterId={selectedFight.encounterID}
						showDeathsSection={false}
					/>

					<div class="grid gap-6 lg:grid-cols-[1fr_1fr]">
						<!-- Deaths section on the left -->
						<section class="border-border bg-card/80 rounded-xl border p-4 md:p-6">
							<div class="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
								<div>
									<h3 class="text-xl font-semibold">Deaths in this pull</h3>
									<p class="text-muted-foreground text-sm">
										Each row shows when the death happened and which player died.
									</p>
								</div>
								<p class="text-muted-foreground text-sm">{deathEvents.length} total deaths</p>
							</div>

							{#if deathEvents.length > 0}
								<div class="mt-4 overflow-x-auto">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Time</TableHead>
												<TableHead>Player</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{#each sortedDeathEvents as event (event.timestamp + '-' + event.targetID)}
												<TableRow>
													<TableCell class="font-medium"
														>{formatRelativeTimestamp(event.timestamp)}</TableCell
													>
													<TableCell style={`color: ${getClassColor(event.targetClass)};`}>
														{event.targetName}
													</TableCell>
												</TableRow>
											{/each}
										</TableBody>
									</Table>
								</div>
							{:else}
								<p class="text-muted-foreground mt-4 text-sm">
									No death events were reported for this pull.
								</p>
							{/if}
						</section>

						<!-- Similar healer comps on the right -->
						<section class="border-border bg-card/80 self-start rounded-xl border p-4 md:p-6">
							<LogBrowserResults
								logs={similarLogs}
								loading={loadingSimilarLogs}
								totalLogs={totalSimilarLogs}
								currentPage={currentSimilarPage}
								itemsPerPage={similarLogsItemsPerPage}
								title="Similar healer comps"
								description="Public kills for this boss, seeded with the healers present in your selected pull."
								titleClass="text-xl font-semibold"
								bare={true}
								onpageChange={handleSimilarLogsPageChange}
								onanalyzeLog={(log) => analyzeLogFromBrowse(log)}
							/>
						</section>
					</div>
				</div>
			{:else}
				<p class="text-destructive py-10 text-center">
					{error || 'No visualization data found for this fight.'}
				</p>
			{/if}
		</div>
	{:else}
		<div class="mb-6 text-center">
			<h1 class="mb-2 text-4xl font-bold">No Report Loaded</h1>
			<p class="text-muted-foreground text-lg">
				Please load a report from the raid hub to visualize encounters
			</p>
			<Button class="mt-4" onclick={() => goto('/raid')}>Go to Raid Hub</Button>
		</div>
	{/if}
</main>

<Footer />
