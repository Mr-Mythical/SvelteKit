/**
 * Bag loadout search for the web Gearing Dashboard.
 * Ports LoadoutEngine: slot pools, weapon pairs, DFS with incremental running
 * deltas + createSpecPredictor (fused when topology matches; no per-leaf full
 * rebuild). Prefer `searchBestBagLoadoutAsync` (Worker + main-thread fallback)
 * from the UI. Slot pools keep every usable candidate (no dominate pruning).
 */

import { createSpecPredictor, emptyStats, type LoadedModel, type SpecPredictor } from './model';
import {
	BAG_NONWEAPON_SLOT_ORDER,
	BAG_SCAN_SLOT_ORDER,
	getWeaponLoadoutForSpec,
	is2HEquipLoc,
	isTitansGripSpec,
	isTrinketEquipLoc,
	SLOT_ID_LABELS,
	slotsForEquipLoc
} from './slots';
import type { CharacterState, GearPiece } from './types';
import { annotatePieceFromItemDb, slotCanUseCandidate } from './usable';
import type { ItemDbJson } from './itemDb';
import {
	allowNonTierPick,
	annotateTierFields,
	buildTierPruneRules,
	candTierAdds,
	canStillSatisfyTier,
	countTargetTierInAssign,
	type TierPruneRules
} from './tier';

export type LoadoutSlotRow = {
	slotId: number;
	slotLabel: string;
	chosen: GearPiece | null;
	equipped: GearPiece | null;
	isUpgrade: boolean;
};

export type LoadoutSearchResult = {
	baseDps: number;
	bestDps: number;
	delta: number;
	combinationsChecked: number;
	combinationsCapped: boolean;
	/** True when the user stopped the search early (best-so-far is still returned). */
	stopped?: boolean;
	slotRows: LoadoutSlotRow[];
	warnings: string[];
};

export type LoadoutSearchProgress = {
	checked: number;
	/** Upper-bound combination space (before tier / unique-item pruning). */
	total: number;
	/**
	 * @deprecated Alias of `total` for older callers / tests.
	 */
	maxCombinations: number;
	baseDps: number;
	bestDps: number;
};

export type LoadoutSearchOpts = {
	/**
	 * Optional cap on leaf evaluations (tests only). Unset = no cap; search runs
	 * the full usable candidate space.
	 */
	maxCombinations?: number;
	onProgress?: (progress: LoadoutSearchProgress) => void;
	/** Emit progress every N leaf evaluations (default 5000 sync / yield interval coop). */
	progressEvery?: number;
	/**
	 * Parallel shard (browser multi-core). Worker `i` of `shardCount` only runs
	 * top-level jobs where `jobId % shardCount === shardIndex`. Jobs are
	 * weapon-pair × leading non-weapon candidates (enough fan-out to feed all cores).
	 */
	shardIndex?: number;
	shardCount?: number;
	/**
	 * Annotate candidates with itemClass / primaryStats before filtering.
	 * Prefer annotating on the main thread and omitting this from Worker posts
	 * (Item DB is large).
	 */
	itemDb?: ItemDbJson;
	/**
	 * Exact pruned combo count from {@link countValidLoadoutLeaves} when already
	 * known (keeps progress totals aligned with combinationsChecked).
	 */
	comboTotalHint?: number;
	/** Pause / resume / stop handle (cooperative + worker searches). */
	control?: LoadoutSearchControl;
};

/**
 * External pause / resume / stop for cooperative loadout searches.
 * Workers mirror this via control messages so the message loop can run while paused.
 */
export class LoadoutSearchControl {
	#paused = false;
	#stopped = false;
	#waiters: Array<() => void> = [];
	#listeners = new Set<() => void>();

	get paused(): boolean {
		return this.#paused;
	}

	get stopped(): boolean {
		return this.#stopped;
	}

	pause(): void {
		if (this.#stopped || this.#paused) return;
		this.#paused = true;
		this.#emit();
	}

	resume(): void {
		if (!this.#paused) return;
		this.#paused = false;
		const waiting = this.#waiters.splice(0);
		for (const resume of waiting) resume();
		this.#emit();
	}

	stop(): void {
		if (this.#stopped) return;
		this.#stopped = true;
		this.#paused = false;
		const waiting = this.#waiters.splice(0);
		for (const resume of waiting) resume();
		this.#emit();
	}

	/** Block while paused; returns immediately if stopped or not paused. */
	async waitIfPaused(): Promise<void> {
		while (this.#paused && !this.#stopped) {
			await new Promise<void>((resolve) => {
				this.#waiters.push(resolve);
			});
		}
	}

	subscribe(listener: () => void): () => void {
		this.#listeners.add(listener);
		return () => this.#listeners.delete(listener);
	}

	#emit(): void {
		for (const listener of this.#listeners) listener();
	}
}

type Cand = GearPiece & { _empty?: boolean };
/** Sync/worker path: progress posts are expensive (structured clone + main thread). */
const DEFAULT_PROGRESS_EVERY = 25_000;
/** Cooperative main-thread yields between this many leaf evals. */
const YIELD_EVERY = 600;

type StatDelta = {
	primary_stat: number;
	crit: number;
	haste: number;
	mastery: number;
	versatility: number;
};

export type LoadoutStatDelta = StatDelta;

function emptyCand(slotId: number): Cand {
	return {
		key: `empty:${slotId}`,
		link: '',
		itemId: 0,
		source: 'equipped',
		stats: emptyStats(),
		_empty: true
	};
}

function zeroDelta(): StatDelta {
	return {
		primary_stat: 0,
		crit: 0,
		haste: 0,
		mastery: 0,
		versatility: 0
	};
}

/**
 * Deep-plain copy of a gear piece for Worker postMessage.
 * Svelte `$state` Proxies (especially nested `stats`) throw DataCloneError
 * when the search plan is sent to workers — which silently falls back to the
 * slow main-thread path (~tens of thousands combos/s instead of millions).
 */
export function plainGearPiece(piece: GearPiece): GearPiece {
	const stats = piece.stats;
	const primary = piece.primaryStats;
	return {
		key: piece.key,
		link: piece.link,
		itemId: piece.itemId,
		name: piece.name,
		slotId: piece.slotId,
		equipLoc: piece.equipLoc,
		ilvl: piece.ilvl,
		quality: piece.quality,
		source: piece.source,
		sourceLabel: piece.sourceLabel,
		instanceName: piece.instanceName,
		vaultActivityId: piece.vaultActivityId,
		stats: {
			primary_stat: Number(stats?.primary_stat ?? 0) || 0,
			crit: Number(stats?.crit ?? 0) || 0,
			haste: Number(stats?.haste ?? 0) || 0,
			mastery: Number(stats?.mastery ?? 0) || 0,
			versatility: Number(stats?.versatility ?? 0) || 0
		},
		isEmbellished: piece.isEmbellished,
		isTierPiece: piece.isTierPiece,
		tierMatchKey: piece.tierMatchKey ?? null,
		bag: piece.bag,
		slot: piece.slot,
		guid: piece.guid,
		itemClass: piece.itemClass,
		itemSubclass: piece.itemSubclass,
		primaryStats: primary
			? {
					strength: Number(primary.strength ?? 0) || 0,
					agility: Number(primary.agility ?? 0) || 0,
					intellect: Number(primary.intellect ?? 0) || 0
				}
			: undefined
	};
}

function plainCand(piece: GearPiece, extra?: Partial<Cand>): Cand {
	return { ...plainGearPiece(piece), ...extra };
}

function equippedBySlot(state: CharacterState): Record<number, Cand> {
	const map: Record<number, Cand> = {};
	for (const piece of state.equipped) {
		if (piece.slotId != null) map[piece.slotId] = plainCand(piece);
	}
	return map;
}

function buildSlotCandidates(
	state: CharacterState,
	opts?: { itemDb?: ItemDbJson; profileKey?: string }
): {
	slotCandidates: Record<number, Cand[]>;
	equipped: Record<number, Cand>;
	warnings: string[];
} {
	const warnings: string[] = [];
	const profileKey = opts?.profileKey || state.profileKey || '';
	const itemDb = opts?.itemDb;
	const equipped = equippedBySlot(state);
	const slotCandidates: Record<number, Cand[]> = {};
	const seen: Record<number, Set<string>> = {};

	for (const slotId of BAG_SCAN_SLOT_ORDER) {
		slotCandidates[slotId] = [];
		seen[slotId] = new Set();
		const eq = equipped[slotId];
		if (eq) {
			const tagged = annotateTierFields(eq);
			equipped[slotId] = tagged;
			slotCandidates[slotId]!.push(tagged);
			seen[slotId]!.add(tagged.key);
		} else if (slotId === 17 || slotId === 11 || slotId === 12) {
			const empty = emptyCand(slotId);
			slotCandidates[slotId]!.push(empty);
			seen[slotId]!.add(empty.key);
		}
	}

	// Always allow a clear-OH option so 2H loadouts remain reachable when an
	// off-hand is currently equipped (addon LoadoutEngine empty:17 behavior).
	if (!seen[17]?.has('empty:17')) {
		const empty = emptyCand(17);
		slotCandidates[17] = slotCandidates[17] ?? [];
		slotCandidates[17].push(empty);
		seen[17] = seen[17] ?? new Set();
		seen[17].add(empty.key);
	}

	const add = (slotId: number, cand: Cand) => {
		if (!slotCandidates[slotId] || !seen[slotId]) return;
		if (seen[slotId]!.has(cand.key)) return;
		if (isTrinketEquipLoc(cand.equipLoc)) return;
		if (profileKey && !slotCanUseCandidate(slotId, cand, profileKey)) return;
		slotCandidates[slotId]!.push(cand);
		seen[slotId]!.add(cand.key);
	};

	let skippedUnusable = 0;
	for (const raw of state.bags) {
		if (isTrinketEquipLoc(raw.equipLoc)) {
			warnings.push(`Skipped trinket in bags: ${raw.name || raw.itemId}`);
			continue;
		}
		const piece = annotateTierFields(annotatePieceFromItemDb(raw, itemDb));
		const slots = slotsForEquipLoc(piece.equipLoc);
		if (!slots.length) {
			warnings.push(`No slot mapping for ${piece.name || piece.link || piece.itemId}`);
			continue;
		}
		let added = false;
		for (const sid of slots) {
			if (!slotCandidates[sid]) continue;
			const before = seen[sid]!.size;
			add(sid, plainCand(piece));
			if (seen[sid]!.size > before) added = true;
		}
		if (!added && profileKey) skippedUnusable += 1;
	}

	if (skippedUnusable > 0) {
		warnings.push(
			`Skipped ${skippedUnusable} bag item(s) unusable for this class/spec (armor, weapon, or primary stat).`
		);
	}

	for (const slotId of BAG_SCAN_SLOT_ORDER) {
		let list = slotCandidates[slotId] ?? [];
		if (slotId === 17 && list.length === 0) list = [emptyCand(17)];
		slotCandidates[slotId] = list;
	}

	return { slotCandidates, equipped, warnings: [...new Set(warnings)].slice(0, 8) };
}

function isValidWeaponCombo(
	mh: Cand | undefined,
	oh: Cand | undefined,
	loadout: { twoHanded: boolean; dualWield: boolean },
	requireOh: boolean,
	profileKey: string
): boolean {
	if (!mh || !mh.link) return false;
	const mh2h = is2HEquipLoc(mh.equipLoc);
	const oh2h = Boolean(oh?.link && is2HEquipLoc(oh.equipLoc));
	if (mh2h) {
		if (!loadout.twoHanded) return false;
		if (profileKey && !slotCanUseCandidate(16, mh, profileKey)) return false;
		if (oh2h) {
			// Titan's Grip: dual 2H.
			if (!loadout.dualWield || !isTitansGripSpec(profileKey)) return false;
			if (profileKey && !slotCanUseCandidate(17, oh!, profileKey)) return false;
			return true;
		}
		return !oh || !oh.link;
	}
	if (profileKey && !slotCanUseCandidate(16, mh, profileKey)) return false;
	if (oh && oh.link) {
		if (!loadout.dualWield) return false;
		if (is2HEquipLoc(oh.equipLoc)) return false;
		if (profileKey && !slotCanUseCandidate(17, oh, profileKey)) return false;
		return true;
	}
	if (requireOh && loadout.dualWield) return false;
	return true;
}

function deltaVsEquipped(cand: Cand, eq: Cand | undefined): StatDelta {
	if (!eq || cand.key === eq.key) return zeroDelta();
	return {
		primary_stat: (cand.stats.primary_stat ?? 0) - (eq.stats.primary_stat ?? 0),
		crit: (cand.stats.crit ?? 0) - (eq.stats.crit ?? 0),
		haste: (cand.stats.haste ?? 0) - (eq.stats.haste ?? 0),
		mastery: (cand.stats.mastery ?? 0) - (eq.stats.mastery ?? 0),
		versatility: (cand.stats.versatility ?? 0) - (eq.stats.versatility ?? 0)
	};
}

function isEmptyKey(key: string | undefined | null): boolean {
	return !key || key.startsWith('empty:');
}

function effectiveSlotList(slotCandidates: Record<number, Cand[]>, slotId: number): Cand[] {
	const raw = slotCandidates[slotId] ?? [];
	return raw.length > 0 ? raw : [emptyCand(slotId)];
}

/** Same item key in two non-ring / non-weapon slots → formula/DP cannot model DFS skips. */
function slotListsShareItemKeys(slotCandidates: Record<number, Cand[]>): boolean {
	const seen = new Map<string, number>();
	for (const [slotStr, list] of Object.entries(slotCandidates)) {
		const slotId = Number(slotStr);
		if (!Number.isFinite(slotId)) continue;
		for (const cand of list ?? []) {
			const key = cand?.key;
			if (!key || isEmptyKey(key)) continue;
			const prev = seen.get(key);
			if (prev != null) {
				const ringOnly = (prev === 11 || prev === 12) && (slotId === 11 || slotId === 12);
				// MH/OH may list the same 1H — weapon pairs handle uniqueness.
				const weaponOnly = (prev === 16 || prev === 17) && (slotId === 16 || slotId === 17);
				if (!ringOnly && !weaponOnly) return true;
			} else {
				seen.set(key, slotId);
			}
		}
	}
	return false;
}

/** Exact ring1×ring2 pairs (unique key + ring order), matching search leaf filter. */
function countRingPairCombinations(list11: Cand[], list12: Cand[]): number {
	let total = 0;
	for (const c1 of list11) {
		for (const c2 of list12) {
			const k1 = c1?.key;
			const k2 = c2?.key;
			const e1 = isEmptyKey(k1);
			const e2 = isEmptyKey(k2);
			if (!e1 && !e2 && k1 === k2) continue;
			if (k1 && k2 && !e1 && !e2 && k1 > k2) continue;
			total += 1;
		}
	}
	return total;
}

/**
 * Unconstrained product: weaponPairs × ∏ slots × exact ring pairs.
 * Addon `countLoadoutCombinationsProduct` (web uses pre-built weapon pairs).
 */
function countLoadoutCombinationsProduct(
	weaponPairCount: number,
	slotCandidates: Record<number, Cand[]>
): number {
	if (weaponPairCount <= 0) return 0;
	let total = weaponPairCount;
	for (const slotId of BAG_NONWEAPON_SLOT_ORDER) {
		if (slotId === 11 || slotId === 12) continue;
		total *= Math.max(1, effectiveSlotList(slotCandidates, slotId).length);
		if (total <= 0) return 0;
	}
	const ringTotal = countRingPairCombinations(
		effectiveSlotList(slotCandidates, 11),
		effectiveSlotList(slotCandidates, 12)
	);
	if (ringTotal <= 0) return 0;
	return total * ringTotal;
}

/**
 * DP over (tierCount, ring1Key) with 4pc prune — addon `countLoadoutCombinationsDp`
 * without vault/embellish (web search does not enforce those).
 */
function countLoadoutCombinationsDp(
	slotCandidates: Record<number, Cand[]>,
	weaponPairs: { mh: Cand; oh: Cand }[],
	tierRules: TierPruneRules | null
): number {
	if (weaponPairs.length === 0) return 0;
	const minTier = tierRules?.active ? tierRules.minTierSetPieces : 0;
	const order = BAG_NONWEAPON_SLOT_ORDER;

	type Ways = Map<string, number>;
	const encode = (tier: number, ring1: string) => `${tier}\0${ring1}`;

	let dp: Ways = new Map();
	for (const pair of weaponPairs) {
		const tier = candTierAdds(tierRules, pair.mh, 16) + candTierAdds(tierRules, pair.oh, 17);
		const key = encode(tier, '');
		dp.set(key, (dp.get(key) ?? 0) + 1);
	}
	if (dp.size === 0) return 0;

	for (let i = 0; i < order.length; i++) {
		const idx1Based = i + 1;
		const slotId = order[i]!;
		const list = effectiveSlotList(slotCandidates, slotId);
		const nextDp: Ways = new Map();

		for (const [stateKey, ways] of dp) {
			const sep = stateKey.indexOf('\0');
			const tier = Number(stateKey.slice(0, sep)) || 0;
			const ring1 = stateKey.slice(sep + 1);
			if (!canStillSatisfyTier(tierRules, order, idx1Based, tier, slotId)) {
				continue;
			}
			for (const cand of list) {
				const key = cand.key;
				const empty = isEmptyKey(key);
				if (slotId === 12 && ring1 !== '' && key && !empty) {
					if (key === ring1 || ring1 > key) continue;
				}
				if (
					!empty &&
					!allowNonTierPick(tierRules, order, idx1Based, slotId, tier) &&
					candTierAdds(tierRules, cand, slotId) === 0
				) {
					continue;
				}
				const nextTier = tier + candTierAdds(tierRules, cand, slotId);
				let nextRing1 = ring1;
				if (slotId === 11) {
					nextRing1 = key && !empty ? key : '';
				}
				const nextKey = encode(nextTier, nextRing1);
				nextDp.set(nextKey, (nextDp.get(nextKey) ?? 0) + ways);
			}
		}
		dp = nextDp;
		if (dp.size === 0) return 0;
	}

	let total = 0;
	for (const [stateKey, ways] of dp) {
		const tier = Number(stateKey.slice(0, stateKey.indexOf('\0'))) || 0;
		if (tier >= minTier) total += ways;
	}
	return total;
}

/**
 * Addon `countLoadoutCombinationsFormula`: product / DP when unique keys allow it.
 * Returns null when the same item spans multiple non-ring slots (needs DFS).
 */
function countLoadoutCombinationsFormula(
	slotCandidates: Record<number, Cand[]>,
	weaponPairs: { mh: Cand; oh: Cand }[],
	tierRules: TierPruneRules | null
): number | null {
	if (weaponPairs.length === 0) return 0;
	if (slotListsShareItemKeys(slotCandidates)) return null;
	if (!tierRules?.active) {
		return countLoadoutCombinationsProduct(weaponPairs.length, slotCandidates);
	}
	return countLoadoutCombinationsDp(slotCandidates, weaponPairs, tierRules);
}

/** Fallback upper bound when formula cannot run (shared keys across slots). */
function estimateComboTotal(
	weaponPairCount: number,
	slotCandidates: Record<number, Cand[]>
): number {
	return Math.max(1, countLoadoutCombinationsProduct(weaponPairCount, slotCandidates));
}

function buildWeaponPairs(
	slotCandidates: Record<number, Cand[]>,
	profileKey: string
): { mh: Cand; oh: Cand }[] {
	const loadout = getWeaponLoadoutForSpec(profileKey);
	let requireOh = false;
	for (const c of slotCandidates[17] ?? []) {
		if (c.link) {
			requireOh = true;
			break;
		}
	}

	const weaponPairs: { mh: Cand; oh: Cand }[] = [];
	const buildPairs = (strict: boolean) => {
		weaponPairs.length = 0;
		for (const mh of slotCandidates[16] ?? []) {
			for (const oh of slotCandidates[17] ?? [emptyCand(17)]) {
				if (mh.key && oh.key && mh.key === oh.key && oh.link) continue;
				if (isValidWeaponCombo(mh, oh, loadout, strict, profileKey)) {
					weaponPairs.push({ mh, oh });
				}
			}
		}
	};
	buildPairs(requireOh);
	if (weaponPairs.length === 0 && requireOh) buildPairs(false);
	return weaponPairs;
}

/**
 * Combo count: formula/DP when possible, else DFS (shared keys across slots).
 * Prefer {@link estimateLoadoutComboCount} for UI — it never DFS-walks.
 */
export function countLoadoutCombinations(
	slotCandidates: Record<number, Cand[]>,
	weaponPairs: { mh: Cand; oh: Cand }[],
	tierRules: TierPruneRules | null
): number {
	const fast = countLoadoutCombinationsFormula(slotCandidates, weaponPairs, tierRules);
	if (fast != null) return fast;
	return countValidLoadoutLeaves(slotCandidates, weaponPairs, tierRules);
}

/**
 * Combo estimate for the selection UI — addon formula/DP (instant).
 * Never DFS-enumerates; if unique-key sharing blocks the formula, uses the
 * product upper bound so the page stays responsive.
 */
export function estimateLoadoutComboCount(
	state: CharacterState,
	opts?: { itemDb?: ItemDbJson | null }
): number {
	const parts = buildComboCountParts(state, opts);
	if (!parts) return 0;
	const fast = countLoadoutCombinationsFormula(
		parts.slotCandidates,
		parts.weaponPairs,
		parts.tierRules
	);
	if (fast != null) return fast;
	return estimateComboTotal(parts.weaponPairs.length, parts.slotCandidates);
}

/** Serializable inputs for combo counting / Worker posts. */
export type ComboCountParts = {
	slotCandidates: Record<number, GearPiece[]>;
	weaponPairs: { mh: GearPiece; oh: GearPiece }[];
	tierRules: TierPruneRules | null;
};

/** Build candidate pools + pairs for {@link countLoadoutCombinations}. */
export function buildComboCountParts(
	state: CharacterState,
	opts?: { itemDb?: ItemDbJson | null }
): ComboCountParts | null {
	const profileKey = state.profileKey || '';
	if (!profileKey) return null;
	const { slotCandidates } = buildSlotCandidates(state, {
		itemDb: opts?.itemDb ?? undefined,
		profileKey
	});
	const weaponPairs = buildWeaponPairs(slotCandidates, profileKey);
	if (weaponPairs.length === 0) return null;
	return {
		slotCandidates,
		weaponPairs,
		tierRules: buildTierPruneRules(slotCandidates)
	};
}

function makeProgress(
	checked: number,
	total: number,
	baseDps: number,
	bestDps: number
): LoadoutSearchProgress {
	return {
		checked,
		total,
		maxCombinations: total,
		baseDps,
		bestDps
	};
}

function buildSlotRows(
	bestAssign: Record<number, Cand> | null,
	equipped: Record<number, Cand>
): LoadoutSlotRow[] {
	const slotRows: LoadoutSlotRow[] = [];
	if (!bestAssign) return slotRows;
	for (const slotId of BAG_SCAN_SLOT_ORDER) {
		const chosen = bestAssign[slotId] ?? equipped[slotId] ?? null;
		const eq = equipped[slotId] ?? null;
		if (!chosen || !chosen.link) continue;
		const isUpgrade = !eq || eq.key !== chosen.key;
		slotRows.push({
			slotId,
			slotLabel: SLOT_ID_LABELS[slotId] ?? String(slotId),
			chosen: chosen._empty ? null : chosen,
			equipped: eq && !eq._empty ? eq : null,
			isUpgrade
		});
	}
	return slotRows;
}

type PreparedSearch = {
	slotCandidates: Record<number, Cand[]>;
	equipped: Record<number, Cand>;
	weaponPairs: { mh: Cand; oh: Cand }[];
	deltaCache: Map<string, StatDelta>;
	predictor: SpecPredictor;
	baseP: number;
	baseC: number;
	baseH: number;
	baseM: number;
	baseV: number;
	baseDps: number;
	total: number;
	maxCombos: number;
	progressEvery: number;
	onProgress?: (progress: LoadoutSearchProgress) => void;
	warnings: string[];
	shardIndex: number;
	shardCount: number;
	/** Leading non-weapon slots folded into the parallel job key (0–3). */
	shardBranchDepth: number;
	tierRules: TierPruneRules | null;
	control?: LoadoutSearchControl;
};

/**
 * Serializable search package: built once on the main thread, then cloned to
 * workers so each shard skips bag filtering / pair build.
 * Same DFS + predictor math as a normal search — only the pipeline changes.
 */
export type LoadoutSearchPlan = {
	ok: true;
	profileKey: string;
	baseP: number;
	baseC: number;
	baseH: number;
	baseM: number;
	baseV: number;
	baseDps: number;
	total: number;
	warnings: string[];
	slotCandidates: Record<number, Cand[]>;
	equipped: Record<number, Cand>;
	weaponPairs: { mh: Cand; oh: Cand }[];
	/** Warmed delta cache entries (`slotId:key` → delta). */
	deltaEntries: [string, StatDelta][];
	shardBranchDepth: number;
	tierRules: TierPruneRules | null;
};

type EarlyResult = LoadoutSearchResult;

function isEarlyResult(x: LoadoutSearchPlan | EarlyResult): x is EarlyResult {
	return !('ok' in x && x.ok === true);
}

/**
 * Build the candidate pools + weapon pairs once (main thread).
 * `shardCount` is used only to pick branch depth for parallel jobs.
 */
export function buildLoadoutSearchPlan(
	model: LoadedModel,
	state: CharacterState,
	opts?: Pick<
		LoadoutSearchOpts,
		'itemDb' | 'maxCombinations' | 'shardCount' | 'progressEvery' | 'comboTotalHint'
	>
): LoadoutSearchPlan | LoadoutSearchResult {
	const warnings: string[] = [];
	const profileKey = state.profileKey;

	const early = (baseDps: number, bestDps: number, extraWarnings: string[]): EarlyResult => ({
		baseDps,
		bestDps,
		delta: bestDps - baseDps,
		combinationsChecked: 0,
		combinationsCapped: false,
		slotRows: [],
		warnings: extraWarnings
	});

	if (!profileKey || !model.prebaked[profileKey]) {
		return early(0, 0, ['Select a trained spec profile before running Bags search.']);
	}

	const {
		slotCandidates,
		equipped,
		warnings: buildWarnings
	} = buildSlotCandidates(state, {
		itemDb: opts?.itemDb,
		profileKey
	});
	warnings.push(...buildWarnings);

	const baseStats = state.stats;
	const predictor = createSpecPredictor(model, profileKey);
	const baseP = Number(baseStats.primary_stat ?? 0);
	const baseC = Number(baseStats.crit ?? 0);
	const baseH = Number(baseStats.haste ?? 0);
	const baseM = Number(baseStats.mastery ?? 0);
	const baseV = Number(baseStats.versatility ?? 0);
	const baseDps = predictor(baseP, baseC, baseH, baseM, baseV);

	const weaponPairs = buildWeaponPairs(slotCandidates, profileKey);
	if (weaponPairs.length === 0) {
		return early(baseDps, baseDps, [...warnings, 'No valid weapon combinations for this profile.']);
	}

	const deltaCache = new Map<string, StatDelta>();
	const getDelta = (cand: Cand, slotId: number): StatDelta => {
		const cacheKey = `${slotId}:${cand.key}`;
		let d = deltaCache.get(cacheKey);
		if (!d) {
			d = deltaVsEquipped(cand, equipped[slotId]);
			deltaCache.set(cacheKey, d);
		}
		return d;
	};
	for (const slotId of BAG_SCAN_SLOT_ORDER) {
		for (const cand of slotCandidates[slotId] ?? []) {
			getDelta(cand, slotId);
		}
	}

	const shardCount = Math.max(1, Math.floor(opts?.shardCount ?? 1));
	const tierRules = buildTierPruneRules(slotCandidates);
	const formulaTotal = countLoadoutCombinationsFormula(slotCandidates, weaponPairs, tierRules);
	const hint = opts?.comboTotalHint;
	const naiveTotal = estimateComboTotal(weaponPairs.length, slotCandidates);
	const total =
		hint != null && Number.isFinite(hint) && hint > 0
			? Math.floor(hint)
			: formulaTotal != null
				? formulaTotal
				: naiveTotal;
	const shardBranchDepth = chooseShardBranchDepth(slotCandidates, weaponPairs.length, shardCount);
	if (tierRules) {
		warnings.push(
			`Enforcing ${tierRules.minTierSetPieces}-piece tier set (${tierRules.targetMatchKeys.join(', ')}).`
		);
	}

	return {
		ok: true,
		profileKey,
		baseP,
		baseC,
		baseH,
		baseM,
		baseV,
		baseDps,
		total,
		warnings,
		slotCandidates,
		equipped,
		weaponPairs,
		deltaEntries: [...deltaCache.entries()],
		shardBranchDepth,
		tierRules
	};
}

function hydratePlan(
	model: LoadedModel,
	plan: LoadoutSearchPlan,
	opts?: LoadoutSearchOpts
): PreparedSearch {
	const maxCombosGlobal = opts?.maxCombinations ?? Number.POSITIVE_INFINITY;
	const progressEveryBase = opts?.progressEvery ?? DEFAULT_PROGRESS_EVERY;
	const shardCount = Math.max(1, Math.floor(opts?.shardCount ?? 1));
	const shardIndex = Math.min(Math.max(0, Math.floor(opts?.shardIndex ?? 0)), shardCount - 1);
	const maxCombos = Number.isFinite(maxCombosGlobal)
		? Math.max(1, Math.ceil(maxCombosGlobal / shardCount))
		: Number.POSITIVE_INFINITY;
	const progressEvery =
		shardCount > 1
			? Math.max(progressEveryBase, Math.round(DEFAULT_PROGRESS_EVERY * Math.sqrt(shardCount)))
			: progressEveryBase;

	return {
		slotCandidates: plan.slotCandidates,
		equipped: plan.equipped,
		weaponPairs: plan.weaponPairs,
		deltaCache: new Map(plan.deltaEntries),
		predictor: createSpecPredictor(model, plan.profileKey),
		baseP: plan.baseP,
		baseC: plan.baseC,
		baseH: plan.baseH,
		baseM: plan.baseM,
		baseV: plan.baseV,
		baseDps: plan.baseDps,
		total: plan.total,
		maxCombos,
		progressEvery,
		onProgress: opts?.onProgress,
		warnings: plan.warnings,
		shardIndex,
		shardCount,
		// Prefer the plan's depth (computed for the real pool size on main).
		shardBranchDepth: plan.shardBranchDepth,
		tierRules: plan.tierRules,
		control: opts?.control
	};
}

function prepareSearch(
	model: LoadedModel,
	state: CharacterState,
	opts?: LoadoutSearchOpts
): PreparedSearch | EarlyResult {
	const planOrEarly = buildLoadoutSearchPlan(model, state, opts);
	if (isEarlyResult(planOrEarly)) return planOrEarly;
	return hydratePlan(model, planOrEarly, opts);
}

function isPrepared(x: PreparedSearch | EarlyResult): x is PreparedSearch {
	return 'weaponPairs' in x && 'predictor' in x;
}

type RunState = {
	checked: number;
	capped: boolean;
	stopped: boolean;
	bestDps: number;
	bestAssign: Record<number, Cand> | null;
	rp: number;
	rc: number;
	rh: number;
	rm: number;
	rv: number;
	used: Set<string>;
	assign: Record<number, Cand>;
	sinceYield: number;
	lastProgressAt: number;
};

function createRunState(baseDps: number): RunState {
	return {
		checked: 0,
		capped: false,
		stopped: false,
		bestDps: baseDps,
		bestAssign: null,
		rp: 0,
		rc: 0,
		rh: 0,
		rm: 0,
		rv: 0,
		used: new Set(),
		assign: {},
		sinceYield: 0,
		lastProgressAt: 0
	};
}

function applyDeltaInPlace(run: RunState, d: StatDelta, sign: 1 | -1) {
	run.rp += sign * d.primary_stat;
	run.rc += sign * d.crit;
	run.rh += sign * d.haste;
	run.rm += sign * d.mastery;
	run.rv += sign * d.versatility;
}

function getCachedDelta(prep: PreparedSearch, cand: Cand, slotId: number): StatDelta {
	const cacheKey = `${slotId}:${cand.key}`;
	return prep.deltaCache.get(cacheKey) ?? deltaVsEquipped(cand, prep.equipped[slotId]);
}

function emitProgress(prep: PreparedSearch, run: RunState, force = false) {
	if (!prep.onProgress) return;
	if (!force) {
		if (run.checked > 0 && run.checked % prep.progressEvery !== 0) return;
		// Also time-throttle: many shards × frequent posts stalls the UI and workers.
		const now = Date.now();
		if (run.lastProgressAt !== 0 && now - run.lastProgressAt < 200) return;
		run.lastProgressAt = now;
	} else {
		run.lastProgressAt = Date.now();
	}
	prep.onProgress(makeProgress(run.checked, prep.total, prep.baseDps, run.bestDps));
}

function cloneAssign(assign: Record<number, Cand>): Record<number, Cand> {
	const out: Record<number, Cand> = {};
	for (const slotId of BAG_SCAN_SLOT_ORDER) {
		const cand = assign[slotId];
		if (cand) out[slotId] = cand;
	}
	return out;
}

function evalLeaf(prep: PreparedSearch, run: RunState) {
	const ring1 = run.assign[11];
	const ring2 = run.assign[12];
	if (ring1?.key && ring2?.key && ring1.link && ring2.link && ring1.key > ring2.key) return;

	if (
		prep.tierRules?.active &&
		countTargetTierInAssign(run.assign, prep.tierRules) < prep.tierRules.minTierSetPieces
	) {
		return;
	}

	const pred = prep.predictor(
		prep.baseP + run.rp,
		prep.baseC + run.rc,
		prep.baseH + run.rh,
		prep.baseM + run.rm,
		prep.baseV + run.rv
	);
	run.checked += 1;
	run.sinceYield += 1;
	if (!run.bestAssign || pred > run.bestDps + 1e-9) {
		run.bestDps = pred;
		run.bestAssign = cloneAssign(run.assign);
	}
	emitProgress(prep, run);
}

function finishSearch(prep: PreparedSearch, run: RunState): LoadoutSearchResult {
	emitProgress(prep, run, true);
	const warnings = [...prep.warnings];
	if (run.capped) {
		const globalCap = prep.maxCombos * prep.shardCount;
		warnings.push(
			`Search capped at ${globalCap.toLocaleString('en-US')} combinations — result may not be global best.`
		);
	}
	if (run.stopped) {
		warnings.push('Search stopped early — showing best loadout found so far.');
	}
	return {
		baseDps: prep.baseDps,
		bestDps: run.bestDps,
		delta: run.bestDps - prep.baseDps,
		combinationsChecked: run.checked,
		combinationsCapped: run.capped,
		stopped: run.stopped || undefined,
		slotRows: buildSlotRows(run.bestAssign, prep.equipped),
		warnings
	};
}

const nonWeapon = BAG_NONWEAPON_SLOT_ORDER;

function slotCandList(slotCandidates: Record<number, Cand[]>, slotId: number): Cand[] {
	const raw = slotCandidates[slotId] ?? [];
	return raw.length > 0 ? raw : [emptyCand(slotId)];
}

/**
 * Exact pruned leaf count via DFS (unique keys, ring order, 4pc).
 * Prefer {@link countLoadoutCombinations} (formula/DP) for UI — this is the
 * fallback when the same item key appears in multiple non-ring slots.
 */
export function countValidLoadoutLeaves(
	slotCandidates: Record<number, Cand[]>,
	weaponPairs: { mh: Cand; oh: Cand }[],
	tierRules: TierPruneRules | null
): number {
	if (weaponPairs.length === 0) return 0;

	let count = 0;
	const used = new Set<string>();
	const assign: Record<number, Cand> = {};

	const mark = (cand: Cand, slotId: number, on: boolean) => {
		if (on) {
			assign[slotId] = cand;
			if (cand.link && !cand.key.startsWith('empty:')) used.add(cand.key);
		} else {
			if (cand.link && !cand.key.startsWith('empty:')) used.delete(cand.key);
			delete assign[slotId];
		}
	};

	const walk = (idx: number, tierCount: number) => {
		if (idx > nonWeapon.length) {
			const ring1 = assign[11];
			const ring2 = assign[12];
			if (ring1?.key && ring2?.key && ring1.link && ring2.link && ring1.key > ring2.key) {
				return;
			}
			if (
				tierRules?.active &&
				countTargetTierInAssign(assign, tierRules) < tierRules.minTierSetPieces
			) {
				return;
			}
			count += 1;
			return;
		}
		const slotId = nonWeapon[idx - 1]!;
		if (!canStillSatisfyTier(tierRules, nonWeapon, idx, tierCount, slotId)) {
			return;
		}
		const list = slotCandList(slotCandidates, slotId);
		for (const cand of list) {
			const isEmpty = !cand.link || cand.key.startsWith('empty:');
			if (!isEmpty && used.has(cand.key)) continue;
			if (
				!isEmpty &&
				!allowNonTierPick(tierRules, nonWeapon, idx, slotId, tierCount) &&
				candTierAdds(tierRules, cand, slotId) === 0
			) {
				continue;
			}
			mark(cand, slotId, true);
			walk(idx + 1, tierCount + candTierAdds(tierRules, cand, slotId));
			mark(cand, slotId, false);
		}
	};

	for (const pair of weaponPairs) {
		mark(pair.mh, 16, true);
		mark(pair.oh, 17, true);
		walk(1, 0);
		mark(pair.oh, 17, false);
		mark(pair.mh, 16, false);
	}

	return count;
}

/**
 * Fold enough leading non-weapon slots into the job key so `pairs × product`
 * yields plenty of independent jobs for every core (weapon-pair-only sharding
 * leaves most workers idle on 2H / small MH pools).
 */
function chooseShardBranchDepth(
	slotCandidates: Record<number, Cand[]>,
	pairCount: number,
	shardCount: number
): number {
	if (shardCount <= 1) return 0;
	const target = shardCount * 16;
	let product = Math.max(1, pairCount);
	let depth = 0;
	for (const slotId of nonWeapon) {
		product *= Math.max(1, slotCandList(slotCandidates, slotId).length);
		depth += 1;
		if (product >= target || depth >= 4) break;
	}
	return depth;
}

function applyCand(prep: PreparedSearch, run: RunState, cand: Cand, slotId: number, sign: 1 | -1) {
	const d = getCachedDelta(prep, cand, slotId);
	if (sign === 1) {
		run.assign[slotId] = cand;
		if (cand.link && !cand.key.startsWith('empty:')) run.used.add(cand.key);
	}
	applyDeltaInPlace(run, d, sign);
	if (sign === -1) {
		if (cand.link && !cand.key.startsWith('empty:')) run.used.delete(cand.key);
		delete run.assign[slotId];
	}
}

function branchProductFrom(lists: Cand[][], level: number): number {
	let product = 1;
	for (let i = level; i < lists.length; i++) {
		product *= Math.max(1, lists[i]!.length);
	}
	return product;
}

/** True if some job in [base, base + rem) belongs to this shard. */
function rangeHasOwnedJob(
	base: number,
	rem: number,
	shardIndex: number,
	shardCount: number
): boolean {
	if (rem <= 0) return false;
	if (rem >= shardCount) return true;
	const offset = (((shardIndex - (base % shardCount)) % shardCount) + shardCount) % shardCount;
	return offset < rem;
}

/**
 * Shared DFS engine: apply/unapply candidate deltas while walking;
 * eval with predictor(base + running delta).
 * Parallelism: index-based jobs (pair × leading slots); workers skip foreign
 * subtrees before applying so every core stays on real leaf evals.
 */
function runSearchSync(prep: PreparedSearch): LoadoutSearchResult {
	const run = createRunState(prep.baseDps);
	const branchDepth = prep.shardBranchDepth;
	const branchLists = nonWeapon
		.slice(0, branchDepth)
		.map((slotId) => slotCandList(prep.slotCandidates, slotId));
	const { shardIndex, shardCount } = prep;

	const dfs = (idx: number, tierCount: number): boolean => {
		if (run.checked >= prep.maxCombos) {
			run.capped = true;
			return false;
		}
		if (idx > nonWeapon.length) {
			evalLeaf(prep, run);
			return true;
		}
		const slotId = nonWeapon[idx - 1]!;
		if (!canStillSatisfyTier(prep.tierRules, nonWeapon, idx, tierCount, slotId)) {
			return true;
		}
		const list = slotCandList(prep.slotCandidates, slotId);
		for (const cand of list) {
			const isEmpty = !cand.link || cand.key.startsWith('empty:');
			if (!isEmpty && run.used.has(cand.key)) continue;
			if (
				!isEmpty &&
				!allowNonTierPick(prep.tierRules, nonWeapon, idx, slotId, tierCount) &&
				candTierAdds(prep.tierRules, cand, slotId) === 0
			) {
				continue;
			}
			applyCand(prep, run, cand, slotId, 1);
			const nextTier = tierCount + candTierAdds(prep.tierRules, cand, slotId);
			const ok = dfs(idx + 1, nextTier);
			applyCand(prep, run, cand, slotId, -1);
			if (!ok) return false;
		}
		return true;
	};

	const walkOwned = (level: number, jobAcc: number): boolean => {
		const rem = branchProductFrom(branchLists, level);
		if (!rangeHasOwnedJob(jobAcc * rem, rem, shardIndex, shardCount)) return true;

		if (level >= branchDepth) {
			const tierCount = countTargetTierInAssign(run.assign, prep.tierRules);
			return dfs(branchDepth + 1, tierCount);
		}

		const slotId = nonWeapon[level]!;
		const list = branchLists[level]!;
		const len = list.length;
		const idx1Based = level + 1;
		const tierCount = countTargetTierInAssign(run.assign, prep.tierRules);
		if (!canStillSatisfyTier(prep.tierRules, nonWeapon, idx1Based, tierCount, slotId)) {
			return true;
		}
		for (let i = 0; i < len; i++) {
			const cand = list[i]!;
			const isEmpty = !cand.link || cand.key.startsWith('empty:');
			if (!isEmpty && run.used.has(cand.key)) continue;
			if (
				!isEmpty &&
				!allowNonTierPick(prep.tierRules, nonWeapon, idx1Based, slotId, tierCount) &&
				candTierAdds(prep.tierRules, cand, slotId) === 0
			) {
				continue;
			}
			applyCand(prep, run, cand, slotId, 1);
			const ok = walkOwned(level + 1, jobAcc * len + i);
			applyCand(prep, run, cand, slotId, -1);
			if (!ok) return false;
		}
		return true;
	};

	emitProgress(prep, run, true);
	for (let pairIndex = 0; pairIndex < prep.weaponPairs.length; pairIndex++) {
		if (run.capped) break;
		const pair = prep.weaponPairs[pairIndex]!;
		if (branchDepth === 0) {
			if (pairIndex % shardCount !== shardIndex) continue;
			applyCand(prep, run, pair.mh, 16, 1);
			applyCand(prep, run, pair.oh, 17, 1);
			dfs(1, 0);
			applyCand(prep, run, pair.oh, 17, -1);
			applyCand(prep, run, pair.mh, 16, -1);
			continue;
		}
		const rem = branchProductFrom(branchLists, 0);
		if (!rangeHasOwnedJob(pairIndex * rem, rem, shardIndex, shardCount)) continue;
		applyCand(prep, run, pair.mh, 16, 1);
		applyCand(prep, run, pair.oh, 17, 1);
		walkOwned(0, pairIndex);
		applyCand(prep, run, pair.oh, 17, -1);
		applyCand(prep, run, pair.mh, 16, -1);
	}

	return finishSearch(prep, run);
}

/**
 * Cooperative search: same DFS as {@link runSearchSync}, but returns to the
 * event loop every `progressEvery` leaves so pause/stop (and UI paints) can land.
 * Hot path stays fully synchronous between yields — awaiting every recursive call
 * was crushing worker throughput.
 */
async function runSearchCooperative(prep: PreparedSearch): Promise<LoadoutSearchResult> {
	const run = createRunState(prep.baseDps);
	const branchDepth = prep.shardBranchDepth;
	const branchLists = nonWeapon
		.slice(0, branchDepth)
		.map((slotId) => slotCandList(prep.slotCandidates, slotId));
	const { shardIndex, shardCount } = prep;
	const control = prep.control;
	const yieldEvery = Math.max(1, prep.progressEvery);

	type Cont = boolean | Promise<boolean>;
	const isPromise = (v: Cont): v is Promise<boolean> =>
		typeof v === 'object' && v !== null && typeof (v as Promise<boolean>).then === 'function';

	const yieldToUi = async (): Promise<boolean> => {
		if (control?.stopped) {
			run.stopped = true;
			return false;
		}
		await control?.waitIfPaused();
		if (control?.stopped) {
			run.stopped = true;
			return false;
		}
		await new Promise<void>((resolve) => {
			setTimeout(resolve, 0);
		});
		if (control?.stopped) {
			run.stopped = true;
			return false;
		}
		return true;
	};

	const dfs = (idx: number, tierCount: number): Cont => {
		if (run.stopped || control?.stopped) {
			run.stopped = true;
			return false;
		}
		if (run.checked >= prep.maxCombos) {
			run.capped = true;
			return false;
		}
		if (idx > nonWeapon.length) {
			evalLeaf(prep, run);
			if (run.sinceYield >= yieldEvery) {
				run.sinceYield = 0;
				return yieldToUi();
			}
			return true;
		}
		const slotId = nonWeapon[idx - 1]!;
		if (!canStillSatisfyTier(prep.tierRules, nonWeapon, idx, tierCount, slotId)) {
			return true;
		}
		return dfsList(idx, tierCount, slotId, slotCandList(prep.slotCandidates, slotId), 0);
	};

	const dfsList = (
		idx: number,
		tierCount: number,
		slotId: number,
		list: Cand[],
		start: number
	): Cont => {
		for (let i = start; i < list.length; i++) {
			if (run.stopped || control?.stopped) {
				run.stopped = true;
				return false;
			}
			if (run.checked >= prep.maxCombos) {
				run.capped = true;
				return false;
			}
			const cand = list[i]!;
			const isEmpty = !cand.link || cand.key.startsWith('empty:');
			if (!isEmpty && run.used.has(cand.key)) continue;
			if (
				!isEmpty &&
				!allowNonTierPick(prep.tierRules, nonWeapon, idx, slotId, tierCount) &&
				candTierAdds(prep.tierRules, cand, slotId) === 0
			) {
				continue;
			}
			applyCand(prep, run, cand, slotId, 1);
			const nextTier = tierCount + candTierAdds(prep.tierRules, cand, slotId);
			const ok = dfs(idx + 1, nextTier);
			if (isPromise(ok)) {
				return ok.then((cont) => {
					applyCand(prep, run, cand, slotId, -1);
					if (!cont) return false;
					return dfsList(idx, tierCount, slotId, list, i + 1);
				});
			}
			applyCand(prep, run, cand, slotId, -1);
			if (!ok) return false;
		}
		return true;
	};

	const walkOwned = (level: number, jobAcc: number): Cont => {
		if (run.stopped || control?.stopped) {
			run.stopped = true;
			return false;
		}
		const rem = branchProductFrom(branchLists, level);
		if (!rangeHasOwnedJob(jobAcc * rem, rem, shardIndex, shardCount)) return true;

		if (level >= branchDepth) {
			const tierCount = countTargetTierInAssign(run.assign, prep.tierRules);
			return dfs(branchDepth + 1, tierCount);
		}

		const slotId = nonWeapon[level]!;
		const list = branchLists[level]!;
		const idx1Based = level + 1;
		const tierCount = countTargetTierInAssign(run.assign, prep.tierRules);
		if (!canStillSatisfyTier(prep.tierRules, nonWeapon, idx1Based, tierCount, slotId)) {
			return true;
		}
		return walkOwnedList(level, jobAcc, slotId, list, idx1Based, tierCount, 0);
	};

	const walkOwnedList = (
		level: number,
		jobAcc: number,
		slotId: number,
		list: Cand[],
		idx1Based: number,
		tierCount: number,
		start: number
	): Cont => {
		const len = list.length;
		for (let i = start; i < len; i++) {
			if (run.stopped || control?.stopped) {
				run.stopped = true;
				return false;
			}
			const cand = list[i]!;
			const isEmpty = !cand.link || cand.key.startsWith('empty:');
			if (!isEmpty && run.used.has(cand.key)) continue;
			if (
				!isEmpty &&
				!allowNonTierPick(prep.tierRules, nonWeapon, idx1Based, slotId, tierCount) &&
				candTierAdds(prep.tierRules, cand, slotId) === 0
			) {
				continue;
			}
			applyCand(prep, run, cand, slotId, 1);
			const ok = walkOwned(level + 1, jobAcc * len + i);
			if (isPromise(ok)) {
				return ok.then((cont) => {
					applyCand(prep, run, cand, slotId, -1);
					if (!cont) return false;
					return walkOwnedList(level, jobAcc, slotId, list, idx1Based, tierCount, i + 1);
				});
			}
			applyCand(prep, run, cand, slotId, -1);
			if (!ok) return false;
		}
		return true;
	};

	const runPairs = (pairIndex: number): Cont => {
		for (let i = pairIndex; i < prep.weaponPairs.length; i++) {
			if (run.capped || run.stopped) return !run.stopped;
			if (control?.stopped) {
				run.stopped = true;
				return false;
			}
			const pair = prep.weaponPairs[i]!;
			if (branchDepth === 0) {
				if (i % shardCount !== shardIndex) continue;
				applyCand(prep, run, pair.mh, 16, 1);
				applyCand(prep, run, pair.oh, 17, 1);
				const ok = dfs(1, 0);
				if (isPromise(ok)) {
					return ok.then((cont) => {
						applyCand(prep, run, pair.oh, 17, -1);
						applyCand(prep, run, pair.mh, 16, -1);
						if (!cont) return false;
						return runPairs(i + 1);
					});
				}
				applyCand(prep, run, pair.oh, 17, -1);
				applyCand(prep, run, pair.mh, 16, -1);
				if (!ok) return false;
				continue;
			}
			const rem = branchProductFrom(branchLists, 0);
			if (!rangeHasOwnedJob(i * rem, rem, shardIndex, shardCount)) continue;
			applyCand(prep, run, pair.mh, 16, 1);
			applyCand(prep, run, pair.oh, 17, 1);
			const ok = walkOwned(0, i);
			if (isPromise(ok)) {
				return ok.then((cont) => {
					applyCand(prep, run, pair.oh, 17, -1);
					applyCand(prep, run, pair.mh, 16, -1);
					if (!cont) return false;
					return runPairs(i + 1);
				});
			}
			applyCand(prep, run, pair.oh, 17, -1);
			applyCand(prep, run, pair.mh, 16, -1);
			if (!ok) return false;
		}
		return true;
	};

	emitProgress(prep, run, true);
	const top = runPairs(0);
	if (isPromise(top)) await top;
	return finishSearch(prep, run);
}

/**
 * Best bag loadout vs current paper-doll stats.
 * Incremental running deltas + createSpecPredictor.
 */
export function searchBestBagLoadout(
	model: LoadedModel,
	state: CharacterState,
	opts?: LoadoutSearchOpts
): LoadoutSearchResult {
	const prepared = prepareSearch(model, state, opts);
	if (!isPrepared(prepared)) return prepared;
	return runSearchSync(prepared);
}

/** Run DFS from a pre-built plan (workers); same math as {@link searchBestBagLoadout}. */
export function searchBestBagLoadoutFromPlan(
	model: LoadedModel,
	plan: LoadoutSearchPlan,
	opts?: LoadoutSearchOpts
): LoadoutSearchResult {
	return runSearchSync(hydratePlan(model, plan, opts));
}

/** Cooperative plan search — used by workers so pause/stop messages can be handled. */
export async function searchBestBagLoadoutFromPlanCooperative(
	model: LoadedModel,
	plan: LoadoutSearchPlan,
	opts?: LoadoutSearchOpts
): Promise<LoadoutSearchResult> {
	return runSearchCooperative(
		hydratePlan(model, plan, {
			...opts,
			// Match sync worker progress cadence — rare yields, sync between them.
			progressEvery: opts?.progressEvery ?? DEFAULT_PROGRESS_EVERY
		})
	);
}

/**
 * Same search as `searchBestBagLoadout`, but yields to the event loop so the UI
 * can paint/respond when a Worker is unavailable. Prefer the Worker path.
 */
export async function searchBestBagLoadoutCooperative(
	model: LoadedModel,
	state: CharacterState,
	opts?: LoadoutSearchOpts
): Promise<LoadoutSearchResult> {
	const prepared = prepareSearch(model, state, {
		...opts,
		progressEvery: opts?.progressEvery ?? YIELD_EVERY
	});
	if (!isPrepared(prepared)) return prepared;
	return runSearchCooperative(prepared);
}
