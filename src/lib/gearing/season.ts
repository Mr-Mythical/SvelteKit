/**
 * Season journal loot catalog + Dungeons & Raids BiS search.
 * Artifact: /gearing/season-loot-v1.json (simc-factory from Journal* DBC / --from-journal).
 */

import type { ArtifactMeta, GameDataSource } from './gameDataContract';
import { resolveItemStats, type ItemDbJson } from './itemDb';
import {
	estimateLoadoutComboCount,
	searchBestBagLoadout,
	type LoadoutSearchControl,
	type LoadoutSearchResult
} from './loadout';
import {
	searchBestBagLoadoutAsync,
	type LoadoutSearchProgress,
	type LoadoutSearchSource
} from './loadoutWorkerClient';
import { compareItemDelta, type LoadedModel } from './model';
import { ensurePieceCombatStats, hasCombatStats, scoringPaperDoll } from './gearStats';
import { BAG_SCAN_SLOT_ORDER, INVTYPE_TO_SLOT_IDS, SLOT_ID_LABELS } from './slots';
import { emptyCharacterState, type CharacterState, type GearPiece } from './types';
import { annotatePieceFromItemDb, isGearUsableForProfile, slotCanUseCandidate } from './usable';
import { applyPairedWeaponCandidateScoring } from './weaponRank';
import { SEASON_LOOT_ARTIFACT_VERSION, SEASON_LOOT_PATH, seasonLootFetchUrl } from './versions';

export { SEASON_LOOT_ARTIFACT_VERSION, SEASON_LOOT_PATH, seasonLootFetchUrl };
export type { LoadoutSearchProgress, LoadoutSearchSource };

export type SeasonTrackName = 'Champion' | 'Hero' | 'Myth';

export type SeasonTrackRank = {
	rank: number;
	ilvl: number;
	bonusId: number | null;
};

export type SeasonTrackMeta = {
	crestTrackId: number;
	defaultRank: number;
	ranks: SeasonTrackRank[];
};

export type SeasonLootTrackAttach = {
	rank: number;
	ilvl: number;
	bonusIds: number[];
};

export type SeasonLootItem = {
	itemId: number;
	name: string;
	equipLoc: string;
	quality?: number;
	instanceId?: number;
	instanceName: string;
	instanceKind: string;
	encounterId?: number;
	encounterName?: string;
	sourceLabel: string;
	tokenItemId?: number | null;
	isTierPiece?: boolean;
	tracks: Partial<Record<SeasonTrackName, SeasonLootTrackAttach>>;
};

export type SeasonLootJson = ArtifactMeta & {
	version: number;
	schema?: string;
	season?: string;
	wow_build?: string;
	model_compat?: string;
	publishedAt?: string;
	source?: string | GameDataSource;
	notes?: string[];
	tracks: Record<string, SeasonTrackMeta>;
	itemCount: number;
	items: SeasonLootItem[];
	missingSeedNames?: string[];
};

export type SeasonSearchResult = LoadoutSearchResult & {
	track: SeasonTrackName;
	rank: number;
	ilvl: number;
	candidateCount: number;
};

const TRACK_ORDER: SeasonTrackName[] = ['Champion', 'Hero', 'Myth'];

export async function fetchSeasonLoot(url: string = seasonLootFetchUrl()): Promise<SeasonLootJson> {
	const res = await fetch(url, { cache: 'default' });
	if (!res.ok) {
		throw new Error(`Failed to load season loot (${res.status}): ${url}`);
	}
	return loadSeasonLootFromJson((await res.json()) as SeasonLootJson);
}

export function loadSeasonLootFromJson(raw: SeasonLootJson): SeasonLootJson {
	if (!raw?.items || !Array.isArray(raw.items) || !raw.tracks) {
		throw new Error('Invalid season loot JSON');
	}
	if (!raw.source) {
		raw = {
			...raw,
			source: {
				pipeline: 'bootstrap',
				publishedFrom: 'export_season_loot bootstrap',
				notes: ['Prefer simc-dbc-ej (EncounterJournal) or addon-dumpseason republish from factory.']
			}
		};
	} else if (typeof raw.source === 'string') {
		raw = {
			...raw,
			source: {
				pipeline: raw.source.includes('bootstrap')
					? 'bootstrap'
					: raw.source.includes('simc-dbc-ej') || raw.source.includes('simc-dbc')
						? 'simc-dbc-ej'
						: 'addon-dumpseason',
				publishedFrom: raw.source
			}
		};
	}
	return raw;
}

export function listSeasonTracks(loot: SeasonLootJson): SeasonTrackName[] {
	return TRACK_ORDER.filter((t) => Boolean(loot.tracks[t]));
}

export function resolveTrackRank(
	loot: SeasonLootJson,
	track: SeasonTrackName,
	rank?: number
): SeasonTrackRank | null {
	const meta = loot.tracks[track];
	if (!meta?.ranks?.length) return null;
	const want = rank ?? meta.defaultRank ?? 6;
	return meta.ranks.find((r) => r.rank === want) ?? meta.ranks[meta.ranks.length - 1] ?? null;
}

/**
 * Resolve season catalog entries at a Champion/Hero/Myth track rank into GearPieces
 * suitable for loadout search (placed in CharacterState.bags).
 * When `profileKey` is set, drops items the class/spec cannot use (armor/weapon/primary).
 */
export function resolveSeasonCandidates(
	itemDb: ItemDbJson,
	loot: SeasonLootJson,
	track: SeasonTrackName,
	rank?: number,
	profileKey?: string
): { pieces: GearPiece[]; warnings: string[]; ilvl: number; rank: number } {
	const warnings: string[] = [];
	const trackRank = resolveTrackRank(loot, track, rank);
	if (!trackRank || !trackRank.bonusId) {
		return {
			pieces: [],
			warnings: [`Track ${track} is missing crest bonus IDs in the season loot snapshot.`],
			ilvl: 0,
			rank: rank ?? 0
		};
	}

	const pieces: GearPiece[] = [];
	let skippedUnusable = 0;
	for (const entry of loot.items) {
		if (!entry.equipLoc || entry.equipLoc === 'INVTYPE_TRINKET') continue;
		const attach = entry.tracks?.[track];
		const bonusIds = attach?.bonusIds?.length
			? attach.bonusIds
			: trackRank.bonusId
				? [trackRank.bonusId]
				: [];
		const ilvl = attach?.ilvl ?? trackRank.ilvl;
		const resolved = resolveItemStats(itemDb, entry.itemId, {
			itemLevel: ilvl,
			bonusIds
		});
		if (resolved.missing) {
			continue;
		}
		const sourceLabel =
			entry.sourceLabel ||
			(entry.encounterName ? `${entry.encounterName} — ${entry.instanceName}` : entry.instanceName);
		const piece = annotatePieceFromItemDb(
			{
				key: `season:${entry.itemId}:${track}:${trackRank.rank}`,
				link: `item:${entry.itemId}:${bonusIds.join(',')}`,
				itemId: entry.itemId,
				name: entry.name || resolved.name,
				equipLoc: entry.equipLoc || resolved.equipLoc,
				ilvl,
				quality: entry.quality ?? resolved.quality,
				source: 'bag',
				sourceLabel,
				instanceName: entry.instanceName,
				instanceKind: entry.instanceKind,
				encounterName: entry.encounterName,
				stats: resolved.stats,
				isTierPiece: entry.isTierPiece
			},
			itemDb
		);
		if (profileKey && !isGearUsableForProfile(piece, profileKey)) {
			skippedUnusable += 1;
			continue;
		}
		pieces.push(piece);
	}

	if (skippedUnusable) {
		warnings.push(`Filtered ${skippedUnusable} season item(s) unusable for this class/spec.`);
	}
	if (!pieces.length) {
		warnings.push('No season candidates resolved for this track.');
	}

	return { pieces, warnings, ilvl: trackRank.ilvl, rank: trackRank.rank };
}

export type SeasonSlotGroup = {
	slotId: number;
	slotLabel: string;
	pieces: GearPiece[];
};

/** Single-swap estimate for one season piece in one inventory slot (addon Predict-style). */
export type SeasonPieceEstimate = {
	piece: GearPiece;
	slotId: number;
	slotLabel: string;
	equipped: GearPiece | null;
	baseDps: number;
	candidateDps: number;
	/** Estimated ΔDPS vs currently equipped in this slot. */
	delta: number;
};

export type RankedSeasonPiece = {
	piece: GearPiece;
	/** Quick single-swap ΔDPS estimate (null when character/spec not ready). */
	estimateDelta: number | null;
	/** Absolute predicted DPS with this piece swapped in. */
	estimateDps: number | null;
	equipped: GearPiece | null;
	/** Reserved; full-loadout per-piece Δ is not used. */
	actualDelta: number | null;
	isBisPick: boolean;
	/** MH/OH scored via addon `applyPairedWeaponCandidateScoring` (weapon_pair_scored). */
	weaponPairScored?: boolean;
};

export type RankedSeasonSlotGroup = {
	slotId: number;
	slotLabel: string;
	/** Currently worn piece for this inventory slot (shown first in the row). */
	equipped: GearPiece | null;
	pieces: RankedSeasonPiece[];
};

function equippedForSlot(state: CharacterState, slotId: number): GearPiece | null {
	return state.equipped.find((p) => p.slotId === slotId) ?? null;
}

/**
 * Same item as equipped at equal or lower ilvl — not worth searching.
 * Higher-ilvl season copies of the same item stay selectable.
 */
export function candidateMatchesEquipped(
	candidate: Pick<GearPiece, 'itemId' | 'ilvl'>,
	equipped: Pick<GearPiece, 'itemId' | 'ilvl'> | null | undefined
): boolean {
	if (!equipped?.itemId || !candidate.itemId) return false;
	if (candidate.itemId !== equipped.itemId) return false;
	const a = candidate.ilvl;
	const b = equipped.ilvl;
	if (a == null || b == null || !(a > 0) || !(b > 0)) return false;
	return Math.round(a) <= Math.round(b);
}

/** Season item ids that are the same drop as equipped at equal/lower ilvl. */
export function collectEquippedDuplicateItemIds(
	pieces: readonly GearPiece[],
	equipped: readonly GearPiece[],
	profileKey?: string
): Set<number> {
	const bySlot = new Map<number, GearPiece>();
	for (const p of equipped) {
		if (p.slotId != null) bySlot.set(p.slotId, p);
	}
	const out = new Set<number>();
	for (const piece of pieces) {
		const slots = INVTYPE_TO_SLOT_IDS[piece.equipLoc || ''] ?? [];
		for (const slotId of slots) {
			if (profileKey && !slotCanUseCandidate(slotId, piece, profileKey)) continue;
			if (candidateMatchesEquipped(piece, bySlot.get(slotId))) {
				out.add(piece.itemId);
				break;
			}
		}
	}
	return out;
}

/**
 * Score a season piece as a single swap into one inventory slot.
 * Returns null when a worn piece has no combat ratings (would look like a
 * free upgrade). Armory loads prefer Battle.net ratings on equipped pieces.
 */
export function estimateSeasonPieceDelta(
	model: LoadedModel,
	state: CharacterState,
	piece: GearPiece,
	slotId: number,
	opts?: { itemDb?: ItemDbJson | null }
): SeasonPieceEstimate | null {
	const profileKey = state.profileKey;
	if (!profileKey || !model.prebaked[profileKey]) return null;
	if (!slotCanUseCandidate(slotId, piece, profileKey)) return null;

	let equipped = equippedForSlot(state, slotId);
	if (equipped) {
		equipped = ensurePieceCombatStats(equipped, opts?.itemDb);
		// Worn piece with unknown ratings would look like a free upgrade onto an empty slot.
		if (!hasCombatStats(equipped.stats)) return null;
	}

	const cmp = compareItemDelta(model, state.stats, equipped?.stats ?? {}, piece.stats, profileKey);
	return {
		piece,
		slotId,
		slotLabel: SLOT_ID_LABELS[slotId] || String(slotId),
		equipped,
		baseDps: cmp.baseDps,
		candidateDps: cmp.candidateDps,
		delta: cmp.delta
	};
}

/** Group usable season pieces into addon-style equipment slot rows. */
export function groupSeasonPiecesBySlot(
	pieces: GearPiece[],
	profileKey?: string
): SeasonSlotGroup[] {
	const bySlot = new Map<number, GearPiece[]>();
	for (const slotId of BAG_SCAN_SLOT_ORDER) bySlot.set(slotId, []);

	for (const piece of pieces) {
		const slots = INVTYPE_TO_SLOT_IDS[piece.equipLoc || ''] ?? [];
		for (const slotId of slots) {
			if (!bySlot.has(slotId)) continue;
			if (profileKey && !slotCanUseCandidate(slotId, piece, profileKey)) continue;
			bySlot.get(slotId)!.push(piece);
		}
	}

	return BAG_SCAN_SLOT_ORDER.map((slotId) => ({
		slotId,
		slotLabel: SLOT_ID_LABELS[slotId] || String(slotId),
		pieces: bySlot.get(slotId) ?? []
	})).filter((g) => g.pieces.length > 0);
}

/**
 * Addon-style quick prediction: score every season icon as a single swap vs
 * current gear, sort highest Δ first, and mark BiS-scan picks.
 * MH/OH keep the currently equipped other hand (2H replaces both).
 * Pairing every MH with BiS loot OH was incorrectly inflating weak weapons.
 */
export function rankSeasonSlotGroups(
	model: LoadedModel | null,
	state: CharacterState,
	pieces: GearPiece[],
	opts?: {
		/** BiS search result — marks chosen pieces. */
		bisBySlot?: ReadonlyMap<number, GearPiece | null> | null;
		itemDb?: ItemDbJson | null;
	}
): RankedSeasonSlotGroup[] {
	const profileKey = state.profileKey;
	const canScore = Boolean(model && profileKey && model.prebaked[profileKey]);
	const groups = groupSeasonPiecesBySlot(pieces, profileKey || undefined);
	const bisBySlot = opts?.bisBySlot ?? null;
	const itemDb = opts?.itemDb ?? null;

	const enrichedEquipped = canScore
		? state.equipped.map((p) => ensurePieceCombatStats(p, itemDb))
		: state.equipped;
	const scoringState: CharacterState = {
		...state,
		equipped: enrichedEquipped,
		stats: scoringPaperDoll(enrichedEquipped, state.stats)
	};

	const weaponScores =
		canScore && model
			? applyPairedWeaponCandidateScoring(
					model,
					scoringState,
					new Map(groups.map((g) => [g.slotId, g.pieces]))
				)
			: null;

	return groups.map((group) => {
		const ranked: RankedSeasonPiece[] = group.pieces.map((piece) => {
			const weaponKey = `${group.slotId}:${piece.key || piece.link || piece.itemId}`;
			const paired =
				(group.slotId === 16 || group.slotId === 17) && weaponScores
					? weaponScores.get(weaponKey)
					: undefined;

			// Never single-swap MH/OH when weapon pairing ran — empty OH under a 2H
			// looks like a free upgrade, and bare 1H vs 2H looks like a huge loss.
			const skipSingleSwap = (group.slotId === 16 || group.slotId === 17) && weaponScores != null;

			const estimate =
				!paired && !skipSingleSwap && canScore && model
					? estimateSeasonPieceDelta(model, scoringState, piece, group.slotId, { itemDb })
					: null;

			const estimateDelta = paired?.delta ?? estimate?.delta ?? null;
			const estimateDps = paired?.candidateDps ?? estimate?.candidateDps ?? null;

			const bisChosen = bisBySlot?.get(group.slotId) ?? null;
			const isBisPick = Boolean(
				bisChosen &&
					bisChosen.itemId === piece.itemId &&
					(bisChosen.link === piece.link ||
						(bisChosen.ilvl != null && piece.ilvl != null && bisChosen.ilvl === piece.ilvl) ||
						bisChosen.key === piece.key)
			);

			return {
				piece,
				estimateDelta,
				estimateDps,
				equipped: estimate?.equipped ?? equippedForSlot(scoringState, group.slotId),
				actualDelta: null,
				isBisPick,
				weaponPairScored: paired?.weaponPairScored
			};
		});

		ranked.sort((a, b) => {
			const ad = a.estimateDelta;
			const bd = b.estimateDelta;
			if (ad != null && bd != null && ad !== bd) return bd - ad;
			if (ad != null && bd == null) return -1;
			if (ad == null && bd != null) return 1;
			return (a.piece.name || '').localeCompare(b.piece.name || '');
		});

		return {
			slotId: group.slotId,
			slotLabel: group.slotLabel,
			equipped: equippedForSlot(scoringState, group.slotId),
			pieces: ranked
		};
	});
}

export type SeasonInstanceUpgrade = {
	slotId: number;
	slotLabel: string;
	piece: GearPiece;
	equipped: GearPiece | null;
	/** Single-swap Δ used for farm ranking (same as icon badges). */
	estimateDelta: number;
};

/**
 * Farm priority for one boss / encounter (Droptimizer-style).
 * - `bestDps`: highest single-swap Δ among this boss's drops
 * - `expectedValueDps`: mean of max(0, Δ) over every scored drop (equal drop chance)
 */
export type SeasonBossFarmRank = {
	encounterName: string;
	instanceName: string;
	instanceKind: string;
	expectedValueDps: number;
	bestDps: number;
	/** 1-based among bosses with EV > 0; null when EV is 0. */
	priority: number | null;
	dropCount: number;
	/** Drops with a scored Δ (best per slot). Non-upgrades (Δ ≤ 0) included for display. */
	upgrades: SeasonInstanceUpgrade[];
};

function bossKeyOf(piece: GearPiece): {
	encounterName: string;
	instanceName: string;
	instanceKind: string;
} {
	const instanceName = (piece.instanceName || '').trim() || 'Unknown';
	const instanceKind = (piece.instanceKind || '').trim() || 'Dungeon';
	const encounterName = (piece.encounterName || '').trim() || instanceName;
	return { encounterName, instanceName, instanceKind };
}

function pieceIdentity(piece: GearPiece): string {
	return piece.key || piece.link || `id:${piece.itemId}`;
}

/**
 * Rank bosses/encounters from {@link rankSeasonSlotGroups} — no BiS scan.
 * Mirrors Droptimizer boss summary: Expected Value + Best from single-swap Δs.
 * Each drop is counted once (best Δ if the item was scored in multiple slots).
 */
export function rankSeasonInstancesFromEstimates(
	groups: readonly RankedSeasonSlotGroup[]
): SeasonBossFarmRank[] {
	type PieceHit = {
		delta: number;
		slotId: number;
		slotLabel: string;
		piece: GearPiece;
		equipped: GearPiece | null;
	};
	type Acc = {
		encounterName: string;
		instanceName: string;
		instanceKind: string;
		byPiece: Map<string, PieceHit>;
	};
	const byBoss = new Map<string, Acc>();

	for (const group of groups) {
		for (const ranked of group.pieces) {
			const delta = ranked.estimateDelta;
			if (delta == null || !Number.isFinite(delta)) continue;
			const { encounterName, instanceName, instanceKind } = bossKeyOf(ranked.piece);
			const bossKey = `${instanceKind}\0${instanceName}\0${encounterName}`;
			let acc = byBoss.get(bossKey);
			if (!acc) {
				acc = { encounterName, instanceName, instanceKind, byPiece: new Map() };
				byBoss.set(bossKey, acc);
			}
			const id = pieceIdentity(ranked.piece);
			const prev = acc.byPiece.get(id);
			if (!prev || delta > prev.delta) {
				acc.byPiece.set(id, {
					delta,
					slotId: group.slotId,
					slotLabel: group.slotLabel,
					piece: ranked.piece,
					equipped: ranked.equipped ?? group.equipped
				});
			}
		}
	}

	const ranks: SeasonBossFarmRank[] = [];
	for (const acc of byBoss.values()) {
		const hits = [...acc.byPiece.values()];
		const n = hits.length;
		if (n === 0) continue;

		let sumPos = 0;
		let bestDps = 0;
		const bestBySlot = new Map<number, SeasonInstanceUpgrade>();
		for (const hit of hits) {
			if (hit.delta > 0) sumPos += hit.delta;
			if (hit.delta > bestDps) bestDps = hit.delta;
			const prev = bestBySlot.get(hit.slotId);
			if (!prev || hit.delta > prev.estimateDelta) {
				bestBySlot.set(hit.slotId, {
					slotId: hit.slotId,
					slotLabel: hit.slotLabel,
					piece: hit.piece,
					equipped: hit.equipped,
					estimateDelta: hit.delta
				});
			}
		}

		// Upgrades first, then sidegrades/downgrades (still by Δ desc within each band).
		const upgrades = [...bestBySlot.values()].sort((a, b) => {
			const aUp = a.estimateDelta > 0 ? 1 : 0;
			const bUp = b.estimateDelta > 0 ? 1 : 0;
			if (aUp !== bUp) return bUp - aUp;
			if (b.estimateDelta !== a.estimateDelta) return b.estimateDelta - a.estimateDelta;
			return a.slotId - b.slotId;
		});

		ranks.push({
			encounterName: acc.encounterName,
			instanceName: acc.instanceName,
			instanceKind: acc.instanceKind,
			expectedValueDps: sumPos / n,
			bestDps,
			priority: null,
			dropCount: n,
			upgrades
		});
	}

	ranks.sort((a, b) => {
		if (Math.abs(b.expectedValueDps - a.expectedValueDps) > 1e-6) {
			return b.expectedValueDps - a.expectedValueDps;
		}
		if (Math.abs(b.bestDps - a.bestDps) > 1e-6) return b.bestDps - a.bestDps;
		return a.encounterName.localeCompare(b.encounterName);
	});

	let priority = 0;
	for (const row of ranks) {
		if (row.expectedValueDps > 1e-9) {
			priority += 1;
			row.priority = priority;
		} else {
			row.priority = null;
		}
	}
	return ranks;
}

export function filterSeasonPiecesByDeselection(
	pieces: GearPiece[],
	deselectedItemIds: ReadonlySet<number> | null | undefined
): GearPiece[] {
	if (!deselectedItemIds?.size) return pieces;
	return pieces.filter((p) => !deselectedItemIds.has(p.itemId));
}

/** Keep only pieces from one journal instance (`''` / unset = all). */
export function filterSeasonPiecesByInstance(
	pieces: GearPiece[],
	instanceName: string | null | undefined
): GearPiece[] {
	const inst = (instanceName || '').trim();
	if (!inst) return pieces;
	return pieces.filter((p) => (p.instanceName || '').trim() === inst);
}

/**
 * Combo count for the selection UI — same formula/DP as the addon (instant).
 */
export function estimateSeasonComboCount(
	pieces: GearPiece[],
	profileKey: string | undefined,
	deselectedItemIds?: ReadonlySet<number> | null,
	opts?: {
		equipped?: GearPiece[];
		itemDb?: ItemDbJson | null;
		instanceName?: string | null;
	}
): number {
	const scoped = filterSeasonPiecesByInstance(pieces, opts?.instanceName);
	const selected = filterSeasonPiecesByDeselection(scoped, deselectedItemIds);
	if (!profileKey || !selected.length) return 0;
	const faux: CharacterState = {
		...emptyCharacterState(profileKey),
		equipped: opts?.equipped ?? [],
		bags: selected
	};
	return estimateLoadoutComboCount(faux, { itemDb: opts?.itemDb });
}

/**
 * Best loadout from season journal candidates at the chosen upgrade track.
 * Reuses bag loadout search with season pieces as the candidate pool.
 */
export function searchBestSeasonLoadout(
	model: LoadedModel,
	state: CharacterState,
	itemDb: ItemDbJson,
	loot: SeasonLootJson,
	track: SeasonTrackName,
	opts?: {
		rank?: number;
		maxCombinations?: number;
		/** Item ids explicitly excluded from the search (addon-style toggles). */
		deselectedItemIds?: ReadonlySet<number>;
		/** When set, only journal drops from this instance are candidates. */
		instanceName?: string | null;
	}
): SeasonSearchResult {
	const resolved = resolveSeasonCandidates(itemDb, loot, track, opts?.rank, state.profileKey);
	const scoped = filterSeasonPiecesByInstance(resolved.pieces, opts?.instanceName);
	const pieces = filterSeasonPiecesByDeselection(scoped, opts?.deselectedItemIds);
	const faux: CharacterState = {
		...state,
		bags: pieces
	};
	const result = searchBestBagLoadout(model, faux, {
		maxCombinations: opts?.maxCombinations,
		itemDb
	});
	const instanceLabel = (opts?.instanceName || '').trim();
	return {
		...result,
		track,
		rank: resolved.rank,
		ilvl: resolved.ilvl,
		candidateCount: pieces.length,
		warnings: [
			...resolved.warnings,
			...(instanceLabel
				? [`Instance filter: ${instanceLabel} only (${pieces.length} candidates).`]
				: []),
			...(opts?.deselectedItemIds?.size
				? [`${opts.deselectedItemIds.size} season item(s) deselected — excluded from search.`]
				: []),
			...result.warnings
		]
	};
}

export type SeasonSearchOutcome = {
	result: SeasonSearchResult;
	source: LoadoutSearchSource;
	workers: number;
};

/**
 * Resolve candidates on the main thread, then run the combo search in a Worker
 * (same path as Bags) so the page stays responsive.
 */
export async function searchBestSeasonLoadoutAsync(
	model: LoadedModel,
	state: CharacterState,
	itemDb: ItemDbJson,
	loot: SeasonLootJson,
	track: SeasonTrackName,
	opts?: {
		rank?: number;
		maxCombinations?: number;
		deselectedItemIds?: ReadonlySet<number>;
		/** When set, only journal drops from this instance are candidates. */
		instanceName?: string | null;
		onProgress?: (progress: LoadoutSearchProgress) => void;
		control?: LoadoutSearchControl;
	}
): Promise<SeasonSearchOutcome> {
	// Yield so the UI can paint before Item DB resolution + Worker postMessage.
	await new Promise<void>((resolve) => setTimeout(resolve, 0));
	const resolved = resolveSeasonCandidates(itemDb, loot, track, opts?.rank, state.profileKey);
	const scoped = filterSeasonPiecesByInstance(resolved.pieces, opts?.instanceName);
	const pieces = filterSeasonPiecesByDeselection(scoped, opts?.deselectedItemIds);
	opts?.onProgress?.({
		checked: 0,
		total: 0,
		maxCombinations: 0,
		baseDps: 0,
		bestDps: 0
	});
	const faux: CharacterState = {
		...state,
		bags: pieces
	};
	const outcome = await searchBestBagLoadoutAsync(model, faux, {
		itemDb,
		maxCombinations: opts?.maxCombinations,
		onProgress: opts?.onProgress,
		control: opts?.control
	});
	const instanceLabel = (opts?.instanceName || '').trim();
	return {
		result: {
			...outcome.result,
			track,
			rank: resolved.rank,
			ilvl: resolved.ilvl,
			candidateCount: pieces.length,
			warnings: [
				...resolved.warnings,
				...(instanceLabel
					? [`Instance filter: ${instanceLabel} only (${pieces.length} candidates).`]
					: []),
				...(opts?.deselectedItemIds?.size
					? [`${opts.deselectedItemIds.size} season item(s) deselected — excluded from search.`]
					: []),
				...outcome.result.warnings
			]
		},
		source: outcome.source,
		workers: outcome.workers
	};
}
