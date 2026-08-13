/**
 * Tier set membership + 4pc DFS helpers.
 * Piece maps come from published tier-sets-v{N}.json (simc-factory / SimC DBC),
 * not hardcoded token tables in this module.
 */

import type { ArtifactMeta, GameDataSource } from './gameDataContract';
import { tierSetsFetchUrl } from './versions';

/** Tier set slots: head, shoulder, chest, legs, hands. */
export const TIER_SET_SLOT_IDS: ReadonlySet<number> = new Set([1, 3, 5, 7, 10]);

/** Addon / artifact default `minTierSetPieces`. */
export const MIN_TIER_SET_PIECES = 4;

export type TierPieceInfo = {
	classToken: string;
	/** e.g. `voidspire-t1:MAGE` — same set shares one key. */
	matchKey: string;
	tokenItemId?: number;
	family?: string;
};

export type TierTokenEntry = {
	family: string;
	pieces: Record<string, number>;
};

export type TierSetsJson = ArtifactMeta & {
	schema?: string;
	minTierSetPieces?: number;
	tierSlots?: number[];
	tokens: Record<string, TierTokenEntry>;
	pieces: Record<
		string,
		{
			classToken: string;
			matchKey: string;
			tokenItemId?: number;
			family?: string;
		}
	>;
	source?: GameDataSource;
};

let pieceById = new Map<number, TierPieceInfo>();
let allPieceIds = new Set<number>();
let installedMinPieces = MIN_TIER_SET_PIECES;
let installed: TierSetsJson | null = null;

function rebuildIndexes(data: TierSetsJson) {
	const map = new Map<number, TierPieceInfo>();
	for (const [idStr, row] of Object.entries(data.pieces ?? {})) {
		const itemId = Number(idStr);
		if (!Number.isFinite(itemId) || !row?.classToken || !row?.matchKey) continue;
		map.set(itemId, {
			classToken: row.classToken,
			matchKey: row.matchKey,
			tokenItemId: row.tokenItemId,
			family: row.family
		});
	}
	// Derive pieces from tokens if pieces map is empty/partial.
	for (const [tokenStr, token] of Object.entries(data.tokens ?? {})) {
		const tokenItemId = Number(tokenStr);
		const family = token.family || `set:${tokenStr}`;
		for (const [classToken, pieceId] of Object.entries(token.pieces ?? {})) {
			if (map.has(pieceId)) continue;
			map.set(pieceId, {
				classToken,
				matchKey: `${family}:${classToken}`,
				tokenItemId,
				family
			});
		}
	}
	pieceById = map;
	allPieceIds = new Set(map.keys());
	installedMinPieces =
		typeof data.minTierSetPieces === 'number' && data.minTierSetPieces > 0
			? data.minTierSetPieces
			: MIN_TIER_SET_PIECES;
	installed = data;
}

/** Install / replace the live tier index (call after fetch or in tests). */
export function installTierSets(data: TierSetsJson): TierSetsJson {
	if (!data?.tokens && !data?.pieces) {
		throw new Error('Invalid tier-sets JSON');
	}
	rebuildIndexes(data);
	return data;
}

export function loadTierSetsFromJson(raw: TierSetsJson): TierSetsJson {
	return installTierSets(raw);
}

export async function fetchTierSets(url: string = tierSetsFetchUrl()): Promise<TierSetsJson> {
	const res = await fetch(url, { cache: 'default' });
	if (!res.ok) {
		throw new Error(`Failed to load tier sets (${res.status}): ${url}`);
	}
	return loadTierSetsFromJson((await res.json()) as TierSetsJson);
}

export function getInstalledTierSets(): TierSetsJson | null {
	return installed;
}

export function getMinTierSetPieces(): number {
	return installedMinPieces;
}

/** piece itemId → tier info (empty until installTierSets). */
export function getTierPieceMap(): ReadonlyMap<number, TierPieceInfo> {
	return pieceById;
}

export function getAllTierPieceIds(): ReadonlySet<number> {
	return allPieceIds;
}

export function getTierPieceInfo(itemId: number | undefined | null): TierPieceInfo | null {
	if (!itemId) return null;
	return pieceById.get(itemId) ?? null;
}

/** True if this item is a known tier piece for a *different* class. */
export function isOtherClassTierPiece(
	itemId: number | undefined | null,
	classToken: string
): boolean {
	const info = getTierPieceInfo(itemId);
	if (!info) return false;
	return info.classToken !== classToken;
}

export type TierPruneRules = {
	active: boolean;
	minTierSetPieces: number;
	targetMatchKeys: string[];
	slotHasTier: Record<number, boolean>;
};

type TierCand = {
	itemId?: number;
	isTierPiece?: boolean;
	tierMatchKey?: string | null;
	link?: string;
};

export function annotateTierFields<T extends TierCand>(
	piece: T
): T & { isTierPiece?: boolean; tierMatchKey?: string | null } {
	const info = getTierPieceInfo(piece.itemId);
	if (!info) return piece;
	return {
		...piece,
		isTierPiece: true,
		tierMatchKey: info.matchKey
	};
}

export function isTargetTierPiece(
	cand: TierCand,
	rules: TierPruneRules | null | undefined
): boolean {
	if (!rules?.active || !cand?.link) return false;
	const key = cand.tierMatchKey || (cand.itemId ? getTierPieceInfo(cand.itemId)?.matchKey : null);
	if (!key) return false;
	return rules.targetMatchKeys.includes(key);
}

export function remainingTierSlotsAfter(
	rules: TierPruneRules,
	nonWeaponOrder: readonly number[],
	/** 0-based index of the current non-weapon slot. */
	currentIndex0: number
): number {
	let remaining = 0;
	for (let i = currentIndex0 + 1; i < nonWeaponOrder.length; i++) {
		const slotId = nonWeaponOrder[i]!;
		if (rules.slotHasTier[slotId]) remaining += 1;
	}
	return remaining;
}

/** Addon `allowNonTierPick` — may skip off-set pieces in tier slots when 4pc is still reachable. */
export function allowNonTierPick(
	rules: TierPruneRules | null | undefined,
	nonWeaponOrder: readonly number[],
	/** 1-based DFS index (current slot = nonWeapon[idx-1]). */
	idx1Based: number,
	slotId: number,
	tierCount: number
): boolean {
	if (!rules?.active) return true;
	if (!TIER_SET_SLOT_IDS.has(slotId)) return true;
	if (!rules.slotHasTier[slotId]) return true;
	return (
		tierCount + remainingTierSlotsAfter(rules, nonWeaponOrder, idx1Based - 1) >=
		rules.minTierSetPieces
	);
}

export function candTierAdds(
	rules: TierPruneRules | null | undefined,
	cand: TierCand,
	slotId: number
): number {
	if (!rules?.active || !TIER_SET_SLOT_IDS.has(slotId)) return 0;
	return isTargetTierPiece(cand, rules) ? 1 : 0;
}

export function canStillSatisfyTier(
	rules: TierPruneRules | null | undefined,
	nonWeaponOrder: readonly number[],
	/** 1-based DFS index (current slot = nonWeapon[idx-1]). */
	idx1Based: number,
	tierCount: number,
	slotId: number
): boolean {
	if (!rules?.active) return true;
	if (idx1Based > nonWeaponOrder.length) return true;
	let maxPossible = tierCount + remainingTierSlotsAfter(rules, nonWeaponOrder, idx1Based - 1);
	if (TIER_SET_SLOT_IDS.has(slotId) && rules.slotHasTier[slotId]) {
		maxPossible += 1;
	}
	return maxPossible >= rules.minTierSetPieces;
}

export function countTargetTierInAssign(
	assign: Record<number, TierCand | undefined>,
	rules: TierPruneRules | null | undefined
): number {
	if (!rules?.active) return 0;
	let n = 0;
	for (const slotId of TIER_SET_SLOT_IDS) {
		const cand = assign[slotId];
		if (cand && isTargetTierPiece(cand, rules)) n += 1;
	}
	return n;
}

/**
 * Pick the tier set with the most available slots in the pool (≥ min), mirroring
 * addon `chooseTargetTierProfile`.
 */
export function buildTierPruneRules(
	slotCandidates: Record<number, TierCand[]>
): TierPruneRules | null {
	const minPieces = installedMinPieces;
	const keySlotCounts = new Map<string, number>();
	for (const slotId of TIER_SET_SLOT_IDS) {
		const keysInSlot = new Set<string>();
		for (const cand of slotCandidates[slotId] ?? []) {
			if (!cand.link) continue;
			const key =
				cand.tierMatchKey || (cand.itemId ? getTierPieceInfo(cand.itemId)?.matchKey : null);
			if (key) keysInSlot.add(key);
		}
		for (const key of keysInSlot) {
			keySlotCounts.set(key, (keySlotCounts.get(key) ?? 0) + 1);
		}
	}

	let bestKey: string | null = null;
	let bestCount = 0;
	for (const [key, count] of keySlotCounts) {
		if (count > bestCount) {
			bestKey = key;
			bestCount = count;
		}
	}

	if (!bestKey || bestCount < minPieces) return null;

	const targetMatchKeys = [bestKey];
	const probe: TierPruneRules = {
		active: true,
		minTierSetPieces: minPieces,
		targetMatchKeys,
		slotHasTier: {}
	};
	const slotHasTier: Record<number, boolean> = {};
	for (const slotId of TIER_SET_SLOT_IDS) {
		for (const cand of slotCandidates[slotId] ?? []) {
			if (cand.link && isTargetTierPiece(cand, probe)) {
				slotHasTier[slotId] = true;
				break;
			}
		}
	}

	return {
		active: true,
		minTierSetPieces: minPieces,
		targetMatchKeys,
		slotHasTier
	};
}
