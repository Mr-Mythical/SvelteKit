<script lang="ts">
	import SEO from '../../components/seo.svelte';
	import Footer from '../../components/footer.svelte';
	import SpecPerformanceChart from '../../components/specPerformanceChart.svelte';
	import { testBosses } from '$lib/types/bossData';
	import { formSchema, type FormSchema } from './schema';
	import * as Form from '$lib/components/ui/form';
	import * as Select from '$lib/components/ui/select';
	import * as Tabs from '$lib/components/ui/tabs';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { type Infer, type SuperValidated, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { getClassColorFromSpec } from '$lib/utils/classColors';

	export let data: SuperValidated<Infer<FormSchema>>;

	const form = superForm(data, {
		validators: zodClient(formSchema),
		dataType: 'json'
	});

	const { form: formData } = form;

	const encounters = testBosses.map((boss) => ({
		value: boss.id.toString(),
		label: boss.name
	}));

	const difficulties = [
		{ value: '4', label: 'Heroic' },
		{ value: '5', label: 'Mythic' }
	];

	const fightFilters = [
		{ value: 'kills_wipes', label: 'Kills & Wipes' },
		{ value: 'kills_no_deaths', label: 'Kills (No Deaths)' },
		{ value: 'kills_all', label: 'Kills (All)' }
	];

	let selectedEncounter: (typeof encounters)[0] | undefined;
	let selectedDifficulty: (typeof difficulties)[0];

	$: selectedEncounter = encounters.length > 0 ? encounters[0] : undefined;
	$: selectedDifficulty = difficulties[0];

	$: if (encounters.length > 0 && !$formData.bossId) {
		$formData.bossId = encounters[0].value;
		$formData.difficulty = difficulties[0].value;
		$formData.fightFilter = $formData.fightFilter || 'kills_wipes';
	}

	interface SpecStatistic {
		id: number;
		encounter_id: number;
		region: string;
		spec_icon: string;
		difficulty: number | null;
		kills_only: boolean | null;
		death_filter: string | null;
		avg_damage_done: number | null;
		avg_healing_done: number | null;
		avg_dps: number | null;
		avg_hps: number | null;
		max_damage_done: number | null;
		max_healing_done: number | null;
		max_dps: number | null;
		max_hps: number | null;
		min_damage_done: number | null;
		min_healing_done: number | null;
		min_dps: number | null;
		min_hps: number | null;
		sample_count: number | null;
		last_updated: string | null;
	}

	let specData: SpecStatistic[] = [];
	let loading = false;
	let error: string | null = null;
	let showMinMax = false;
	let showRoles = { dps: true, tank: true, healer: true };

	$: if (selectedEncounter && browser && !shouldLoadData && showRoles) {
		loadTop50Players();
	}

	let topPlayers: Record<string, Array<any>> = {};
	let loadingTopPlayers: Record<string, boolean> = {};
	let openSpec: string | null = null;
	let top50Players: Record<string, Array<any>> = {};
	let loadingTop50Players: Record<string, boolean> = {};
	let allTop50Data: Record<string, Array<any>> = {};
	let allSpecData: SpecStatistic[] = [];
	let filteredSpecData: SpecStatistic[] = [];
	let _lastBossQuery = '';
	let expandedSpecs: Set<string> = new Set();
	let shouldLoadData = false;

	$: top50Players = allTop50Data;

	$: top50PlayersDps = allTop50Data.all
		? (() => {
				const filtered = allTop50Data.all
					.filter((player) => {
						const specName = player.spec_icon.split('-')[1];
						const HEALER_SPECS = [
							'Restoration',
							'Holy',
							'Mistweaver',
							'Discipline',
							'Preservation'
						];
						const TANK_SPECS = ['Blood', 'Protection', 'Brewmaster', 'Guardian', 'Vengeance'];

						if (
							showRoles.dps &&
							!TANK_SPECS.some((spec) => specName.toLowerCase() === spec.toLowerCase()) &&
							!HEALER_SPECS.some((spec) => specName.toLowerCase() === spec.toLowerCase())
						) {
							return true;
						}

						if (
							showRoles.tank &&
							TANK_SPECS.some((spec) => specName.toLowerCase() === spec.toLowerCase())
						) {
							return true;
						}

						if (
							showRoles.healer &&
							HEALER_SPECS.some((spec) => specName.toLowerCase() === spec.toLowerCase())
						) {
							return true;
						}

						return false;
					})
					.filter((player) => player.dps > 0);

				const seenPlayers = new Set();
				const deduplicated = filtered.filter((player) => {
					if (seenPlayers.has(player.player_name)) {
						return false;
					}
					seenPlayers.add(player.player_name);
					return true;
				});

				const sorted = deduplicated.sort((a, b) => (b.dps || 0) - (a.dps || 0)).slice(0, 50);

				return sorted.map((player) => ({
					player_name: player.player_name,
					spec_icon: player.spec_icon,
					value: player.dps,
					damage_done: player.damage_done,
					healing_done: player.healing_done,
					report_url: player.report_url,
					is_kill: player.is_kill,
					death_count: player.death_count
				}));
			})()
		: [];

	$: top50PlayersHps = allTop50Data.all
		? (() => {
				const filtered = allTop50Data.all
					.filter((player) => {
						const specName = player.spec_icon.split('-')[1];
						const HEALER_SPECS = [
							'Restoration',
							'Holy',
							'Mistweaver',
							'Discipline',
							'Preservation'
						];
						const TANK_SPECS = ['Blood', 'Protection', 'Brewmaster', 'Guardian', 'Vengeance'];

						if (
							showRoles.healer &&
							HEALER_SPECS.some((spec) => specName.toLowerCase() === spec.toLowerCase())
						) {
							return true;
						}

						if (
							showRoles.tank &&
							TANK_SPECS.some((spec) => specName.toLowerCase() === spec.toLowerCase())
						) {
							return true;
						}

						if (
							showRoles.dps &&
							specName &&
							!HEALER_SPECS.some((spec) => specName.toLowerCase() === spec.toLowerCase()) &&
							!TANK_SPECS.some((spec) => specName.toLowerCase() === spec.toLowerCase())
						) {
							return true;
						}

						return false;
					})
					.filter((player) => player.hps > 0);

				const seenPlayers = new Set();
				const deduplicated = filtered.filter((player) => {
					if (seenPlayers.has(player.player_name)) {
						return false;
					}
					seenPlayers.add(player.player_name);
					return true;
				});

				const sorted = deduplicated.sort((a, b) => (b.hps || 0) - (a.hps || 0)).slice(0, 50);

				return sorted.map((player) => ({
					player_name: player.player_name,
					spec_icon: player.spec_icon,
					value: player.hps,
					damage_done: player.damage_done,
					healing_done: player.healing_done,
					report_url: player.report_url,
					is_kill: player.is_kill,
					death_count: player.death_count
				}));
			})()
		: [];

	$: if ($formData.bossId) {
		const params = new URLSearchParams({
			encounterId: $formData.bossId
		});
		if ($formData.difficulty) params.append('difficulty', $formData.difficulty);
		const q = params.toString();
		if (q !== _lastBossQuery) {
			_lastBossQuery = q;
			shouldLoadData = true;
		}
	}
	$: filteredSpecData = filterSpecData(allSpecData, $formData.fightFilter);

	function filterTop50Data(data: Array<any>, filter: string): Array<any> {
		if (!data.length) return [];

		const activeFilter = filter || 'kills_no_deaths';

		switch (activeFilter) {
			case 'kills_wipes':
				return data.filter((player) => player.is_kill === false);
			case 'kills_no_deaths':
				return data.filter((player) => player.is_kill === true && player.death_count === 0);
			case 'kills_all':
				return data.filter((player) => player.is_kill === true);
			default:
				return data;
		}
	}

	function filterSpecData(data: SpecStatistic[], filter: string): SpecStatistic[] {
		if (!data.length) return [];

		const activeFilter = filter || 'kills_no_deaths';

		switch (activeFilter) {
			case 'kills_wipes':
				return data.filter((spec) => spec.kills_only === false);
			case 'kills_no_deaths':
				return data.filter((spec) => spec.kills_only === true && spec.death_filter === 'no_deaths');
			case 'kills_all':
				return data.filter((spec) => spec.kills_only === true && spec.death_filter === 'all');
			default:
				return data;
		}
	}

	$: selectedBoss = $formData.bossId
		? {
				label: encounters.find((e) => e.value === $formData.bossId)?.label || '',
				value: $formData.bossId
			}
		: undefined;

	$: selectedDifficultyValue = $formData.difficulty
		? {
				label: difficulties.find((d) => d.value === $formData.difficulty)?.label || '',
				value: $formData.difficulty
			}
		: undefined;

	$: selectedFightFilterValue = $formData.fightFilter
		? {
				label: fightFilters.find((f) => f.value === $formData.fightFilter)?.label || '',
				value: $formData.fightFilter
			}
		: undefined;

	async function loadSpecData() {
		if (!$formData.bossId) return;

		loading = true;
		error = null;

		try {
			const params = new URLSearchParams({
				encounterId: $formData.bossId
			});

			if ($formData.difficulty) {
				params.append('difficulty', $formData.difficulty);
			}

			const response = await fetch(`/api/spec-statistics?${params}`);

			if (!response.ok) {
				throw new Error(`Failed to fetch spec data: ${response.statusText}`);
			}

			allSpecData = await response.json();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load spec data';
			toast.error(error);
			console.error('Error loading spec data:', err);
		} finally {
			loading = false;
		}
	}

	onMount(() => {});

	$: if (shouldLoadData && selectedEncounter && browser) {
		loadSpecData();
		loadTop50Players();
		shouldLoadData = false;
	}

	const HEALER_SPECS = ['Restoration', 'Holy', 'Mistweaver', 'Discipline', 'Preservation'];
	const TANK_SPECS = ['Blood', 'Protection', 'Brewmaster', 'Guardian', 'Vengeance'];

	function getSpecRole(specIcon: string): 'dps' | 'tank' | 'healer' {
		const specName = getSpecName(specIcon);
		if (HEALER_SPECS.includes(specName)) return 'healer';
		if (TANK_SPECS.includes(specName)) return 'tank';
		return 'dps';
	}

	$: damageSpecs = filteredSpecData
		.filter((spec) => spec.avg_dps && spec.avg_dps > 0)
		.filter((spec) => showRoles[getSpecRole(spec.spec_icon)])
		.sort((a, b) => (b.avg_dps || 0) - (a.avg_dps || 0));

	$: healingSpecs = filteredSpecData
		.filter((spec) => spec.avg_hps && spec.avg_hps > 0)
		.filter((spec) => showRoles[getSpecRole(spec.spec_icon)])
		.sort((a, b) => (b.avg_hps || 0) - (a.avg_hps || 0));

	function formatNumber(num: number | null | undefined): string {
		if (num === null || num === undefined) return 'N/A';
		return num.toLocaleString();
	}

	async function loadTopPlayersForSpec(specIcon: string, metric: 'dps' | 'hps') {
		if (!selectedEncounter) return;
		const key = `${specIcon}:${metric}`;
		if (loadingTopPlayers[key]) return;
		loadingTopPlayers[key] = true;
		try {
			const params = new URLSearchParams({
				encounterId: selectedEncounter?.value ?? '',
				specIcon,
				metric,
				fightFilter: $formData.fightFilter
			});
			if ($formData.difficulty) params.append('difficulty', $formData.difficulty);
			const res = await fetch(`/api/spec-top-players?${params.toString()}`);
			if (!res.ok) throw new Error('Failed to load top players');
			topPlayers[key] = await res.json();
		} catch (err) {
			console.error(err);
			topPlayers[key] = [];
		} finally {
			loadingTopPlayers[key] = false;
		}
	}

	async function loadTop50Players() {
		if (!selectedEncounter) return;
		if (loadingTop50Players.all) return;
		loadingTop50Players.all = true;
		try {
			const params = new URLSearchParams({
				encounterId: selectedEncounter?.value ?? ''
			});
			if ($formData.difficulty) params.append('difficulty', $formData.difficulty);
			if ($formData.fightFilter) params.append('fightFilter', $formData.fightFilter);

			const requests = [
				{ role: 'dps', metric: 'dps' },
				{ role: 'tank', metric: 'dps' },
				{ role: 'healer', metric: 'dps' },
				{ role: 'dps', metric: 'hps' },
				{ role: 'tank', metric: 'hps' },
				{ role: 'healer', metric: 'hps' }
			];

			const promises = requests.map(({ role, metric }) => {
				const params = new URLSearchParams({
					encounterId: selectedEncounter?.value ?? '',
					role,
					metric
				});
				if ($formData.difficulty) params.append('difficulty', $formData.difficulty);
				if ($formData.fightFilter) params.append('fightFilter', $formData.fightFilter);
				return fetch(`/api/top-players?${params.toString()}`);
			});

			const responses = await Promise.all(promises);
			const results = await Promise.all(
				responses.map((res) => {
					if (!res.ok) throw new Error('Failed to load top players');
					return res.json();
				})
			);

			allTop50Data.all = results.flat();
		} catch (err) {
			console.error(err);
			allTop50Data.all = [];
		} finally {
			loadingTop50Players.all = false;
		}
	}

	function getSpecName(specIcon: string): string {
		const parts = specIcon.split('-');
		if (parts.length < 2) return specIcon;

		return parts[1];
	}

	function getRowStyle(specIcon: string): string {
		const classColor = getClassColorFromSpec(specIcon);
		return `background-color: ${classColor}30; border-left: 3px solid ${classColor}60;`;
	}
</script>

<SEO
	title="Beta Raid Testing - Mr. Mythical"
	description="Analyze spec performance data from beta and PTR raid tests. View DPS and HPS statistics, compare class performance across different encounters and difficulties."
	image="https://mrmythical.com/Logo.png"
	keywords="WoW beta testing, PTR raid testing, spec performance, DPS rankings, HPS rankings, class balance, beta raid data"
/>

<main class="container mx-auto px-4 py-8">
	<div class="mb-6 text-center">
		<h1 class="mb-2 text-4xl font-bold">Beta Raid Testing</h1>
		<p class="text-lg text-muted-foreground">
			View spec performance data from beta and PTR raid tests
		</p>
	</div>

	{#if encounters.length === 0}
		<div class="rounded-lg border border-orange-500 bg-orange-500/10 p-8 text-center">
			<p class="text-lg font-semibold">No test bosses available at this time.</p>
			<p class="mt-2 text-muted-foreground">
				Test bosses will be added here during beta and PTR raid testing periods.
			</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 gap-8">
			<div class="flex justify-center">
				<div class="w-full max-w-4xl space-y-4">
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2">
						<Form.Field {form} name="bossId">
							<Form.Control let:attrs>
								<Form.Label>Select Boss</Form.Label>
								<Select.Root
									selected={selectedBoss}
									onSelectedChange={(v) => {
										v && ($formData.bossId = v.value);
										selectedEncounter =
											encounters.find((e) => e.value === v?.value) ?? encounters[0];
									}}
								>
									<Select.Trigger {...attrs}>
										<Select.Value placeholder="Select a boss" />
									</Select.Trigger>
									<Select.Content>
										{#each encounters as encounter}
											<Select.Item value={encounter.value} label={encounter.label} />
										{/each}
									</Select.Content>
								</Select.Root>
								<input hidden bind:value={$formData.bossId} name={attrs.name} />
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<Form.Field {form} name="difficulty">
							<Form.Control let:attrs>
								<Form.Label>Difficulty</Form.Label>
								<Select.Root
									selected={selectedDifficultyValue}
									onSelectedChange={(v) => {
										if (v) {
											$formData.difficulty = v.value;
											selectedDifficulty =
												difficulties.find((d) => d.value === v?.value) ?? difficulties[0];
										}
									}}
								>
									<Select.Trigger {...attrs}>
										<Select.Value placeholder="Select difficulty" />
									</Select.Trigger>
									<Select.Content>
										{#each difficulties as difficulty}
											<Select.Item value={difficulty.value} label={difficulty.label} />
										{/each}
									</Select.Content>
								</Select.Root>
								<input hidden bind:value={$formData.difficulty} name={attrs.name} />
							</Form.Control>
							<Form.FieldErrors />
						</Form.Field>

						<input name="fightFilter" value={$formData.fightFilter} hidden />
					</div>
				</div>
			</div>

			{#if loading}
				<div class="flex justify-center py-8">
					<div class="text-lg">Loading spec data...</div>
				</div>
			{:else if error}
				<div class="rounded-lg border border-destructive bg-destructive/10 p-4 text-center">
					<p class="text-destructive">{error}</p>
				</div>
			{:else if filteredSpecData.length > 0}
				<div class="rounded-lg border bg-card p-4">
					<Tabs.Root value="damage" class="w-full">
						<Tabs.List class="grid w-full grid-cols-2">
							<Tabs.Trigger value="damage">Damage</Tabs.Trigger>
							<Tabs.Trigger value="healing">Healing</Tabs.Trigger>
						</Tabs.List>

						<Tabs.Content value="damage">
							<!-- Toggles - Always visible -->
							<div class="mb-6 flex items-center justify-end gap-6 px-4">
								<div class="flex items-center space-x-2">
									<Checkbox bind:checked={showMinMax} id="show-minmax-damage" />
									<label for="show-minmax-damage" class="cursor-pointer text-sm font-medium">
										Show Min/Max
									</label>
								</div>
								<div class="flex items-center gap-4">
									<span class="text-sm text-muted-foreground">Show:</span>
									<div class="flex items-center space-x-2">
										<Checkbox bind:checked={showRoles.dps} id="show-dps-damage" />
										<label for="show-dps-damage" class="cursor-pointer text-sm font-medium"
											>DPS</label
										>
									</div>
									<div class="flex items-center space-x-2">
										<Checkbox bind:checked={showRoles.tank} id="show-tank-damage" />
										<label for="show-tank-damage" class="cursor-pointer text-sm font-medium"
											>Tank</label
										>
									</div>
									<div class="flex items-center space-x-2">
										<Checkbox bind:checked={showRoles.healer} id="show-healer-damage" />
										<label for="show-healer-damage" class="cursor-pointer text-sm font-medium"
											>Healer</label
										>
									</div>
								</div>
								<div class="flex items-center gap-2">
									<span class="text-sm text-muted-foreground">Filter:</span>
									<Select.Root
										selected={selectedFightFilterValue}
										onSelectedChange={(v) => {
											if (v) {
												$formData.fightFilter = v.value;
											}
										}}
									>
										<Select.Trigger class="w-32">
											<Select.Value />
										</Select.Trigger>
										<Select.Content>
											{#each fightFilters as filter}
												<Select.Item value={filter.value}>{filter.label}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								</div>
							</div>

							{#if damageSpecs.length > 0}
								<div class="space-y-6">
									<!-- Damage Chart -->
									<div class="rounded-lg p-4">
										<SpecPerformanceChart
											specs={damageSpecs}
											chartTitle="Damage Performance Rankings"
											metricType="dps"
											{showMinMax}
											{showRoles}
										/>
									</div>

									<!-- Tables Grid -->
									<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
										<!-- Damage Table -->
										<div class="overflow-x-auto">
											<h3 class="mb-3 text-xl font-semibold">Detailed Statistics</h3>
											<table class="w-full">
												<thead>
													<tr class="border-b">
														<th class="p-2 text-left">Rank</th>
														<th class="p-2 text-left">Spec</th>
														<th class="p-2 text-right">Avg DPS</th>
														<th class="p-2 text-right">Max DPS</th>
														<th class="p-2 text-right">Min DPS</th>
														<th class="p-2 text-right">Sample Count</th>
														<th class="p-2 text-right">Top Players</th>

														<!-- Top Players column -->
													</tr>
												</thead>
												<tbody>
													{#each damageSpecs as spec, i}
														<tr
															class="border-b hover:bg-muted/50"
															style={getRowStyle(spec.spec_icon)}
														>
															<td class="p-2 font-bold">{i + 1}</td>
															<td class="p-2">{getSpecName(spec.spec_icon)}</td>
															<td class="p-2 text-right font-semibold"
																>{formatNumber(spec.avg_dps)}</td
															>
															<td class="p-2 text-right text-green-500"
																>{formatNumber(spec.max_dps)}</td
															>
															<td class="p-2 text-right text-red-500"
																>{formatNumber(spec.min_dps)}</td
															>
															<td class="p-2 text-right">{formatNumber(spec.sample_count)}</td>
															<td class="p-2 text-right">
																<Button
																	size="sm"
																	variant="outline"
																	on:click={() => {
																		const specKey = `${spec.spec_icon}:dps`;
																		if (expandedSpecs.has(specKey)) {
																			expandedSpecs.delete(specKey);
																		} else {
																			expandedSpecs.add(specKey);
																			loadTopPlayersForSpec(spec.spec_icon, 'dps');
																		}
																		expandedSpecs = expandedSpecs; // Trigger reactivity
																	}}
																>
																	{expandedSpecs.has(`${spec.spec_icon}:dps`) ? 'Hide' : 'Top 5'}
																</Button>
															</td>
															<!-- Single Top Players column for Damage shown above -->
														</tr>
														{#if expandedSpecs.has(`${spec.spec_icon}:dps`)}
															<tr class="bg-muted/20">
																<td colspan="7" class="p-0">
																	<div class="p-4">
																		{#if loadingTopPlayers[`${spec.spec_icon}:dps`]}
																			<p class="py-2 text-center">Loading top players...</p>
																		{:else if topPlayers[`${spec.spec_icon}:dps`]?.length > 0}
																			<table class="w-full text-sm">
																				<thead>
																					<tr class="border-b">
																						<th class="p-2 text-left">#</th>
																						<th class="p-2 text-left">Player</th>
																						<th class="p-2 text-right">DPS</th>
																						<th class="p-2 text-right">Report</th>
																					</tr>
																				</thead>
																				<tbody>
																					{#each topPlayers[`${spec.spec_icon}:dps`] as player, playerIndex}
																						<tr class="border-b border-muted/50">
																							<td class="p-2 font-medium">{playerIndex + 1}</td>
																							<td class="p-2">{player.player_name}</td>
																							<td class="p-2 text-right font-semibold"
																								>{formatNumber(player.value)}</td
																							>
																							<td class="p-2 text-right">
																								<a
																									class="text-blue-400 hover:underline"
																									href={player.report_url}
																									target="_blank"
																									rel="noopener noreferrer">View</a
																								>
																							</td>
																						</tr>
																					{/each}
																				</tbody>
																			</table>
																		{:else}
																			<p class="py-2 text-center text-muted-foreground">
																				No player data found
																			</p>
																		{/if}
																	</div>
																</td>
															</tr>
														{/if}
													{/each}
												</tbody>
											</table>
										</div>

										<!-- Top 50 Players Table -->
										<div class="overflow-x-auto">
											<h3 class="mb-3 text-xl font-semibold">Top 50 Players</h3>
											{#if loadingTop50Players.all}
												<p class="py-4 text-center">Loading top players...</p>
											{:else if top50PlayersDps?.length > 0}
												<table class="w-full">
													<thead>
														<tr class="border-b">
															<th class="p-2 text-left">Rank</th>
															<th class="p-2 text-left">Player</th>
															<th class="p-2 text-left">Spec</th>
															<th class="p-2 text-right">DPS</th>
															<th class="p-2 text-right">Report</th>
														</tr>
													</thead>
													<tbody>
														{#each top50PlayersDps as player, i}
															<tr
																class="border-b hover:bg-muted/50"
																style={getRowStyle(player.spec_icon)}
															>
																<td class="p-2 font-bold">{i + 1}</td>
																<td class="p-2 font-medium">{player.player_name}</td>
																<td class="p-2">{getSpecName(player.spec_icon)}</td>
																<td class="p-2 text-right font-semibold"
																	>{formatNumber(player.value)}</td
																>
																<td class="p-2 text-right">
																	<a
																		class="text-blue-400 hover:underline"
																		href={player.report_url}
																		target="_blank"
																		rel="noopener noreferrer">View</a
																	>
																</td>
															</tr>
														{/each}
													</tbody>
												</table>
											{:else}
												<p class="py-4 text-center text-muted-foreground">
													No player data available
												</p>
											{/if}
										</div>
									</div>
								</div>
							{:else}
								<div class="py-8 text-center text-muted-foreground">
									No damage data available for the selected encounter and filters.
								</div>
							{/if}
						</Tabs.Content>

						<Tabs.Content value="healing">
							<!-- Toggles - Always visible -->
							<div class="mb-6 flex items-center justify-end gap-6 px-4">
								<div class="flex items-center space-x-2">
									<Checkbox bind:checked={showMinMax} id="show-minmax-healing" />
									<label for="show-minmax-healing" class="cursor-pointer text-sm font-medium">
										Show Min/Max
									</label>
								</div>
								<div class="flex items-center gap-4">
									<span class="text-sm text-muted-foreground">Show:</span>
									<div class="flex items-center space-x-2">
										<Checkbox bind:checked={showRoles.dps} id="show-dps-healing" />
										<label for="show-dps-healing" class="cursor-pointer text-sm font-medium"
											>DPS</label
										>
									</div>
									<div class="flex items-center space-x-2">
										<Checkbox bind:checked={showRoles.tank} id="show-tank-healing" />
										<label for="show-tank-healing" class="cursor-pointer text-sm font-medium"
											>Tank</label
										>
									</div>
									<div class="flex items-center space-x-2">
										<Checkbox bind:checked={showRoles.healer} id="show-healer-healing" />
										<label for="show-healer-healing" class="cursor-pointer text-sm font-medium"
											>Healer</label
										>
									</div>
								</div>
								<div class="flex items-center gap-2">
									<span class="text-sm text-muted-foreground">Filter:</span>
									<Select.Root
										selected={selectedFightFilterValue}
										onSelectedChange={(v) => {
											if (v) {
												$formData.fightFilter = v.value;
											}
										}}
									>
										<Select.Trigger class="w-32">
											<Select.Value />
										</Select.Trigger>
										<Select.Content>
											{#each fightFilters as filter}
												<Select.Item value={filter.value}>{filter.label}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								</div>
							</div>

							{#if healingSpecs.length > 0}
								<div class="space-y-6">
									<!-- Healing Chart -->
									<div class="rounded-lg p-4">
										<SpecPerformanceChart
											specs={healingSpecs}
											chartTitle="Healing Performance Rankings"
											metricType="hps"
											{showMinMax}
											{showRoles}
										/>
									</div>

									<!-- Tables Grid -->
									<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
										<!-- Healing Table -->
										<div class="overflow-x-auto">
											<h3 class="mb-3 text-xl font-semibold">Detailed Statistics</h3>
											<table class="w-full">
												<thead>
													<tr class="border-b">
														<th class="p-2 text-left">Rank</th>
														<th class="p-2 text-left">Spec</th>
														<th class="p-2 text-right">Avg HPS</th>
														<th class="p-2 text-right">Max HPS</th>
														<th class="p-2 text-right">Min HPS</th>
														<th class="p-2 text-right">Sample Count</th>
														<th class="p-2 text-right">Top Players</th>
													</tr>
												</thead>
												<tbody>
													{#each healingSpecs as spec, i}
														<tr
															class="border-b hover:bg-muted/50"
															style={getRowStyle(spec.spec_icon)}
														>
															<td class="p-2 font-bold">{i + 1}</td>
															<td class="p-2">{getSpecName(spec.spec_icon)}</td>
															<td class="p-2 text-right font-semibold"
																>{formatNumber(spec.avg_hps)}</td
															>
															<td class="p-2 text-right text-green-500"
																>{formatNumber(spec.max_hps)}</td
															>
															<td class="p-2 text-right text-red-500"
																>{formatNumber(spec.min_hps)}</td
															>
															<td class="p-2 text-right">{formatNumber(spec.sample_count)}</td>
															<td class="p-2 text-right">
																<Button
																	size="sm"
																	variant="outline"
																	on:click={() => {
																		const specKey = `${spec.spec_icon}:hps`;
																		if (expandedSpecs.has(specKey)) {
																			expandedSpecs.delete(specKey);
																		} else {
																			expandedSpecs.add(specKey);
																			loadTopPlayersForSpec(spec.spec_icon, 'hps');
																		}
																		expandedSpecs = expandedSpecs; // Trigger reactivity
																	}}
																>
																	{expandedSpecs.has(`${spec.spec_icon}:hps`) ? 'Hide' : 'Top 5'}
																</Button>
															</td>
														</tr>
														{#if expandedSpecs.has(`${spec.spec_icon}:hps`)}
															<tr class="bg-muted/20">
																<td colspan="7" class="p-0">
																	<div class="p-4">
																		{#if loadingTopPlayers[`${spec.spec_icon}:hps`]}
																			<p class="py-2 text-center">Loading top players...</p>
																		{:else if topPlayers[`${spec.spec_icon}:hps`]?.length > 0}
																			<table class="w-full text-sm">
																				<thead>
																					<tr class="border-b">
																						<th class="p-2 text-left">#</th>
																						<th class="p-2 text-left">Player</th>
																						<th class="p-2 text-right">HPS</th>
																						<th class="p-2 text-right">Report</th>
																					</tr>
																				</thead>
																				<tbody>
																					{#each topPlayers[`${spec.spec_icon}:hps`] as player, playerIndex}
																						<tr class="border-b border-muted/50">
																							<td class="p-2 font-medium">{playerIndex + 1}</td>
																							<td class="p-2">{player.player_name}</td>
																							<td class="p-2 text-right font-semibold"
																								>{formatNumber(player.value)}</td
																							>
																							<td class="p-2 text-right">
																								<a
																									class="text-blue-400 hover:underline"
																									href={player.report_url}
																									target="_blank"
																									rel="noopener noreferrer">View</a
																								>
																							</td>
																						</tr>
																					{/each}
																				</tbody>
																			</table>
																		{:else}
																			<p class="py-2 text-center text-muted-foreground">
																				No player data found
																			</p>
																		{/if}
																	</div>
																</td>
															</tr>
														{/if}
													{/each}
												</tbody>
											</table>
										</div>

										<!-- Top 50 Players Table -->
										<div class="overflow-x-auto">
											<h3 class="mb-3 text-xl font-semibold">Top 50 Players</h3>
											{#if loadingTop50Players.all}
												<p class="py-4 text-center">Loading top players...</p>
											{:else if top50PlayersHps?.length > 0}
												<table class="w-full">
													<thead>
														<tr class="border-b">
															<th class="p-2 text-left">Rank</th>
															<th class="p-2 text-left">Player</th>
															<th class="p-2 text-left">Spec</th>
															<th class="p-2 text-right">HPS</th>
															<th class="p-2 text-right">Report</th>
														</tr>
													</thead>
													<tbody>
														{#each top50PlayersHps as player, i}
															<tr
																class="border-b hover:bg-muted/50"
																style={getRowStyle(player.spec_icon)}
															>
																<td class="p-2 font-bold">{i + 1}</td>
																<td class="p-2 font-medium">{player.player_name}</td>
																<td class="p-2">{getSpecName(player.spec_icon)}</td>
																<td class="p-2 text-right font-semibold"
																	>{formatNumber(player.value)}</td
																>
																<td class="p-2 text-right">
																	<a
																		class="text-blue-400 hover:underline"
																		href={player.report_url}
																		target="_blank"
																		rel="noopener noreferrer">View</a
																	>
																</td>
															</tr>
														{/each}
													</tbody>
												</table>
											{:else}
												<p class="py-4 text-center text-muted-foreground">
													No player data available
												</p>
											{/if}
										</div>
									</div>
								</div>
							{:else}
								<div class="py-8 text-center text-muted-foreground">
									No healing data available for the selected encounter and filters.
								</div>
							{/if}
						</Tabs.Content>
					</Tabs.Root>
				</div>
			{:else if $formData.bossId}
				<div class="rounded-lg border bg-card p-8 text-center">
					<p class="text-muted-foreground">
						No data available for the selected boss and filters. Try adjusting your selection.
					</p>
				</div>
			{/if}
		</div>
	{/if}
</main>

<Footer />
