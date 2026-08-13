/**
 * Paper-doll helpers for ΔDPS scoring.
 * Ranking must use the same stat source for "base" and "equipped piece"
 * — otherwise candidates look like free upgrades onto a placeholder doll.
 */

import { emptyStats, STAT_NAMES, type CombatStats } from './model';
import { resolveItemStats, type ItemDbJson } from './itemDb';
import { isTrinketEquipLoc } from './slots';
import type { GearPiece } from './types';
import { bonusIdsFromLink } from './wowhead';

export function hasCombatStats(stats: Partial<CombatStats> | null | undefined): boolean {
	if (!stats) return false;
	for (const name of STAT_NAMES) {
		if ((Number(stats[name]) || 0) !== 0) return true;
	}
	return false;
}

/** Sum combat ratings from equipped pieces (skips trinkets by default). */
export function sumEquippedCombatStats(
	equipped: readonly GearPiece[],
	opts?: { skipTrinkets?: boolean }
): CombatStats {
	const skipTrinkets = opts?.skipTrinkets !== false;
	const total = emptyStats();
	for (const piece of equipped) {
		if (skipTrinkets && isTrinketEquipLoc(piece.equipLoc)) continue;
		if (!hasCombatStats(piece.stats)) continue;
		for (const name of STAT_NAMES) {
			total[name] += Number(piece.stats[name]) || 0;
		}
	}
	return total;
}

/**
 * Prefer piece stats; if empty, re-resolve from Item DB (Armory/SimC sometimes
 * keep the row for display when the first resolve failed).
 */
export function ensurePieceCombatStats(piece: GearPiece, itemDb?: ItemDbJson | null): GearPiece {
	if (hasCombatStats(piece.stats)) return piece;
	if (!itemDb || !piece.itemId) return piece;
	const bonusIds = bonusIdsFromLink(piece.link);
	const resolved = resolveItemStats(itemDb, piece.itemId, {
		itemLevel: piece.ilvl || undefined,
		bonusIds
	});
	if (resolved.missing || !hasCombatStats(resolved.stats)) return piece;
	return {
		...piece,
		stats: resolved.stats,
		equipLoc: piece.equipLoc || resolved.equipLoc || resolved.slot || piece.equipLoc,
		ilvl: piece.ilvl || resolved.itemLevel,
		quality: piece.quality ?? resolved.quality,
		itemClass: piece.itemClass ?? undefined,
		itemSubclass: piece.itemSubclass ?? undefined
	};
}

/**
 * Stats used as the NN paper-doll for single-swap / weapon ranking.
 * Prefer an authoritative fallback (Armory `/statistics` or addon export) when
 * present so base stats / trinket statics are not dropped. Otherwise sum
 * equipped piece ratings so base and swaps share one source.
 */
export function scoringPaperDoll(
	equipped: readonly GearPiece[],
	fallback: CombatStats
): CombatStats {
	if (hasCombatStats(fallback)) {
		return {
			primary_stat: Number(fallback.primary_stat) || 0,
			crit: Number(fallback.crit) || 0,
			haste: Number(fallback.haste) || 0,
			mastery: Number(fallback.mastery) || 0,
			versatility: Number(fallback.versatility) || 0
		};
	}
	const fromGear = sumEquippedCombatStats(equipped);
	return hasCombatStats(fromGear) ? fromGear : emptyStats();
}
