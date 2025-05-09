<script lang="ts">
	import type {
		Fight,
		CastEvent,
		Series,
		Player,
		ReportOwner,
		ReportGuild
	} from '$lib/types/apiTypes';
	import DamageChart from '../../components/damageChart.svelte';
	import Header from '../../components/header.svelte';
	import SEO from '../../components/seo.svelte';
	import Footer from '../../components/footer.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import RecentReports from '../../components/recentReports.svelte';
	import { recentReports } from '$lib/utils/recentReports';

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

	let reportTitle: string;
	let reportOwner: ReportOwner;
	let reportGuild: ReportGuild;

	const difficultyMap: Record<number, string> = {
		2: 'Raid Finder',
		3: 'Normal',
		4: 'Heroic',
		5: 'Mythic'
	};

	$: groupedFights = groupFightsByNameAndDifficulty(
		killsOnly ? fights.filter((fight) => fight.kill) : fights
	);

	function extractReportCode(reportString: string): string {
		try {
			const url = new URL(reportString);
			const pathParts = url.pathname.split('/').filter(Boolean);
			if (pathParts.length > 1 && pathParts[0] === 'reports') {
				return pathParts[1];
			}
		} catch (err) {
			// If it's not a valid URL, we'll just assume the user provided the code directly
		}
		return reportString;
	}

	function handleReportSelection(code: string) {
		reportURL = `https://www.warcraftlogs.com/reports/${code}`;
		fetchFights();
	}

	async function fetchFights() {
		if (!reportURL.trim()) {
			error = 'Please enter a report code or URL.';
			resetFights();
			return;
		}

		loadingFights = true;
		resetFights();
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
					error = 'No fights found for the provided report code.';
				} else {
					recentReports.addReport(
						codeToFetch,
						reportTitle,
						reportGuild,
						reportOwner
					);
				}
			} else {
				error = data.error || 'Failed to fetch fights.';
			}
		} catch (err) {
			console.error('Fetch Fights Error:', err);
			error = 'An unexpected error occurred.';
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
				console.error('Damage Error:', !damageResponse.ok ? await damageResponse.text() : 'OK');
				console.error('Healing Error:', !healingResponse.ok ? await healingResponse.text() : 'OK');
				console.error('Cast Error:', !castResponse.ok ? await castResponse.text() : 'OK');
				console.error('Boss Error:', !bossResponse.ok ? await bossResponse.text() : 'OK');
				console.error(
					'Player Details Error:',
					!playerDetailsResponse.ok ? await playerDetailsResponse.text() : 'OK'
				);
				error = 'Failed to fetch some data for the selected fight.';
			}
		} catch (err) {
			console.error('Fetch Events Error:', err);
			error = 'An unexpected error occurred.';
		} finally {
			loadingData = false;
		}
	}

	function goBack() {
		selectedFight = null;
		showFightSelection = true;
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

	function resetFights() {
		fights = [];
		selectedFight = null;
		resetEvents();
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
	title="Raid Encounter Analysis - Mr. Mythical"
	description="Analyze raid encounters with detailed damage and healing graphs. Import Warcraft Logs reports, overlay abilities, and gain deeper insights into raid performance."
	image="https://mrmythical.com/Logo.png"
	keywords="Raid analysis, Encounter analysis, Warcraft Logs, World of Warcraft, damage graphs, healing graphs, raid performance, encounter analysis, ability overlays, raid leading"
/>

<Header />
<main>
	{#if showFightSelection}
		<div class="container mx-auto p-4">
			<div class="mx-auto md:px-16 lg:px-52 xl:px-80">
				<div class="flex flex-col gap-8">
					<div class="flex flex-col gap-4 items-center">
						<Label class="block text-lg" for="reportCode">Enter WarcraftLogs link or Code:</Label>
						<Input
							class="w-80"
							type="text"
							id="reportCode"
							bind:value={reportURL}
							placeholder="https://www.warcraftlogs.com/reports/<reportcode>"
						/>

						<Button class="w-80" on:click={fetchFights} disabled={loadingFights}>
							{#if loadingFights}
								Loading...
							{:else}
								Fetch Fights
							{/if}
						</Button>

						{#if error && !loadingFights}
							<p class="error">{error}</p>
						{/if}
					</div>
					<div>
						<RecentReports onSelectReport={handleReportSelection} />
					</div>
				</div>
				<div class="mt-8 flex flex-col gap-8">
					<div class="mt-8 flex flex-col gap-8 ">
						{#if Object.keys(groupedFights).length > 0}
							<div class="mt-4 flex items-center justify-between">
								<div>
									<h1 class="text-2xl font-bold">{reportTitle}</h1>
									{#if reportGuild?.name}
										<h2 class="text-xl font-bold">Guild: {reportGuild.name}</h2>
									{/if}
									<p class="text-sm text-muted">Uploaded by: {reportOwner.name}</p>
								</div>
								<Label class="flex items-center space-x-2">
									<span class="text-sm">Kills only</span>
									<input type="checkbox" bind:checked={killsOnly} class="toggle" />
								</Label>
							</div>

							{#each Object.entries(groupedFights) as [name, difficulties]}
								<div class="mb-6">
									<h2 class="text-xl font-bold">{name}</h2>
									{#each Object.entries(difficulties) as [difficulty, fights]}
										<div class="mt-2">
											<h3 class="text-lg font-semibold">{difficultyMap[Number(difficulty)]}</h3>
											<div class="space-y-2">
												{#each fights.filter((fight) => fight.kill) as fight}
													<Button
														on:click={() => handleFightSelection(fight)}
														class="relative flex w-full items-center justify-between rounded-md shadow-md"
													>
														<span class="flex-grow text-left">
															Kill - {formatDuration(fight.startTime, fight.endTime)}
														</span>
														<div class="mx-2 flex h-1/4 w-1/4 flex-shrink-0 overflow-hidden rounded-md">
															<div
																class="h-full bg-progress"
																style="width: {100 - fight.bossPercentage}%;"
															></div>
														</div>
														<span class="flex-shrink-0 text-sm">0%</span>
													</Button>
												{/each}
												<div
													class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
												>
													{#each fights.filter((fight) => !fight.kill) as fight, index (fight.id)}
														<Button
															on:click={() => handleFightSelection(fight)}
															class="relative flex w-full items-center justify-between rounded-md shadow-md"
														>
															<span class="flex-grow text-left">
																Wipe {index + 1} - {formatDuration(fight.startTime, fight.endTime)}
															</span>
															<div
																class="mx-2 flex h-1/4 w-1/4 flex-shrink-0 overflow-hidden rounded-md"
															>
																<div
																	class="h-full bg-destructive"
																	style="width: {100 - fight.bossPercentage}%;"
																></div>
																<div
																	class="h-full bg-secondary"
																	style="width: {fight.bossPercentage}%;"
																></div>
															</div>
															<span class="flex-shrink-0 text-sm">
																{fight.bossPercentage}%
															</span>
														</Button>
													{/each}
												</div>
											</div>
										</div>
									{/each}
								</div>
							{/each}
						{/if}
					</div>
				</div>
			</div>
		</div>
	{:else}
		<div>
			{#if selectedFight}
				<div class="text-center">
					<h1 class="mb-4 text-2xl font-bold">
						Selected Fight: {difficultyMap[Number(selectedFight.difficulty)]}
						{selectedFight.name}
						{selectedFight.kill ? ' - Kill' : ' - Wipe'}
					</h1>
					<Button on:click={goBack} class="mb-4">Back</Button>
				</div>
				{#if loadingData}
					<p>Loading damage events...</p>
				{:else if damageEvents.length > 0}
					<DamageChart
						{damageEvents}
						{healingEvents}
						{castEvents}
						{bossEvents}
						{allHealers}
						encounterId={selectedFight.encounterID}
					/>
				{/if}
			{/if}
		</div>
	{/if}
</main>
<Footer />
