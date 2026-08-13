/**
 * Addon Predict.lua paired-weapon pre-scan ranking
 * (`NS.applyPairedWeaponCandidateScoring`).
 *
 * For each MH/OH candidate, score the best valid opposite-hand pairing from
 * loot + equipped (+ empty OH when dual-wield), not a naïve single-slot swap.
 */

import {
	applyDelta,
	createSpecPredictor,
	emptyStats,
	type CombatStats,
	type LoadedModel,
	STAT_NAMES
} from './model';
import { hasCombatStats } from './gearStats';
import { getWeaponLoadoutForSpec, is2HEquipLoc, isTitansGripSpec } from './slots';
import type { CharacterState, GearPiece } from './types';
import { slotCanUseCandidate } from './usable';

export type WeaponPairScore = {
	delta: number;
	candidateDps: number;
	baseDps: number;
	/** True when scored via best opposite-hand pairing (1H DW), not 2H solo. */
	weaponPairScored: boolean;
};

function isEmptyWeapon(piece: GearPiece | null | undefined): boolean {
	return !piece || !piece.link;
}

function sameKey(a: GearPiece | null | undefined, b: GearPiece | null | undefined): boolean {
	return Boolean(a?.key && b?.key && a.key === b.key);
}

function emptyWeaponPiece(slotId: 16 | 17): GearPiece {
	return {
		key: `empty:${slotId}`,
		link: '',
		itemId: 0,
		source: 'equipped',
		stats: emptyStats()
	};
}

/**
 * Combined MH+OH stat delta vs currently equipped weapons.
 * Ports Predict.lua `computeWeaponLoadoutDelta` (stats-only; links already resolved).
 *
 * Pass an explicit empty OH (`link: ''`) when evaluating a 2H — do not pass `null`
 * or it will coalesce to the currently equipped OH and skew the delta.
 */
export function computeWeaponLoadoutStatDelta(
	mhCand: GearPiece | null | undefined,
	ohCand: GearPiece | null | undefined,
	eqMh: GearPiece | null | undefined,
	eqOh: GearPiece | null | undefined
): CombatStats | null {
	// Only fall back to equipped when the pick is omitted (undefined), not when
	// an explicit empty candidate is provided.
	const mh = mhCand === undefined ? (eqMh ?? null) : mhCand;
	const oh = ohCand === undefined ? (eqOh ?? null) : ohCand;
	const mhEmpty = isEmptyWeapon(mh);
	const ohEmpty = isEmptyWeapon(oh);

	if (mhEmpty && ohEmpty) return null;
	if (sameKey(eqMh, mh) && sameKey(eqOh, oh)) return null;

	const out = emptyStats();
	const add = (piece: Partial<CombatStats> | undefined, sign: 1 | -1) => {
		if (!piece) return;
		for (const name of STAT_NAMES) {
			out[name] = (out[name] ?? 0) + sign * (Number(piece[name] ?? 0) || 0);
		}
	};

	const newIs2H = is2HEquipLoc(mh?.equipLoc);
	const eqIs2H = is2HEquipLoc(eqMh?.equipLoc);

	if (newIs2H) {
		if (!isEmptyWeapon(eqMh)) {
			add(mh!.stats, 1);
			add(eqMh!.stats, -1);
			// Leaving a 1H+OH set for a 2H also drops the old off-hand.
			if (!isEmptyWeapon(eqOh) && !eqIs2H) add(eqOh!.stats, -1);
			return out;
		}
		return null;
	}

	if (eqIs2H && !isEmptyWeapon(eqMh)) {
		if (ohEmpty || !oh) return null;
		add(mh!.stats, 1);
		add(eqMh!.stats, -1);
		add(oh.stats, 1);
		return out;
	}

	if (!mhEmpty && mh && !sameKey(eqMh, mh)) {
		add(mh.stats, 1);
		if (!isEmptyWeapon(eqMh)) add(eqMh!.stats, -1);
	}

	if (!ohEmpty && oh) {
		if (!isEmptyWeapon(eqOh) && !sameKey(eqOh, oh)) {
			add(oh.stats, 1);
			add(eqOh!.stats, -1);
		} else if (isEmptyWeapon(eqOh)) {
			add(oh.stats, 1);
		}
	} else if (ohEmpty && !isEmptyWeapon(eqOh)) {
		add(eqOh!.stats, -1);
	}

	return out;
}

/** Same rules as LoadoutEngine / web `buildWeaponPairs` (requireOh=false for rank). */
export function isValidWeaponComboForRank(
	mh: GearPiece | null | undefined,
	oh: GearPiece | null | undefined,
	profileKey: string,
	loadout: { twoHanded: boolean; dualWield: boolean }
): boolean {
	if (!mh || !mh.link) return false;
	const mh2h = is2HEquipLoc(mh.equipLoc);
	const oh2h = Boolean(oh?.link && is2HEquipLoc(oh.equipLoc));
	if (mh2h) {
		if (!loadout.twoHanded) return false;
		if (!slotCanUseCandidate(16, mh, profileKey)) return false;
		if (oh2h) {
			if (!loadout.dualWield || !isTitansGripSpec(profileKey)) return false;
			if (!slotCanUseCandidate(17, oh!, profileKey)) return false;
			return true;
		}
		return !oh || !oh.link;
	}
	if (!slotCanUseCandidate(16, mh, profileKey)) return false;
	if (oh && oh.link) {
		if (!loadout.dualWield) return false;
		if (is2HEquipLoc(oh.equipLoc)) return false;
		if (!slotCanUseCandidate(17, oh, profileKey)) return false;
		return true;
	}
	return true;
}

function weaponLoadoutDpsDelta(
	predictor: (p: number, c: number, h: number, m: number, v: number) => number,
	baseStats: CombatStats,
	baseDps: number,
	mhPick: GearPiece | null | undefined,
	ohPick: GearPiece | null | undefined,
	eqMh: GearPiece | null | undefined,
	eqOh: GearPiece | null | undefined
): number | null {
	const wdelta = computeWeaponLoadoutStatDelta(mhPick, ohPick, eqMh, eqOh);
	if (!wdelta) return null;
	const withDelta = applyDelta(baseStats, wdelta, 1);
	const candidateDps = predictor(
		Number(withDelta.primary_stat ?? 0),
		Number(withDelta.crit ?? 0),
		Number(withDelta.haste ?? 0),
		Number(withDelta.mastery ?? 0),
		Number(withDelta.versatility ?? 0)
	);
	return candidateDps - baseDps;
}

function pieceScoreKey(slotId: number, piece: GearPiece): string {
	return `${slotId}:${piece.key || piece.link || piece.itemId}`;
}

function bestMainHandPairDelta(
	mhCand: GearPiece,
	ohOptions: readonly GearPiece[],
	eqMh: GearPiece | null,
	eqOh: GearPiece | null,
	profileKey: string,
	loadout: { twoHanded: boolean; dualWield: boolean },
	predict: (p: number, c: number, h: number, m: number, v: number) => number,
	baseStats: CombatStats,
	baseDps: number
): number | null {
	let bestDelta: number | null = null;
	for (const ohPick of ohOptions) {
		if (!isValidWeaponComboForRank(mhCand, ohPick, profileKey, loadout)) continue;
		if (ohPick.link && !hasCombatStats(ohPick.stats) && !is2HEquipLoc(ohPick.equipLoc)) {
			continue;
		}
		const delta = weaponLoadoutDpsDelta(predict, baseStats, baseDps, mhCand, ohPick, eqMh, eqOh);
		if (delta != null && (bestDelta == null || delta > bestDelta)) bestDelta = delta;
	}
	return bestDelta;
}

function bestOffHandPairDelta(
	ohCand: GearPiece,
	mhOptions: readonly GearPiece[],
	eqMh: GearPiece | null,
	eqOh: GearPiece | null,
	profileKey: string,
	loadout: { twoHanded: boolean; dualWield: boolean },
	predict: (p: number, c: number, h: number, m: number, v: number) => number,
	baseStats: CombatStats,
	baseDps: number
): number | null {
	let bestDelta: number | null = null;
	for (const mhPick of mhOptions) {
		if (!isValidWeaponComboForRank(mhPick, ohCand, profileKey, loadout)) continue;
		if (!hasCombatStats(mhPick.stats)) continue;
		const delta = weaponLoadoutDpsDelta(predict, baseStats, baseDps, mhPick, ohCand, eqMh, eqOh);
		if (delta != null && (bestDelta == null || delta > bestDelta)) bestDelta = delta;
	}
	return bestDelta;
}

/**
 * Score MH/OH candidates for the gear list.
 * Combined MH+OH pairing is only used when currently equipped with a 2H;
 * if already dual-wielding, each slot uses a single-slot swap delta.
 * (Predict.lua `applyPairedWeaponCandidateScoring`).
 * Returns scores keyed by `${slotId}:${piece.key}`.
 */
export function applyPairedWeaponCandidateScoring(
	model: LoadedModel,
	state: CharacterState,
	candidatesBySlot: ReadonlyMap<number, readonly GearPiece[]>
): Map<string, WeaponPairScore> {
	const out = new Map<string, WeaponPairScore>();
	const profileKey = state.profileKey;
	if (!profileKey || !model.prebaked[profileKey]) return out;

	const loadout = getWeaponLoadoutForSpec(profileKey);
	const eqMh = state.equipped.find((p) => p.slotId === 16) ?? null;
	const eqOh = state.equipped.find((p) => p.slotId === 17) ?? null;
	const eqIs2H = Boolean(eqMh?.link && is2HEquipLoc(eqMh.equipLoc));

	const baseStats = state.stats;
	const predict = createSpecPredictor(model, profileKey);
	const baseDps = predict(
		Number(baseStats.primary_stat ?? 0),
		Number(baseStats.crit ?? 0),
		Number(baseStats.haste ?? 0),
		Number(baseStats.mastery ?? 0),
		Number(baseStats.versatility ?? 0)
	);

	const emptyOh = emptyWeaponPiece(17);
	const mhCandidates = candidatesBySlot.get(16) ?? [];
	const ohCandidates = candidatesBySlot.get(17) ?? [];

	// Addon: ohOptions = loot OH + equipped OH + empty:17 (if dual_wield)
	const ohOptions: GearPiece[] = [];
	const ohSeen = new Set<string>();
	const addOh = (cand: GearPiece | null | undefined) => {
		if (!cand?.key || ohSeen.has(cand.key)) return;
		ohSeen.add(cand.key);
		ohOptions.push(cand);
	};
	for (const cand of ohCandidates) addOh(cand);
	addOh(eqOh);
	if (loadout.dualWield) addOh(emptyOh);

	// Addon: mhOptions = loot 1H MH + equipped MH (skip 2H unless Titan's Grip handled in addon)
	const mhOptions: GearPiece[] = [];
	const mhSeen = new Set<string>();
	const addMh = (cand: GearPiece | null | undefined) => {
		if (!cand?.key || mhSeen.has(cand.key)) return;
		if (cand.link && is2HEquipLoc(cand.equipLoc)) return;
		mhSeen.add(cand.key);
		mhOptions.push(cand);
	};
	for (const cand of mhCandidates) addMh(cand);
	addMh(eqMh);

	const scoreOne = (cand: GearPiece, slotId: 16 | 17) => {
		if (!cand.link) return;
		if (eqMh && slotId === 16 && cand.key === eqMh.key) return;
		if (eqOh && slotId === 17 && cand.key === eqOh.key) return;
		if (!hasCombatStats(cand.stats)) return;

		let bestDelta: number | null = null;
		let weaponPairScored = false;

		if (slotId === 16 && is2HEquipLoc(cand.equipLoc)) {
			if (!loadout.twoHanded) return;
			if (eqMh?.link && !hasCombatStats(eqMh.stats)) return;
			if (eqOh?.link && !hasCombatStats(eqOh.stats) && !is2HEquipLoc(eqMh?.equipLoc)) return;
			// Explicit empty OH (addon passes nil → coalesces; we avoid that skew).
			bestDelta = weaponLoadoutDpsDelta(predict, baseStats, baseDps, cand, emptyOh, eqMh, eqOh);
		} else if (slotId === 16) {
			if (!loadout.dualWield) return;
			if (eqMh?.link && !hasCombatStats(eqMh.stats)) return;
			if (eqIs2H) {
				// Switching off a 2H: score best MH+OH pair.
				bestDelta = bestMainHandPairDelta(
					cand,
					ohOptions,
					eqMh,
					eqOh,
					profileKey,
					loadout,
					predict,
					baseStats,
					baseDps
				);
				weaponPairScored = true;
			} else {
				// Already MH+OH: single-slot MH swap, keep current OH.
				bestDelta = weaponLoadoutDpsDelta(predict, baseStats, baseDps, cand, eqOh, eqMh, eqOh);
			}
		} else if (slotId === 17) {
			if (!loadout.dualWield) return;
			if (eqOh?.link && !hasCombatStats(eqOh.stats)) return;
			if (eqIs2H) {
				// Switching off a 2H: score best MH partner for this OH.
				bestDelta = bestOffHandPairDelta(
					cand,
					mhOptions,
					eqMh,
					eqOh,
					profileKey,
					loadout,
					predict,
					baseStats,
					baseDps
				);
				weaponPairScored = true;
			} else if (eqMh) {
				// Already dual-wielding: single-slot OH swap, keep current MH.
				bestDelta = weaponLoadoutDpsDelta(predict, baseStats, baseDps, eqMh, cand, eqMh, eqOh);
			} else {
				bestDelta = bestOffHandPairDelta(
					cand,
					mhOptions,
					eqMh,
					eqOh,
					profileKey,
					loadout,
					predict,
					baseStats,
					baseDps
				);
				weaponPairScored = true;
			}
		}

		if (bestDelta == null) return;
		out.set(pieceScoreKey(slotId, cand), {
			delta: bestDelta,
			candidateDps: baseDps + bestDelta,
			baseDps,
			weaponPairScored
		});
	};

	for (const cand of mhCandidates) scoreOne(cand, 16);
	for (const cand of ohCandidates) scoreOne(cand, 17);
	return out;
}
