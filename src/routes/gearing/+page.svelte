<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import SEO from '../../components/seo.svelte';
	import Footer from '../../components/layout/footer.svelte';
	import WowheadScripts from '../../components/wowheadScripts.svelte';
	import { PAGE_SEO } from '$lib/data/seoCopy';
	import ItemLink from '../../components/gearing/itemLink.svelte';
	import ItemIcon from '../../components/gearing/itemIcon.svelte';
	import RealmCombobox from '../../components/combobox/realmCombobox.svelte';
	import BnetCharacterPicker from '../../components/gearing/bnetCharacterPicker.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Select from '$lib/components/ui/select';
	import * as Tabs from '$lib/components/ui/tabs';
	import { realmsForRegion, type Region } from '$lib/types/realms';
	import {
		disposeLoadoutWorker,
		ensureLoadoutWorkerModel,
		type LoadoutSearchProgress,
		type LoadoutSearchSource
	} from '$lib/gearing/loadoutWorkerClient';
	import { LoadoutSearchControl } from '$lib/gearing/loadout';
	import {
		emptyStats,
		formatDelta,
		formatDps,
		type CombatStats,
		type LoadedModel
	} from '$lib/gearing/model';
	import { classRelativeSpecLabel, labeledSpecsForClass, type SpecLabel } from '$lib/gearing/specs';
	import { SLOT_ID_LABELS } from '$lib/gearing/slots';
	import { type ItemDbJson, type ResolvedItem } from '$lib/gearing/itemDb';
	import { sumEquippedCombatStats, hasCombatStats } from '$lib/gearing/gearStats';
	import {
		armoryToEquippedPieces,
		combatStatsFromArmoryPaperDoll,
		fetchArmoryCharacter,
		resolveArmoryEquipment,
		type ArmoryCharacterResponse
	} from '$lib/gearing/armory';
	import { annotatePiecesFromItemDb } from '$lib/gearing/usable';
	import { slotLabel } from '$lib/gearing/crests';
	import { loadGearingGameData } from '$lib/gearing/loadGameData';
	import { buildSeasonItemSourceIndex } from '$lib/gearing/inspect';
	import { emptyCharacterState, type CharacterState, type GearPiece } from '$lib/gearing/types';
	import { refreshWowheadLinks } from '$lib/gearing/wowhead';
	import { configureWowheadTooltips } from '$lib/ui/wowheadTooltips';
	import { logClientError } from '$lib/clientLog';
	import {
		estimateSeasonComboCount,
		filterSeasonPiecesByDeselection,
		collectEquippedDuplicateItemIds,
		listSeasonTracks,
		rankSeasonInstancesFromEstimates,
		rankSeasonSlotGroups,
		resolveSeasonCandidates,
		searchBestSeasonLoadoutAsync,
		type RankedSeasonSlotGroup,
		type SeasonBossFarmRank,
		type SeasonLootJson,
		type SeasonSearchResult,
		type SeasonTrackName
	} from '$lib/gearing/season';

	const ARMORY_REGIONS: { value: string; label: string }[] = [
		{ value: 'eu', label: 'EU' },
		{ value: 'us', label: 'US' },
		{ value: 'kr', label: 'KR' },
		{ value: 'tw', label: 'TW' }
	];

	let model = $state<LoadedModel | null>(null);
	let itemDb = $state<ItemDbJson | null>(null);
	let seasonLoot = $state<SeasonLootJson | null>(null);
	let loadError = $state<string | null>(null);
	let loading = $state(true);
	let catalogWarnings = $state<string[]>([]);

	let character = $state<CharacterState>(emptyCharacterState());
	let specKey = $state('');
	let baseStats = $state<CombatStats>(emptyStats());

	let armoryRegion = $state('eu');
	let armoryRealm = $state('');
	let armoryName = $state('');
	let armoryLoading = $state(false);
	let armoryError = $state<string | null>(null);
	let armoryWarnings = $state<string[]>([]);
	let equippedResolved = $state<ResolvedItem[]>([]);
	let loadedCharacter = $state<ArmoryCharacterResponse | null>(null);

	let seasonTrack = $state<SeasonTrackName>('Hero');
	let seasonRank = $state(6);
	let seasonResult = $state<SeasonSearchResult | null>(null);
	let seasonSearching = $state(false);
	let seasonSearchPaused = $state(false);
	let seasonSearchControl = $state<LoadoutSearchControl | null>(null);
	let seasonSearchSource = $state<LoadoutSearchSource | null>(null);
	let seasonSearchWorkers = $state(0);
	let seasonProgress = $state<LoadoutSearchProgress | null>(null);
	let seasonCombosPerSec = $state(0);
	let seasonProgressStartedAt = 0;
	let seasonPausedAccumMs = 0;
	let seasonPauseStartedAt = 0;
	let seasonBrowseInstance = $state('');
	/** Explicitly deselected season item ids (missing = included in search). */
	let seasonDeselectedIds = $state<Set<number>>(new Set());
	/** Season panel: Droptimizer-style farm priority vs full loadout scan. */
	let seasonPanelTab = $state<'farm' | 'bis'>('farm');
	type FarmSortKey = 'ev' | 'best' | 'name';
	let farmSortKey = $state<FarmSortKey>('ev');
	let farmGroupByInstance = $state(false);

	/**
	 * Season catalog + ΔDPS estimates are deferred so Armory character paint is not
	 * blocked by resolveSeasonCandidates / rankSeasonSlotGroups.
	 */
	let seasonProfileLoot = $state<{
		pieces: GearPiece[];
		warnings: string[];
		ilvl: number;
		rank: number;
	} | null>(null);
	let seasonRankedGroups = $state<RankedSeasonSlotGroup[]>([]);
	let seasonFarmRankGroups = $state<RankedSeasonSlotGroup[]>([]);
	let seasonLootLoading = $state(false);
	let seasonLootError = $state<string | null>(null);
	let seasonSearchError = $state<string | null>(null);
	let seasonLootEpoch = 0;

	const classSpecs = $derived(
		model && loadedCharacter?.characterClass
			? labeledSpecsForClass(model.specKeys, loadedCharacter.characterClass)
			: ([] as SpecLabel[])
	);
	const seasonReady = $derived(Boolean(seasonLoot && itemDb && model && specKey));
	const seasonTrackOptions = $derived(seasonLoot ? listSeasonTracks(seasonLoot) : []);
	const seasonRankOptions = $derived(seasonLoot?.tracks?.[seasonTrack]?.ranks ?? []);
	const seasonRankLabel = $derived.by(() => {
		const r = seasonRankOptions.find((x) => x.rank === seasonRank);
		return r ? `${r.rank}/6 · ilvl ${r.ilvl}` : String(seasonRank);
	});
	const seasonBrowseInstanceLabel = $derived(seasonBrowseInstance || 'All instances');
	const selectedClassSpecLabel = $derived.by(() => {
		const hit = classSpecs.find((s) => s.profileKey === specKey);
		return hit ? classRelativeSpecLabel(hit) : '';
	});
	const seasonSpecLabel = $derived(selectedClassSpecLabel || specKey);
	const seasonSourceIndex = $derived(
		seasonLoot ? buildSeasonItemSourceIndex(seasonLoot) : undefined
	);
	/** Display-only trigger labels for Select controls — purely presentational. */
	const armoryRegionLabel = $derived(
		ARMORY_REGIONS.find((r) => r.value === armoryRegion)?.label ?? armoryRegion.toUpperCase()
	);
	const armoryRealmOptions = $derived(realmsForRegion(armoryRegion as Region));
	const seasonBrowseInstances = $derived.by(() => {
		const pieces = seasonProfileLoot?.pieces ?? [];
		if (!pieces.length) return [];
		const counts = new Map<
			string,
			{ instanceName: string; instanceKind: string; itemCount: number }
		>();
		for (const piece of pieces) {
			const src = seasonSourceIndex?.get(piece.itemId);
			const name = piece.instanceName || src?.instanceName || 'Unknown';
			const kind = src?.instanceKind || 'Unknown';
			const key = `${kind}::${name}`;
			const prev = counts.get(key);
			if (prev) prev.itemCount += 1;
			else counts.set(key, { instanceName: name, instanceKind: kind, itemCount: 1 });
		}
		return [...counts.values()].sort((a, b) => {
			const ak = a.instanceKind === 'Raid' ? 0 : 1;
			const bk = b.instanceKind === 'Raid' ? 0 : 1;
			if (ak !== bk) return ak - bk;
			return a.instanceName.localeCompare(b.instanceName);
		});
	});
	const seasonBrowsePieces = $derived.by(() => {
		const pieces = seasonProfileLoot?.pieces ?? [];
		if (!pieces.length) return [] as GearPiece[];
		const inst = seasonBrowseInstance.trim();
		if (!inst) return pieces;
		return pieces.filter((piece) => {
			const name = piece.instanceName || seasonSourceIndex?.get(piece.itemId)?.instanceName || '';
			return name === inst;
		});
	});
	const seasonBisBySlot = $derived.by(() => {
		const map = new Map<number, GearPiece | null>();
		if (!seasonResult) return map;
		for (const row of seasonResult.slotRows) {
			if (row.isUpgrade && row.chosen) map.set(row.slotId, row.chosen);
		}
		return map;
	});
	const seasonInstanceRanks = $derived(rankSeasonInstancesFromEstimates(seasonFarmRankGroups));
	/** Actionable bosses only (EV > 0). */
	const seasonFarmPriorityRanks = $derived(seasonInstanceRanks.filter((r) => r.priority != null));
	const FARM_UPGRADE_ICON_CAP = 6;
	const FARM_SORT_OPTIONS: { value: FarmSortKey; label: string }[] = [
		{ value: 'ev', label: 'Expected Value' },
		{ value: 'best', label: 'Best upgrade' },
		{ value: 'name', label: 'Boss name' }
	];
	const farmSortLabel = $derived(
		FARM_SORT_OPTIONS.find((o) => o.value === farmSortKey)?.label ?? 'Expected Value'
	);

	function compareFarmBosses(
		a: SeasonBossFarmRank,
		b: SeasonBossFarmRank,
		key: FarmSortKey
	): number {
		if (key === 'best') {
			if (Math.abs(b.bestDps - a.bestDps) > 1e-6) return b.bestDps - a.bestDps;
			if (Math.abs(b.expectedValueDps - a.expectedValueDps) > 1e-6) {
				return b.expectedValueDps - a.expectedValueDps;
			}
			return a.encounterName.localeCompare(b.encounterName);
		}
		if (key === 'name') {
			const byName = a.encounterName.localeCompare(b.encounterName);
			if (byName !== 0) return byName;
			return (a.priority ?? 999) - (b.priority ?? 999);
		}
		if (Math.abs(b.expectedValueDps - a.expectedValueDps) > 1e-6) {
			return b.expectedValueDps - a.expectedValueDps;
		}
		if (Math.abs(b.bestDps - a.bestDps) > 1e-6) return b.bestDps - a.bestDps;
		return a.encounterName.localeCompare(b.encounterName);
	}

	const seasonFarmSortedRanks = $derived(
		[...seasonFarmPriorityRanks].sort((a, b) => compareFarmBosses(a, b, farmSortKey))
	);

	type FarmInstanceGroup = {
		instanceKind: string;
		instanceName: string;
		bosses: SeasonBossFarmRank[];
		groupEv: number;
		groupBest: number;
	};

	const seasonFarmGroupedRanks = $derived.by((): FarmInstanceGroup[] | null => {
		if (!farmGroupByInstance) return null;
		const map = new Map<string, FarmInstanceGroup>();
		for (const boss of seasonFarmPriorityRanks) {
			const key = `${boss.instanceKind}\0${boss.instanceName}`;
			let group = map.get(key);
			if (!group) {
				group = {
					instanceKind: boss.instanceKind,
					instanceName: boss.instanceName,
					bosses: [],
					groupEv: 0,
					groupBest: 0
				};
				map.set(key, group);
			}
			group.bosses.push(boss);
			if (boss.expectedValueDps > group.groupEv) group.groupEv = boss.expectedValueDps;
			if (boss.bestDps > group.groupBest) group.groupBest = boss.bestDps;
		}
		const groups = [...map.values()];
		for (const group of groups) {
			group.bosses.sort((a, b) => compareFarmBosses(a, b, farmSortKey));
		}
		groups.sort((a, b) => {
			if (farmSortKey === 'name') {
				const ak = a.instanceKind === 'Raid' ? 0 : 1;
				const bk = b.instanceKind === 'Raid' ? 0 : 1;
				if (ak !== bk) return ak - bk;
				return a.instanceName.localeCompare(b.instanceName);
			}
			if (farmSortKey === 'best') {
				if (Math.abs(b.groupBest - a.groupBest) > 1e-6) return b.groupBest - a.groupBest;
				return b.groupEv - a.groupEv;
			}
			if (Math.abs(b.groupEv - a.groupEv) > 1e-6) return b.groupEv - a.groupEv;
			return b.groupBest - a.groupBest;
		});
		return groups;
	});

	const seasonHasEstimates = $derived(
		seasonRankedGroups.some((g) => g.pieces.some((p) => p.estimateDelta != null))
	);
	const seasonSelectedCount = $derived.by(() => {
		return filterSeasonPiecesByDeselection(seasonBrowsePieces, seasonDeselectedIds).length;
	});
	const seasonComboEstimate = $derived.by(() => {
		const pieces = seasonProfileLoot?.pieces ?? [];
		if (!pieces.length || !specKey) return 0;
		return estimateSeasonComboCount(pieces, specKey, seasonDeselectedIds, {
			equipped: character.equipped,
			itemDb,
			instanceName: seasonBrowseInstance || null
		});
	});
	const equippedList = $derived.by(() => {
		if (character.equipped.length) {
			return character.equipped.map((p) => ({
				key: p.key || `eq:${p.itemId}`,
				piece: p,
				slotLabel:
					p.slotId != null
						? (SLOT_ID_LABELS[p.slotId] ?? String(p.slotId))
						: p.sourceLabel || (p.equipLoc ? slotLabel(p.equipLoc) : '—'),
				ilvl: p.ilvl
			}));
		}
		return equippedResolved.map((r) => ({
			key: `resolved:${r.itemId}`,
			piece: {
				itemId: r.itemId,
				link:
					r.bonusIds.length > 0 ? `item:${r.itemId}:${r.bonusIds.join(',')}` : `item:${r.itemId}`,
				ilvl: r.itemLevel,
				name: r.name,
				equipLoc: r.equipLoc || r.slot
			},
			slotLabel: r.equipLoc || r.slot ? slotLabel(r.equipLoc || r.slot || '') : '—',
			ilvl: r.itemLevel
		}));
	});
	const seasonProgressPct = $derived(
		seasonProgress && seasonProgress.total > 0
			? Math.min(100, (100 * seasonProgress.checked) / seasonProgress.total)
			: 0
	);

	/** Resolve + score season loot off the Armory paint path. */
	$effect(() => {
		const db = itemDb;
		const loot = seasonLoot;
		const profile = specKey;
		const track = seasonTrack;
		const rank = Number(seasonRank) || 6;
		const inst = seasonBrowseInstance.trim();
		const deselected = seasonDeselectedIds;
		const char = character;
		const stats = baseStats;
		const m = model;
		const bisBySlot = seasonResult ? seasonBisBySlot : null;
		const sourceIndex = seasonSourceIndex;
		const hasCharacter = Boolean(loadedCharacter);

		if (!db || !loot || !profile || !hasCharacter) {
			seasonProfileLoot = null;
			seasonRankedGroups = [];
			seasonFarmRankGroups = [];
			seasonLootLoading = false;
			seasonLootError = null;
			return;
		}

		seasonLootLoading = true;
		seasonLootError = null;
		const epoch = ++seasonLootEpoch;

		const timer = window.setTimeout(() => {
			void (async () => {
				// Let the updating indicator paint before the (often heavy) rescore.
				await tick();
				if (epoch !== seasonLootEpoch) return;
				try {
					const resolved = resolveSeasonCandidates(db, loot, track, rank, profile);
					if (epoch !== seasonLootEpoch) return;
					seasonProfileLoot = resolved;

					let browsePieces = resolved.pieces;
					if (inst) {
						browsePieces = browsePieces.filter((piece) => {
							const name = piece.instanceName || sourceIndex?.get(piece.itemId)?.instanceName || '';
							return name === inst;
						});
					}

					const scoringState: CharacterState = {
						...char,
						profileKey: profile || char.profileKey,
						stats: { ...stats }
					};
					const ready = char.equipped.some((p) => p.slotId != null);
					const farmPieces = filterSeasonPiecesByDeselection(browsePieces, deselected);

					seasonRankedGroups = rankSeasonSlotGroups(ready ? m : null, scoringState, browsePieces, {
						bisBySlot,
						itemDb: db
					});
					seasonFarmRankGroups = rankSeasonSlotGroups(ready ? m : null, scoringState, farmPieces, {
						bisBySlot,
						itemDb: db
					});
				} catch (err) {
					if (epoch !== seasonLootEpoch) return;
					seasonLootError = err instanceof Error ? err.message : 'Failed to score season loot.';
					seasonProfileLoot = null;
					seasonRankedGroups = [];
					seasonFarmRankGroups = [];
				} finally {
					if (epoch === seasonLootEpoch) seasonLootLoading = false;
				}
			})();
		}, 0);

		return () => {
			window.clearTimeout(timer);
		};
	});

	onMount(async () => {
		// Avoid renameLinks rewriting the DOM on every refreshLinks (expensive with many results).
		configureWowheadTooltips({
			colorLinks: true,
			// Season BiS uses custom ItemIcon markup; iconizeLinks rewrites those into Wowhead's
			// tiny icon grid whenever refreshLinks runs (e.g. after a selection toggle).
			iconizeLinks: false,
			renameLinks: false
		});
		try {
			const loaded = await loadGearingGameData();
			model = loaded.model;
			itemDb = loaded.itemDb;
			specKey = '';
			baseStats = emptyStats();
			character = emptyCharacterState();
			loadedCharacter = null;

			const loadedSeason = loaded.seasonLoot;
			seasonLoot = loadedSeason;
			if (loadedSeason) {
				const tracks = listSeasonTracks(loadedSeason);
				if (tracks.includes('Hero')) seasonTrack = 'Hero';
				else if (tracks[0]) seasonTrack = tracks[0];
				const defRank = loadedSeason.tracks[seasonTrack]?.defaultRank;
				if (defRank) seasonRank = defRank;
			}

			catalogWarnings = loaded.warnings;

			// Warm the loadout Worker once so season searches do not clone weights per click.
			void ensureLoadoutWorkerModel(loaded.model);
		} catch (err) {
			logClientError('gearing', 'failed to load gearing data', err);
			loadError = err instanceof Error ? err.message : 'Failed to load gearing data';
		} finally {
			loading = false;
		}
	});

	onDestroy(() => {
		disposeLoadoutWorker();
	});

	$effect(() => {
		// Bind Wowhead tooltips after result lists / season icons mount.
		void seasonResult;
		void equippedList;
		void seasonRankedGroups;
		if (typeof window === 'undefined') return;
		const id = window.setTimeout(() => refreshWowheadLinks(), 50);
		return () => window.clearTimeout(id);
	});

	$effect(() => {
		const ids = new Set((seasonProfileLoot?.pieces ?? []).map((p) => p.itemId));
		let changed = false;
		const next = new Set<number>();
		for (const id of seasonDeselectedIds) {
			if (ids.has(id)) next.add(id);
			else changed = true;
		}
		if (changed) seasonDeselectedIds = next;
	});

	/** Auto-deselect season icons that match equipped item id + ilvl (addon behavior). */
	$effect(() => {
		const pieces = seasonBrowsePieces;
		const equipped = character.equipped;
		if (!pieces.length || !equipped.length) return;
		const duplicates = collectEquippedDuplicateItemIds(pieces, equipped, specKey || undefined);
		if (!duplicates.size) return;
		let changed = false;
		const next = new Set(seasonDeselectedIds);
		for (const id of duplicates) {
			if (!next.has(id)) {
				next.add(id);
				changed = true;
			}
		}
		if (changed) {
			seasonDeselectedIds = next;
			seasonResult = null;
		}
	});

	const seasonEquippedDuplicates = $derived.by(() =>
		collectEquippedDuplicateItemIds(seasonBrowsePieces, character.equipped, specKey || undefined)
	);

	function isSeasonItemSelected(itemId: number): boolean {
		return !seasonDeselectedIds.has(itemId);
	}

	function setSeasonItemSelected(itemId: number, selected: boolean) {
		if (selected && seasonEquippedDuplicates.has(itemId)) return;
		const next = new Set(seasonDeselectedIds);
		if (selected) next.delete(itemId);
		else next.add(itemId);
		seasonDeselectedIds = next;
		seasonResult = null;
	}

	function selectAllSeasonItems() {
		const next = new Set(seasonEquippedDuplicates);
		seasonDeselectedIds = next;
		seasonResult = null;
	}

	function deselectAllSeasonItems() {
		seasonDeselectedIds = new Set((seasonProfileLoot?.pieces ?? []).map((p) => p.itemId));
		seasonResult = null;
	}

	function setSeasonSlotSelected(pieces: GearPiece[], selected: boolean) {
		const next = new Set(seasonDeselectedIds);
		for (const piece of pieces) {
			if (selected) {
				if (seasonEquippedDuplicates.has(piece.itemId)) continue;
				next.delete(piece.itemId);
			} else next.add(piece.itemId);
		}
		seasonDeselectedIds = next;
		seasonResult = null;
	}

	function formatComboEstimate(n: number): string {
		if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
		if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
		if (n >= 10_000) return `${(n / 1_000).toFixed(1)}k`;
		return n.toLocaleString('en-US');
	}

	function onSpecChange(value: string) {
		specKey = value;
		let nextStats = character.stats;
		if (loadedCharacter?.paperDoll) {
			nextStats = combatStatsFromArmoryPaperDoll(loadedCharacter.paperDoll, value);
			baseStats = nextStats;
		}
		character = { ...character, profileKey: value, stats: { ...nextStats } };
		seasonResult = null;
	}

	async function loadArmory() {
		if (!model || !itemDb) return;
		armoryError = null;
		armoryLoading = true;
		try {
			const armoryChar = await fetchArmoryCharacter({
				name: armoryName,
				realm: armoryRealm,
				region: armoryRegion
			});
			// Paint identity immediately; gear resolve + season scoring follow.
			loadedCharacter = armoryChar;
			armoryWarnings = armoryChar.notes ?? [];
			seasonProfileLoot = null;
			seasonRankedGroups = [];
			seasonFarmRankGroups = [];
			seasonLootLoading = Boolean(seasonLoot && itemDb);
			await tick();

			const result = resolveArmoryEquipment(itemDb, armoryChar, model.specKeys);
			equippedResolved = result.resolved;
			armoryWarnings = result.warnings;
			loadedCharacter = result.character;
			const classList = labeledSpecsForClass(model.specKeys, result.character.characterClass);
			const equippedPieces = annotatePiecesFromItemDb(
				armoryToEquippedPieces(armoryChar, result.resolved),
				itemDb
			);
			const dollFromGear = sumEquippedCombatStats(equippedPieces);
			let nextSpec =
				result.matchedSpecKey && classList.some((s) => s.profileKey === result.matchedSpecKey)
					? result.matchedSpecKey
					: (classList[0]?.profileKey ?? '');
			specKey = nextSpec;
			let nextChar: CharacterState = {
				...character,
				profileKey: nextSpec,
				equipped: equippedPieces,
				bags: [],
				vault: []
			};
			// Prefer live Battle.net statistics; else summed equipped ratings.
			if (hasCombatStats(result.stats)) {
				baseStats = result.stats;
				nextChar = { ...nextChar, stats: { ...baseStats } };
			} else if (hasCombatStats(dollFromGear)) {
				baseStats = dollFromGear;
				nextChar = { ...nextChar, stats: { ...baseStats } };
			}
			character = nextChar;
			seasonResult = null;
			await tick();
		} catch (err) {
			armoryError = err instanceof Error ? err.message : 'Armory load failed';
			armoryWarnings = [];
			loadedCharacter = null;
		} finally {
			armoryLoading = false;
		}
	}

	/** Pick from Battle.net roster → fill Armory fields and load. */
	function loadCharacterFromAccount(char: {
		characterName: string;
		region: string;
		realm: string;
	}) {
		armoryRegion = char.region.toLowerCase();
		armoryRealm = char.realm;
		armoryName = char.characterName;
		void loadArmory();
	}

	async function runSeasonSearch() {
		if (!model || !itemDb || !seasonLoot || !specKey) return;
		const control = new LoadoutSearchControl();
		seasonSearchControl = control;
		seasonSearching = true;
		seasonSearchPaused = false;
		seasonSearchError = null;
		seasonSearchSource = null;
		seasonSearchWorkers = 0;
		seasonCombosPerSec = 0;
		seasonPausedAccumMs = 0;
		seasonPauseStartedAt = 0;
		seasonProgressStartedAt = performance.now();
		seasonProgress = {
			checked: 0,
			total: 0,
			maxCombinations: 0,
			baseDps: 0,
			bestDps: 0
		};
		// Let "Searching…" paint before any heavy work / structured clone.
		await tick();
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
		try {
			const state: CharacterState = {
				...character,
				profileKey: specKey,
				stats: { ...baseStats }
			};
			const outcome = await searchBestSeasonLoadoutAsync(
				model,
				state,
				itemDb,
				seasonLoot,
				seasonTrack,
				{
					rank: Number(seasonRank) || 6,
					deselectedItemIds: seasonDeselectedIds,
					instanceName: seasonBrowseInstance || null,
					control,
					onProgress: (p) => {
						seasonProgress = p;
						const now = performance.now();
						let pausedMs = seasonPausedAccumMs;
						if (seasonSearchPaused && seasonPauseStartedAt > 0) {
							pausedMs += now - seasonPauseStartedAt;
						}
						const elapsed = (now - seasonProgressStartedAt - pausedMs) / 1000;
						if (elapsed > 0.05 && p.checked > 0) {
							seasonCombosPerSec = Math.round(p.checked / elapsed);
						}
					}
				}
			);
			seasonResult = outcome.result;
			seasonSearchSource = outcome.source;
			seasonSearchWorkers = outcome.workers;
		} catch (err) {
			if (!control.stopped) {
				seasonSearchError = err instanceof Error ? err.message : 'Season BiS search failed.';
			}
		} finally {
			requestAnimationFrame(() => {
				seasonSearching = false;
				seasonSearchPaused = false;
				seasonSearchControl = null;
				seasonProgress = null;
				seasonPauseStartedAt = 0;
			});
		}
	}

	function pauseSeasonSearch() {
		if (!seasonSearching || seasonSearchPaused) return;
		seasonSearchControl?.pause();
		seasonSearchPaused = true;
		seasonPauseStartedAt = performance.now();
	}

	function resumeSeasonSearch() {
		if (!seasonSearching || !seasonSearchPaused) return;
		if (seasonPauseStartedAt > 0) {
			seasonPausedAccumMs += performance.now() - seasonPauseStartedAt;
			seasonPauseStartedAt = 0;
		}
		seasonSearchControl?.resume();
		seasonSearchPaused = false;
	}

	function stopSeasonSearch() {
		if (!seasonSearching) return;
		seasonSearchControl?.stop();
		seasonSearchPaused = false;
		seasonPauseStartedAt = 0;
	}

	function onSeasonTrackChange(value: string) {
		seasonTrack = value as SeasonTrackName;
		seasonResult = null;
		const def = seasonLoot?.tracks?.[seasonTrack]?.defaultRank;
		if (def) seasonRank = def;
	}

	function onSeasonRankChange(value: string) {
		seasonRank = Number(value) || seasonRank;
		seasonResult = null;
	}
</script>

<WowheadScripts />
<SEO
	title={PAGE_SEO.gearing.title}
	description={PAGE_SEO.gearing.description}
	keywords="WoW gearing, farm priority, DPS estimator, SimulationCraft, season BiS, Battle.net Armory, dungeon loot, raid loot, Mr Mythical"
/>

<main class="home">
	<header class="page-header">
		<p class="page-eyebrow">Battle.net</p>
		<h1 class="page-title">See what to farm first.</h1>
		<p class="page-lede">
			Load equipped gear from Battle.net, then rank Midnight Season 2 dungeon and raid loot in the
			browser. Typical farm scans finish immediately, with no SimulationCraft wait.
		</p>
		<div class="header-actions">
			<a href="/addons/dps-predictor" class="tool-link">
				Use the in-game addon
				<svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true" fill="none">
					<path
						d="M3 2l5 4-5 4"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</a>
		</div>
	</header>

	<section class="farm-how" aria-labelledby="farm-how-heading">
		<h2 id="farm-how-heading" class="tool-title">How farm priority works</h2>
		<ol class="farm-how-list">
			<li>Load equipped gear from Battle.net.</li>
			<li>Rank Midnight Season 2 dungeon and raid bosses by upgrade value.</li>
			<li>Typical farm scans finish immediately. Full BiS search can take longer.</li>
		</ol>
		<p class="tool-body">
			Same SimC-trained DPS estimator as the in-game addon, not a SimulationCraft run. Use
			<a href="/addons/dps-predictor" class="text-link font-semibold">/mrdps in game</a>
			for bag loadouts and crest plans on the character.
		</p>
	</section>

	{#if loading}
		<p class="status">Loading model and item database…</p>
	{:else if loadError}
		<p class="status status--error" role="alert">{loadError}</p>
	{:else if model && itemDb}
		<section class="tools">
			{#if catalogWarnings.length}
				{#each catalogWarnings as warning (warning)}
					<p class="status status--error" role="alert">{warning}</p>
				{/each}
			{/if}

			<article class="tool-row">
				<div class="tool-copy">
					<p class="tool-eyebrow">Character</p>
					{#if loadedCharacter}
						<h2 class="tool-title">{loadedCharacter.name}</h2>
						<p class="tool-body">
							{#if loadedCharacter.level != null}
								Level {loadedCharacter.level}
							{/if}
							{#if loadedCharacter.characterClass}
								{loadedCharacter.level != null ? ' ' : ''}{loadedCharacter.characterClass}
							{/if}
							{#if loadedCharacter.activeSpec}
								· {loadedCharacter.activeSpec}
							{/if}
						</p>
						<p class="meta-line">
							{loadedCharacter.realm}
							({loadedCharacter.region.toUpperCase()})
						</p>
						{#if classSpecs.length}
							<div class="field spec-field">
								<Label for="spec-key">Spec</Label>
								<Select.Root
									type="single"
									value={specKey}
									onValueChange={(v) => v && onSpecChange(v)}
								>
									<Select.Trigger id="spec-key" class="w-full">
										{selectedClassSpecLabel || 'Select spec'}
									</Select.Trigger>
									<Select.Content>
										{#each classSpecs as s (s.profileKey)}
											<Select.Item value={s.profileKey} label={classRelativeSpecLabel(s)}>
												{classRelativeSpecLabel(s)}
											</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</div>
						{:else}
							<p class="meta-line">
								No trained model profiles for {loadedCharacter.characterClass ?? 'this class'}.
							</p>
						{/if}
					{:else}
						<h2 class="tool-title">Load from Battle.net.</h2>
						<p class="tool-body">
							Sign in to pick from your roster, or enter region, realm, and name.
						</p>
					{/if}
				</div>
				<div class="tool-side">
					<div class="armory-load-grid">
						<div class="armory-panel">
							<p class="field-kicker">Battle.net roster</p>
							<BnetCharacterPicker
								loadCharacter={loadCharacterFromAccount}
								disabled={armoryLoading}
							/>
						</div>
						<div class="armory-panel">
							<p class="field-kicker">Load manually</p>
							<div class="field-grid">
								<div class="field">
									<Label for="armory-region">Region</Label>
									<Select.Root
										type="single"
										value={armoryRegion}
										onValueChange={(v) => {
											if (!v) return;
											armoryRegion = v;
											const nextRealms = realmsForRegion(v as Region);
											if (!nextRealms.some((o) => o.value === armoryRealm)) {
												armoryRealm = '';
											}
										}}
									>
										<Select.Trigger id="armory-region" class="w-full">
											{armoryRegionLabel}
										</Select.Trigger>
										<Select.Content>
											{#each ARMORY_REGIONS as opt (opt.value)}
												<Select.Item value={opt.value} label={opt.label}>{opt.label}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								</div>
								<div class="field">
									<Label for="armory-realm-combobox">Realm</Label>
									<RealmCombobox
										options={armoryRealmOptions}
										selectedValue={armoryRealm}
										triggerId="armory-realm-combobox"
										onSelect={(value) => {
											armoryRealm = value;
										}}
									/>
								</div>
								<div class="field">
									<Label for="armory-name">Character</Label>
									<Input id="armory-name" bind:value={armoryName} placeholder="Name" />
								</div>
							</div>
							<div class="row-actions">
								<Button
									type="button"
									variant="default"
									onclick={loadArmory}
									disabled={armoryLoading || !armoryName.trim() || !armoryRealm.trim()}
								>
									{armoryLoading ? 'Loading…' : 'Load from Armory'}
								</Button>
							</div>
							{#if armoryError}
								<p class="status status--error" role="alert">{armoryError}</p>
							{/if}
							{#if armoryWarnings.length}
								<ul class="warn-list">
									{#each armoryWarnings as w (w)}
										<li>{w}</li>
									{/each}
								</ul>
							{/if}
						</div>
					</div>
				</div>
				{#if loadedCharacter && equippedList.length}
					<div class="equip-inspect">
						<p class="field-kicker">Currently worn</p>
						<ul class="result-list">
							{#each equippedList as eq (eq.key)}
								<li>
									<span class="result-slot">{eq.slotLabel}</span>
									<span class="result-name">
										<ItemLink piece={eq.piece} />
									</span>
									{#if eq.ilvl}
										<span class="result-vs">ilvl {eq.ilvl}</span>
									{/if}
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</article>

			{#if !seasonLoot}
				<article class="tool-row tool-row--full">
					<div class="tool-copy">
						<p class="tool-eyebrow">Season loot</p>
						<h2 class="tool-title">Catalog unavailable.</h2>
						<p class="tool-body">Season loot failed to load. Refresh the page to try again.</p>
					</div>
				</article>
			{:else if loadedCharacter && !specKey}
				<article class="tool-row tool-row--full">
					<div class="tool-copy">
						<p class="tool-eyebrow">Season loot</p>
						<h2 class="tool-title">Choose a spec.</h2>
						<p class="tool-body">Pick a spec above to see usable season loot and run a BiS scan.</p>
					</div>
				</article>
			{:else if loadedCharacter && seasonLootLoading && !seasonProfileLoot}
				<article class="tool-row tool-row--full">
					<p class="status" aria-live="polite">Loading season loot for this spec…</p>
				</article>
			{:else if loadedCharacter}
				<article class="tool-row tool-row--full">
					<div class="tool-copy">
						<p class="tool-eyebrow">Season scan</p>
						<h2 class="tool-title">Farm priority and BiS.</h2>
						<p class="tool-body">
							Rank bosses by expected upgrade value as soon as your gear is loaded, or search the
							full season catalog for a loadout. A full BiS search can take longer.
						</p>
					</div>
					<div class="season-panel">
						<div class="filter-grid">
							<div class="field">
								<Label for="season-track">Upgrade track</Label>
								<Select.Root
									type="single"
									value={seasonTrack}
									onValueChange={(v) => v && onSeasonTrackChange(v)}
								>
									<Select.Trigger id="season-track" class="w-full">
										{seasonTrack}
									</Select.Trigger>
									<Select.Content>
										{#each seasonTrackOptions as t (t)}
											<Select.Item value={t} label={t}>{t}</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</div>
							<div class="field">
								<Label for="season-rank">Rank</Label>
								<Select.Root
									type="single"
									value={String(seasonRank)}
									onValueChange={(v) => v && onSeasonRankChange(v)}
								>
									<Select.Trigger id="season-rank" class="w-full">
										{seasonRankLabel}
									</Select.Trigger>
									<Select.Content>
										{#each seasonRankOptions as r (r.rank)}
											<Select.Item value={String(r.rank)} label={`${r.rank}/6 · ilvl ${r.ilvl}`}>
												{r.rank}/6 · ilvl {r.ilvl}
											</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</div>
							<div class="field">
								<Label for="season-browse-instance">Instance filter</Label>
								<Select.Root
									type="single"
									value={seasonBrowseInstance}
									onValueChange={(v) => (seasonBrowseInstance = v ?? '')}
								>
									<Select.Trigger id="season-browse-instance" class="w-full">
										{seasonBrowseInstanceLabel}
									</Select.Trigger>
									<Select.Content>
										<Select.Item value="" label="All instances">All instances</Select.Item>
										{#each seasonBrowseInstances as inst (`${inst.instanceKind}:${inst.instanceName}`)}
											<Select.Item
												value={inst.instanceName}
												label={`${inst.instanceKind}: ${inst.instanceName} (${inst.itemCount})`}
											>
												{inst.instanceKind}: {inst.instanceName} ({inst.itemCount})
											</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</div>
						</div>

						{#if seasonLootLoading}
							<div class="search-progress" role="status" aria-live="polite" aria-busy="true">
								<div class="search-progress-track">
									<div class="search-progress-bar search-progress-bar--indeterminate"></div>
								</div>
								<p class="search-progress-label">
									Updating estimates · {seasonTrack}
									{seasonRank}/6
									{#if seasonBrowseInstance}
										· {seasonBrowseInstance}
									{/if}
								</p>
							</div>
						{/if}

						<Tabs.Root bind:value={seasonPanelTab}>
							<div class="season-switch">
								<Button
									type="button"
									variant={seasonPanelTab === 'farm' ? 'default' : 'outline'}
									aria-pressed={seasonPanelTab === 'farm'}
									onclick={() => (seasonPanelTab = 'farm')}
								>
									Farm priority
								</Button>
								<Button
									type="button"
									variant={seasonPanelTab === 'bis' ? 'default' : 'outline'}
									aria-pressed={seasonPanelTab === 'bis'}
									onclick={() => (seasonPanelTab = 'bis')}
								>
									Season BiS
								</Button>
							</div>

							<Tabs.Content value="farm">
								{#if seasonLootError}
									<p class="status status--error" role="alert">{seasonLootError}</p>
								{/if}
								{#if seasonFarmPriorityRanks.length > 0}
									<div
										class="instance-farm-list"
										class:is-stale={seasonLootLoading}
										aria-busy={seasonLootLoading}
									>
										<div class="farm-toolbar">
											<p class="meta-line">
												Boss EV from single-swap estimates · {seasonTrack}
												{seasonRank}/6
												{#if seasonBrowseInstance}
													· {seasonBrowseInstance} only
												{/if}
											</p>
											<div class="farm-toolbar-controls">
												<div class="farm-group-toggle">
													<Checkbox id="farm-group-instance" bind:checked={farmGroupByInstance} />
													<Label for="farm-group-instance">Group by instance</Label>
												</div>
												<div class="farm-sort">
													<Label for="farm-sort" class="sr-only">Sort farm priority</Label>
													<Select.Root
														type="single"
														value={farmSortKey}
														onValueChange={(v) => {
															if (v === 'ev' || v === 'best' || v === 'name') farmSortKey = v;
														}}
													>
														<Select.Trigger id="farm-sort" class="w-[11.5rem]">
															Sort: {farmSortLabel}
														</Select.Trigger>
														<Select.Content>
															{#each FARM_SORT_OPTIONS as opt (opt.value)}
																<Select.Item value={opt.value} label={opt.label}>
																	{opt.label}
																</Select.Item>
															{/each}
														</Select.Content>
													</Select.Root>
												</div>
											</div>
										</div>

										{#snippet farmBossRow(inst: SeasonBossFarmRank)}
											{@const shownDrops = inst.upgrades.slice(0, FARM_UPGRADE_ICON_CAP)}
											{@const moreDrops = inst.upgrades.length - shownDrops.length}
											<li class="farm-rank-item">
												<div class="farm-rank-row">
													<span class="farm-priority" aria-label={`Priority ${inst.priority}`}>
														{inst.priority}
													</span>
													<div class="farm-boss">
														<span class="farm-boss-name">{inst.encounterName}</span>
														{#if !seasonBrowseInstance && !farmGroupByInstance}
															<span class="meta-line">
																{inst.instanceKind} · {inst.instanceName}
															</span>
														{/if}
													</div>
													<div class="farm-stats" aria-label="Expected value and best upgrade">
														<span class="farm-stat">
															<span class="farm-stat-label">EV</span>
															<span
																class="result-delta"
																class:is-up={inst.expectedValueDps > 0}
																class:is-down={inst.expectedValueDps < 0}
															>
																{formatDelta(inst.expectedValueDps)}
															</span>
														</span>
														<span class="farm-stat">
															<span class="farm-stat-label">Best</span>
															<span
																class="result-delta"
																class:is-up={inst.bestDps > 0}
																class:is-down={inst.bestDps < 0}
															>
																{formatDelta(inst.bestDps)}
															</span>
														</span>
													</div>
												</div>
												{#if shownDrops.length > 0}
													<div class="farm-upgrade-icons">
														{#each shownDrops as up (`${inst.encounterName}:${up.slotId}:${up.piece.itemId}`)}
															{@const isUpgrade = up.estimateDelta > 0}
															<ItemIcon
																piece={up.piece}
																delta={up.estimateDelta}
																muted={!isUpgrade}
																title={`${up.slotLabel} · ${up.piece.name || up.piece.itemId} · ${formatDelta(up.estimateDelta)} DPS${!isUpgrade ? ' · not an upgrade' : ''}${up.equipped ? ` · vs ${up.equipped.name || up.equipped.itemId}` : ' · vs empty'}`}
															/>
														{/each}
														{#if moreDrops > 0}
															<span class="farm-more meta-line">+{moreDrops} more</span>
														{/if}
													</div>
												{/if}
											</li>
										{/snippet}

										{#if seasonFarmGroupedRanks}
											<div class="farm-instance-groups">
												{#each seasonFarmGroupedRanks as group (`${group.instanceKind}:${group.instanceName}`)}
													<section class="farm-instance-group">
														<header class="farm-instance-heading">
															<span class="farm-instance-title">
																{group.instanceKind}: {group.instanceName}
															</span>
															<span class="farm-stats">
																<span class="farm-stat">
																	<span class="farm-stat-label">EV</span>
																	<span
																		class="result-delta"
																		class:is-up={group.groupEv > 0}
																		class:is-down={group.groupEv < 0}
																	>
																		{formatDelta(group.groupEv)}
																	</span>
																</span>
																<span class="farm-stat">
																	<span class="farm-stat-label">Best</span>
																	<span
																		class="result-delta"
																		class:is-up={group.groupBest > 0}
																		class:is-down={group.groupBest < 0}
																	>
																		{formatDelta(group.groupBest)}
																	</span>
																</span>
															</span>
														</header>
														<ol class="farm-rank-list">
															{#each group.bosses as inst (`${inst.instanceKind}:${inst.instanceName}:${inst.encounterName}`)}
																{@render farmBossRow(inst)}
															{/each}
														</ol>
													</section>
												{/each}
											</div>
										{:else}
											<ol class="farm-rank-list">
												{#each seasonFarmSortedRanks as inst (`${inst.instanceKind}:${inst.instanceName}:${inst.encounterName}`)}
													{@render farmBossRow(inst)}
												{/each}
											</ol>
										{/if}
									</div>
								{:else if seasonHasEstimates}
									<p class="meta-line">
										No positive upgrades vs your equipped gear at this track. Nothing to farm.
									</p>
								{:else}
									<p class="meta-line">
										Load equipped gear from Armory to score bosses against your current setup.
									</p>
								{/if}
							</Tabs.Content>

							<Tabs.Content value="bis">
								{#if seasonLootError}
									<p class="status status--error" role="alert">{seasonLootError}</p>
								{/if}
								{#if seasonLootLoading && !seasonProfileLoot}
									<p class="status" aria-live="polite">Loading season loot…</p>
								{:else if seasonProfileLoot}
									<p class="meta-line">
										{seasonSelectedCount.toLocaleString('en-US')} /
										{seasonBrowsePieces.length.toLocaleString('en-US')} selected for
										{' '}{seasonSpecLabel || 'this spec'} · {formatComboEstimate(
											seasonComboEstimate
										)}
										combos · {seasonTrack}
										{seasonRank}/6 · ilvl {seasonProfileLoot.ilvl}
										{#if seasonBrowseInstance}
											· {seasonBrowseInstance} only
										{/if}
										{#if seasonLootLoading}
											· scoring estimates…
										{:else if seasonHasEstimates}
											· sorted by estimated ΔDPS vs equipped
										{/if}
									</p>
									<div class="row-actions season-select-actions">
										<Button
											type="button"
											variant="outline"
											size="sm"
											onclick={selectAllSeasonItems}
										>
											Select all
										</Button>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onclick={deselectAllSeasonItems}
										>
											Deselect all
										</Button>
									</div>
									{#if seasonLootLoading && seasonRankedGroups.length === 0}
										<p class="status" aria-live="polite">Scoring season icons…</p>
									{:else if seasonRankedGroups.length === 0}
										<p class="meta-line">No usable loot matches this filter.</p>
									{:else}
										<div
											class="season-slot-groups"
											class:is-stale={seasonLootLoading}
											aria-busy={seasonLootLoading}
										>
											{#each seasonRankedGroups as group (group.slotId)}
												{@const selectedInSlot = group.pieces.filter((p) =>
													isSeasonItemSelected(p.piece.itemId)
												).length}
												<section class="season-slot-row">
													<div class="season-slot-label">
														<span class="result-slot">{group.slotLabel}</span>
														<span class="meta-line">
															{selectedInSlot}/{group.pieces.length}
														</span>
														<div class="season-slot-actions">
															<button
																type="button"
																class="text-action"
																onclick={() =>
																	setSeasonSlotSelected(
																		group.pieces.map((p) => p.piece),
																		true
																	)}
															>
																All
															</button>
															<button
																type="button"
																class="text-action"
																onclick={() =>
																	setSeasonSlotSelected(
																		group.pieces.map((p) => p.piece),
																		false
																	)}
															>
																None
															</button>
														</div>
													</div>
													<div class="season-slot-icons">
														{#if group.equipped}
															<ItemIcon
																piece={group.equipped}
																equipped
																title={`Equipped · ${group.equipped.name || group.equipped.itemId}${group.equipped.ilvl ? ` · ilvl ${group.equipped.ilvl}` : ''}`}
															/>
														{/if}
														{#each group.pieces as ranked (`${group.slotId}:${ranked.piece.itemId}`)}
															{@const selected = isSeasonItemSelected(ranked.piece.itemId)}
															{@const isDuplicate = seasonEquippedDuplicates.has(
																ranked.piece.itemId
															)}
															{@const badgeDelta = ranked.estimateDelta}
															<ItemIcon
																piece={ranked.piece}
																{selected}
																bis={ranked.isBisPick}
																delta={badgeDelta}
																deltaIsActual={false}
																title={`${isDuplicate ? 'Same item at equal/lower ilvl than equipped — not in search' : selected ? 'Click to deselect' : 'Click to select'} · ${ranked.piece.name || ranked.piece.itemId}${ranked.piece.instanceName ? ` · ${ranked.piece.instanceName}` : ''}${!isDuplicate && badgeDelta != null ? ` · ${ranked.weaponPairScored ? 'weapon est.' : 'est.'} ${formatDelta(badgeDelta)} DPS` : ''}${!isDuplicate && ranked.estimateDps != null ? ` (${formatDps(ranked.estimateDps)}${ranked.weaponPairScored ? ' keep other hand' : ' with swap'})` : ''}`}
																onclick={() => {
																	if (isDuplicate && !selected) return;
																	setSeasonItemSelected(ranked.piece.itemId, !selected);
																}}
															/>
														{/each}
													</div>
												</section>
											{/each}
										</div>
										<p class="meta-line">
											Gold icon = currently equipped · same item at equal or lower ilvl is
											deselected · click other icons to include/exclude (green = in, red = out)
											{#if seasonHasEstimates}
												· badges show single-swap ΔDPS vs equipped (weapons keep your other hand)
											{/if}
											{#if seasonResult}
												· gold border = in the BiS loadout
											{/if}
											· hover for Wowhead tooltip
										</p>
									{/if}
								{/if}

								<div class="row-actions">
									{#if seasonSearching}
										{#if seasonSearchPaused}
											<Button type="button" variant="secondary" onclick={resumeSeasonSearch}>
												Resume
											</Button>
										{:else}
											<Button type="button" variant="secondary" onclick={pauseSeasonSearch}>
												Pause
											</Button>
										{/if}
										<Button type="button" variant="destructive" onclick={stopSeasonSearch}>
											Stop
										</Button>
									{:else}
										<Button
											type="button"
											variant="default"
											onclick={runSeasonSearch}
											disabled={!seasonReady || seasonSelectedCount === 0}
										>
											Find season loadout
										</Button>
									{/if}
									{#if seasonSearchError}
										<p class="status status--error" role="alert">{seasonSearchError}</p>
									{/if}
									<p class="meta-line">
										{seasonSelectedCount.toLocaleString('en-US')} candidates ·
										{formatComboEstimate(seasonComboEstimate)} combos · {seasonTrack}
										{seasonRank}/6
										{#if seasonBrowseInstance}
											· {seasonBrowseInstance} only
										{/if}
									</p>
								</div>

								{#if seasonSearching && seasonProgress}
									<div
										class="search-progress"
										role="progressbar"
										aria-valuemin={0}
										aria-valuemax={100}
										aria-valuenow={Math.round(seasonProgressPct)}
										aria-label="Season loadout search progress"
									>
										<div class="search-progress-track">
											<div class="search-progress-bar" style={`width: ${seasonProgressPct}%`}></div>
										</div>
										<p class="search-progress-label">
											{#if seasonSearchPaused}
												Paused ·
											{/if}
											{seasonProgress.checked.toLocaleString('en-US')} /
											{seasonProgress.total.toLocaleString('en-US')} combos
											{#if !seasonSearchPaused && seasonCombosPerSec > 0}
												· {seasonCombosPerSec.toLocaleString('en-US')}/s
											{/if}
											{#if seasonProgress.baseDps > 0}
												· best {formatDelta(seasonProgress.bestDps - seasonProgress.baseDps)} DPS
											{/if}
										</p>
									</div>
								{/if}

								{#if seasonResult}
									<div class="delta-panel" aria-live="polite">
										<p
											class="delta-main"
											class:is-up={seasonResult.delta > 0}
											class:is-down={seasonResult.delta < 0}
										>
											{formatDelta(seasonResult.delta)} DPS
										</p>
										<p class="delta-sub">
											{formatDps(seasonResult.baseDps)} → {formatDps(seasonResult.bestDps)} ·
											{seasonResult.candidateCount} candidates ·
											{seasonResult.combinationsChecked.toLocaleString('en-US')} combos
											{#if seasonResult.combinationsCapped}
												(capped)
											{/if}
											{#if seasonResult.stopped}
												(stopped early)
											{/if}
											· ilvl {seasonResult.ilvl}
											{#if seasonSearchSource}
												· {seasonSearchSource === 'worker'
													? seasonSearchWorkers > 1
														? `${seasonSearchWorkers} workers`
														: 'worker'
													: 'main thread'}
											{/if}
										</p>
									</div>

									{#if seasonResult.warnings.length}
										<ul class="warn-list">
											{#each seasonResult.warnings as w (w)}
												<li>{w}</li>
											{/each}
										</ul>
									{/if}

									{#if seasonResult.slotRows.some((r) => r.isUpgrade)}
										<ul class="result-list">
											{#each seasonResult.slotRows.filter((r) => r.isUpgrade) as row (row.slotId)}
												<li>
													<span class="result-slot">{row.slotLabel}</span>
													<span class="result-name">
														<ItemLink
															piece={row.chosen}
															fallback={String(row.chosen?.itemId ?? '—')}
														/>
													</span>
													<span class="result-vs">
														{row.chosen?.sourceLabel || 'Season'} · vs
														{#if row.equipped}
															<ItemLink piece={row.equipped} fallback="empty" />
														{:else}
															empty
														{/if}
													</span>
												</li>
											{/each}
										</ul>
									{:else if seasonResult.combinationsChecked > 0}
										<p class="meta-line">Already optimal vs the season catalog at this track.</p>
									{/if}
								{/if}
							</Tabs.Content>
						</Tabs.Root>
					</div>
				</article>
			{/if}
		</section>
	{/if}

	<section class="about" role="note">
		<p class="tool-eyebrow">Limits</p>
		<h2 class="tool-title">This is an estimate, not a sim.</h2>
		<p class="about-body">
			A DPS estimate trained on SimulationCraft, not a live SimC run. Typical farm ranks finish
			immediately. A full season BiS search can take longer. It does not model trinket procs,
			rotations, or set bonuses the way a full sim does. Confirm close calls with a real sim when it
			matters.
		</p>
	</section>
</main>

<Footer />

<style>
	.home {
		max-width: 1200px;
		margin: 0 auto;
		padding: 32px 24px 80px;
		display: flex;
		flex-direction: column;
		gap: 40px;
	}

	@media (max-width: 720px) {
		.home {
			padding: 16px 16px 48px;
			gap: 28px;
		}
	}

	.page-header {
		display: flex;
		flex-direction: column;
		gap: 6px;
		max-width: 72ch;
		padding-bottom: clamp(8px, 1.5vw, 16px);
	}

	.page-eyebrow {
		font-family: var(--font-body);
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: hsl(var(--link));
		margin: 0;
	}

	.page-title {
		font-family: var(--font-heading);
		font-size: clamp(1.75rem, 4vw, 2.5rem);
		font-weight: 700;
		line-height: 1.08;
		letter-spacing: -0.02em;
		color: hsl(var(--foreground));
		margin: 0;
	}

	.farm-how {
		display: flex;
		flex-direction: column;
		gap: 10px;
		max-width: 72ch;
	}

	.farm-how-list {
		margin: 0;
		padding-left: 1.25rem;
		font-family: var(--font-body);
		font-size: 0.9375rem;
		line-height: 1.5;
		color: hsl(var(--muted-foreground));
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.page-lede {
		font-family: var(--font-body);
		font-size: 0.9375rem;
		line-height: 1.45;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	.header-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px 14px;
		margin-top: 10px;
	}

	.tools {
		display: flex;
		flex-direction: column;
	}

	.tool-row {
		display: grid;
		grid-template-columns: minmax(0, 1.05fr) minmax(0, 1.2fr);
		gap: clamp(24px, 4vw, 56px);
		padding: 36px 0;
		border-top: 1px solid hsl(var(--border));
		align-items: start;
	}

	.tool-row--full {
		grid-template-columns: 1fr;
	}

	@media (max-width: 800px) {
		.tool-row {
			grid-template-columns: 1fr;
			gap: 20px;
			padding: 28px 0;
		}
	}

	.tool-copy,
	.tool-side {
		display: flex;
		flex-direction: column;
		gap: 10px;
		min-width: 0;
	}

	.tool-eyebrow {
		font-family: var(--font-body);
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: hsl(var(--link));
		margin: 0;
	}

	.tool-title {
		font-family: var(--font-heading);
		font-size: clamp(1.5rem, 2.4vw, 1.777rem);
		font-weight: 700;
		line-height: 1.15;
		letter-spacing: -0.015em;
		color: hsl(var(--foreground));
		margin: 0;
	}

	.tool-body {
		font-family: var(--font-body);
		font-size: 0.9375rem;
		line-height: 1.5;
		color: hsl(var(--muted-foreground));
		margin: 0;
		max-width: 56ch;
	}

	.tool-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-family: var(--font-body);
		font-size: 0.9375rem;
		font-weight: 500;
		color: hsl(var(--foreground));
		text-decoration: none;
		border-bottom: 1px solid hsl(var(--primary));
		padding-bottom: 2px;
		width: fit-content;
		transition: color 150ms cubic-bezier(0.25, 1, 0.5, 1);
	}

	.tool-link:hover {
		color: hsl(var(--link));
		border-bottom-color: hsl(var(--link));
	}

	.tool-link:focus-visible {
		outline: 2px solid hsl(var(--ring));
		outline-offset: 4px;
		border-radius: 2px;
	}

	.about {
		display: flex;
		flex-direction: column;
		gap: 10px;
		max-width: 72ch;
		padding-top: 36px;
		border-top: 1px solid hsl(var(--border));
	}

	.about-body {
		font-family: var(--font-body);
		font-size: 0.9375rem;
		line-height: 1.55;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	.status {
		font-family: var(--font-body);
		font-size: 0.9375rem;
		line-height: 1.45;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	.status--error {
		color: hsl(var(--destructive, 0 70% 45%));
	}

	.armory-load-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 24px 32px;
		align-items: start;
	}

	.armory-panel {
		display: flex;
		flex-direction: column;
		gap: 12px;
		min-width: 0;
	}

	.field-kicker {
		margin: 0;
		font-family: var(--font-body);
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground));
	}

	.field-grid,
	.filter-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 12px;
	}

	.filter-grid {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		min-width: 0;
	}

	.spec-field {
		max-width: 18rem;
		margin-top: 6px;
	}

	.field :global([data-slot='label']) {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground));
	}

	.season-panel {
		display: flex;
		flex-direction: column;
		gap: 20px;
		min-width: 0;
	}

	.season-panel :global([data-slot='tabs']) {
		display: flex;
		flex-direction: column;
		gap: 16px;
		width: 100%;
	}

	.season-panel :global([data-slot='tabs-content']) {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.season-switch {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	@media (max-width: 800px) {
		.armory-load-grid,
		.filter-grid {
			grid-template-columns: 1fr;
		}

		.equip-inspect .result-list {
			grid-template-columns: 1fr;
		}
	}

	.row-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px 14px;
	}

	.search-progress {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 4px;
		padding: 4px 0;
	}

	.search-progress-track {
		height: 6px;
		border-radius: 999px;
		background: hsl(var(--muted-foreground) / 0.18);
		overflow: hidden;
	}

	.search-progress-bar {
		height: 100%;
		border-radius: 999px;
		background: hsl(var(--link));
		min-width: 0;
		transition: width 120ms linear;
	}

	.search-progress-bar--indeterminate {
		width: 32%;
		min-width: 4rem;
		transition: none;
		animation: scan-indeterminate 1.2s ease-in-out infinite;
	}

	@keyframes scan-indeterminate {
		0% {
			transform: translateX(-120%);
		}
		100% {
			transform: translateX(380%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.search-progress-bar--indeterminate {
			animation: none;
			width: 100%;
			opacity: 0.55;
		}
	}

	.instance-farm-list.is-stale,
	.season-slot-groups.is-stale {
		opacity: 0.45;
		pointer-events: none;
		transition: opacity 120ms ease;
	}

	.search-progress-label {
		margin: 0;
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-variant-numeric: tabular-nums;
		color: hsl(var(--muted-foreground));
	}

	.warn-list {
		margin: 0;
		padding-left: 1.1rem;
		font-family: var(--font-body);
		font-size: 0.8125rem;
		line-height: 1.45;
		color: hsl(var(--muted-foreground));
	}

	.meta-line {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	.delta-panel {
		padding-top: 4px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.delta-main {
		font-family: var(--font-heading);
		font-size: clamp(1.5rem, 3vw, 2rem);
		font-weight: 700;
		letter-spacing: -0.02em;
		margin: 0;
		color: hsl(var(--foreground));
	}

	.delta-main.is-up,
	.result-delta.is-up {
		color: hsl(142 45% 38%);
	}

	.delta-main.is-down,
	.result-delta.is-down {
		color: hsl(var(--destructive));
	}

	:global(.dark) .delta-main.is-up,
	:global(.dark) .result-delta.is-up {
		color: hsl(142 50% 55%);
	}

	.delta-sub {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	.result-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.result-list li {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 2px 12px;
		padding-bottom: 10px;
		border-bottom: 1px solid hsl(var(--border));
		font-family: var(--font-body);
		font-size: 0.875rem;
	}

	.result-list li:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.instance-farm-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 2px;
	}

	.farm-toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 10px 16px;
	}

	.farm-toolbar-controls {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px 14px;
	}

	.farm-group-toggle {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-family: var(--font-body);
		font-size: 0.8125rem;
		color: hsl(var(--foreground));
		cursor: pointer;
		user-select: none;
	}

	.farm-group-toggle :global([data-slot='label']) {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--foreground));
		cursor: pointer;
	}

	.farm-instance-groups {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}

	.farm-instance-group {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.farm-instance-heading {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 8px 14px;
		padding-bottom: 6px;
		border-bottom: 1px solid hsl(var(--border));
	}

	.farm-instance-title {
		font-family: var(--font-heading);
		font-size: 0.875rem;
		font-weight: 600;
		letter-spacing: -0.01em;
		color: hsl(var(--foreground));
	}

	.farm-rank-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0;
		border-top: 1px solid hsl(var(--border));
	}

	.farm-rank-item {
		padding: 10px 0;
		border-bottom: 1px solid hsl(var(--border));
	}

	.farm-rank-item:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.farm-rank-row {
		display: grid;
		grid-template-columns: 2rem minmax(0, 1fr) auto;
		gap: 8px 12px;
		align-items: baseline;
	}

	.farm-priority {
		font-family: var(--font-heading);
		font-size: 1.125rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.2;
		color: hsl(var(--foreground));
		text-align: right;
		font-variant-numeric: tabular-nums;
	}

	.farm-boss {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}

	.farm-boss-name {
		font-family: var(--font-heading);
		font-size: 1.0625rem;
		font-weight: 600;
		letter-spacing: -0.01em;
		line-height: 1.2;
		color: hsl(var(--foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.farm-stats {
		display: flex;
		flex-wrap: wrap;
		gap: 8px 14px;
		align-items: baseline;
		justify-content: flex-end;
	}

	.farm-stat {
		display: inline-flex;
		align-items: baseline;
		gap: 6px;
		font-variant-numeric: tabular-nums;
	}

	.farm-stat-label {
		font-size: 0.6875rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground));
	}

	.farm-upgrade-icons {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 6px;
		margin-top: 8px;
		padding-left: calc(2rem + 12px);
	}

	.farm-more {
		align-self: center;
		padding-bottom: 4px;
	}

	@media (max-width: 640px) {
		.farm-rank-row {
			grid-template-columns: 1.75rem minmax(0, 1fr);
		}

		.farm-stats {
			grid-column: 2;
			justify-content: flex-start;
		}

		.farm-upgrade-icons {
			padding-left: calc(1.75rem + 12px);
		}
	}

	.text-action {
		appearance: none;
		background: none;
		border: none;
		padding: 0;
		margin: 0;
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: 500;
		color: hsl(var(--foreground));
		cursor: pointer;
		text-align: left;
		border-bottom: 1px solid hsl(var(--primary));
		width: fit-content;
	}

	.text-action:hover {
		color: hsl(var(--link));
		border-bottom-color: hsl(var(--link));
	}

	.equip-inspect {
		grid-column: 1 / -1;
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding-top: 8px;
	}

	.equip-inspect .result-list {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		column-gap: 32px;
	}

	.season-select-actions {
		gap: 8px;
	}

	.season-slot-groups {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding-right: 4px;
	}

	.season-slot-row {
		display: grid;
		grid-template-columns: 108px minmax(0, 1fr);
		gap: 10px;
		align-items: start;
		padding: 8px 0;
		border-top: 1px solid hsl(var(--border) / 0.65);
	}

	.season-slot-label {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding-top: 2px;
	}

	.season-slot-actions {
		display: flex;
		gap: 8px;
		margin-top: 2px;
	}

	.season-slot-icons {
		display: flex;
		flex-wrap: wrap;
		gap: 10px 6px;
		align-content: flex-start;
		min-height: 40px;
		padding-bottom: 4px;
	}

	.result-slot {
		grid-column: 1;
		color: hsl(var(--muted-foreground));
		font-size: 0.75rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.result-name {
		grid-column: 2;
		color: hsl(var(--foreground));
	}

	.result-vs {
		grid-column: 2;
		color: hsl(var(--muted-foreground));
		font-size: 0.8125rem;
	}

	.result-delta {
		grid-column: 1;
		grid-row: 1 / span 2;
		font-family: var(--font-heading);
		font-weight: 700;
		align-self: center;
		min-width: 4.5rem;
	}
</style>
