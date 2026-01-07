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
    import DamageChart from '../../../components/damageChart.svelte';
    import SEO from '../../../components/seo.svelte';
    import Footer from '../../../components/footer.svelte';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { Button } from '$lib/components/ui/button';
    import { Separator } from '$lib/components/ui/separator';
    import { recentReports as recentReportsStore } from '$lib/utils/recentReports';
    import { goto } from '$app/navigation';
    import { page as pageStore } from '$app/stores';
    import { onMount } from 'svelte';
    import * as Card from '$lib/components/ui/card';
    import * as Tabs from '$lib/components/ui/tabs';
    import EncounterSkeleton from '../../../components/skeletons/encounterSkeleton.svelte';

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
    let initializing = false;

    let reportTitle: string | undefined;
    let reportOwner: ReportOwner | undefined;
    let reportGuild: ReportGuild | undefined;



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
        const params = $pageStore.params as { reportcode?: string };
        initialReportCodeFromUrl = params?.reportcode ?? null;

        const urlParams = $pageStore.url.searchParams;
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
    }

    // URL management functions
    function updateUrlParams(reportCode: string | null = null, fightId: number | null = null) {
        const url = new URL(window.location.href);
        const code = reportCode ?? ($pageStore.params as { reportcode?: string }).reportcode ?? '';

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
        // Remove fight parameter but keep report parameter
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
        // Clear all URL parameters when going back to start
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
        allHealers = [];
    }




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
            {:else}
                <p class="py-10 text-center text-destructive">
                    {error || 'No visualization data found for this fight.'}
                </p>
            {/if}
        </div>
    {:else}
        <div class="mb-6 text-center">
            <h1 class="mb-2 text-4xl font-bold">No Report Loaded</h1>
            <p class="text-lg text-muted-foreground">
                Please load a report from the raid hub to visualize encounters
            </p>
            <Button class="mt-4" on:click={() => goto('/raid')}>Go to Raid Hub</Button>
        </div>
    {/if}
</main>

<Footer />
