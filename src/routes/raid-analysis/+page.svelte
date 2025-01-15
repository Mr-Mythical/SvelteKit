<script lang="ts">
	import type { Fight, Series } from '$lib/types/types';
	import DamageChart from '../../components/damageChart.svelte';
	import Header from '../../components/header.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import SEO from '../../components/seo.svelte';
	import Footer from '../../components/footer.svelte';

	let reportCode: string = '';
	let fights: Fight[] = [];
	let selectedFight: Fight | null = null;
	let damageEvents: Series[] = [];
	let healingEvents: Series[] = [];
	let error: string = '';
	let loadingFights = false;
	let loadingDamage = false;
	let killsOnly = false;
	let showFightSelection = true;

	const difficultyMap: Record<number, string> = {
		2: 'Raid Finder',
		3: 'Normal',
		4: 'Heroic',
		5: 'Mythic'
	};

	$: groupedFights = groupFightsByNameAndDifficulty(
		killsOnly ? fights.filter((fight) => fight.kill) : fights
	);

	async function fetchFights() {
		if (!reportCode.trim()) {
			error = 'Please enter a report code.';
			resetFights();
			return;
		}

		loadingFights = true;
		resetFights();
		error = '';

		try {
			const response = await fetch('/api/fights', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ code: reportCode.trim() })
			});
			const data = await response.json();

			if (response.ok) {
				fights = data.fights.filter((fight: Fight) => fight.difficulty !== null);
				if (fights.length === 0) {
					error = 'No fights found for the provided report code.';
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
		selectedFight = fight;
		resetEvents();
		error = '';
		loadingDamage = true;
		showFightSelection = false;

		try {
			const [damageResponse, healingResponse] = await Promise.all([
				fetch('/api/damage-events', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						fightID: fight.id,
						code: reportCode.trim(),
						startTime: fight.startTime,
						endTime: fight.endTime
					})
				}),
				fetch('/api/healing-events', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						fightID: fight.id,
						code: reportCode.trim(),
						startTime: fight.startTime,
						endTime: fight.endTime
					})
				})
			]);

			const damageData = await damageResponse.json();
			const healingData = await healingResponse.json();

			console.log('Fetched Damage Data:', damageData);
			console.log('Fetched Healing Data:', healingData);

			if (damageResponse.ok && healingResponse.ok) {
				damageEvents = damageData.seriesData || [];
				healingEvents = healingData.seriesData || [];

				if (damageEvents.length === 0 && healingEvents.length === 0) {
					error = 'No data found for the selected fight.';
				}
			} else {
				error = 'Failed to fetch damage or healing events.';
			}
		} catch (err) {
			console.error('Fetch Events Error:', err);
			error = 'An unexpected error occurred.';
		} finally {
			loadingDamage = false;
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
	}
</script>

<SEO
	title="Raid Encounter Analysis - Damage and Healing Graphs"
	description="Analyze raid encounters with detailed damage and healing graphs. Import Warcraft Logs reports, overlay abilities, and gain deeper insights into raid performance."
	image="https://mrmythical.com/Logo.png"
	keywords="Raid analysis, Warcraft Logs, World of Warcraft, damage graphs, healing graphs, raid performance, encounter analysis, ability overlays, raid leading"
/>

<Header />
<main>
	{#if showFightSelection}
		<div class="container mx-auto flex flex-col gap-4 p-4 sm:w-80">
			<Label class="block text-lg" for="reportCode">Enter Report Code:</Label>
			<Input
				class="w-full"
				type="text"
				id="reportCode"
				bind:value={reportCode}
				placeholder="e.g., LYNPrDcwVjC7zdWx"
			/>

			<Button class="w-full" on:click={fetchFights} disabled={loadingFights}>
				{#if loadingFights}
					Loading...
				{:else}
					Fetch Fights
				{/if}
			</Button>
		</div>

		{#if error && !loadingFights}
			<p class="error">{error}</p>
		{/if}

		<div class="container mx-auto flex flex-col gap-8 p-4 md:px-16 lg:px-52 xl:px-80">
			{#if Object.keys(groupedFights).length > 0}
				<div class="mt-4 flex items-center justify-between">
					<h1 class="text-2xl font-bold">Fight Selection</h1>
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
									<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
										{#each fights.filter((fight) => !fight.kill) as fight, index (fight.id)}
											<Button
												on:click={() => handleFightSelection(fight)}
												class="relative flex w-full items-center justify-between rounded-md shadow-md"
											>
												<span class="flex-grow text-left">
													Wipe {index + 1} - {formatDuration(fight.startTime, fight.endTime)}
												</span>
												<div class="mx-2 flex h-1/4 w-1/4 flex-shrink-0 overflow-hidden rounded-md">
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
				{#if loadingDamage}
					<p>Loading damage events...</p>
				{:else if damageEvents.length > 0}
					<DamageChart {damageEvents} {healingEvents} />
				{/if}
			{/if}
		</div>
	{/if}
</main>
<Footer />
