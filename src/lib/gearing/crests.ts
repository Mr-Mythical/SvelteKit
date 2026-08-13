/**
 * Crest upgrade planning for the Gearing Dashboard.
 * Uses published crests.* from item-db-v1.json plus the browser DPS model.
 */

import { compareItemDelta, type CombatStats, type LoadedModel } from './model';
import {
	findCrestBonus,
	resolveItemStats,
	type CrestBonusInfo,
	type ItemDbJson,
	type ResolvedItem
} from './itemDb';

export type CrestBalances = Record<number, number>;

export type CrestUpgradeStep = {
	itemId: number;
	name: string;
	equipLoc: string;
	fromLevel: number;
	toLevel: number;
	fromBonusId: number;
	toBonusId: number;
	currencyId: number;
	crestCost: number;
	dpsDelta: number;
	dpsPerCrest: number;
	currentStats: CombatStats;
	upgradedStats: CombatStats;
};

export type CrestPlanResult = {
	steps: CrestUpgradeStep[];
	totalDps: number;
	spent: Record<number, number>;
	warnings: string[];
};

export function emptyCrestBalances(db: ItemDbJson): CrestBalances {
	const out: CrestBalances = {};
	for (const c of db.crests?.currencies ?? []) {
		out[c.id] = 0;
	}
	return out;
}

function nextCrestRank(db: ItemDbJson, current: CrestBonusInfo): CrestBonusInfo | null {
	const track = db.crests.tracks[String(current.trackId)];
	if (!track) return null;
	const nextLevel = current.level + 1;
	if (nextLevel > track.maxLevel) return null;
	const rank = track.ranks[String(nextLevel)];
	if (!rank) return null;
	return {
		trackId: current.trackId,
		level: nextLevel,
		itemLevel: rank.itemLevel,
		currencyId: track.currencyId,
		rank: rank.rank,
		maxLevel: track.maxLevel,
		bonusId: rank.bonusId
	};
}

/** One-step crest upgrades available for equipped pieces (no currency gating). */
export function listCrestUpgradeCandidates(
	db: ItemDbJson,
	model: LoadedModel,
	baseStats: CombatStats,
	equipped: ResolvedItem[],
	specKey: string
): CrestUpgradeStep[] {
	const cost = db.crests?.costAmount ?? 20;
	const steps: CrestUpgradeStep[] = [];

	for (const piece of equipped) {
		if (piece.missing || piece.equipLoc === 'INVTYPE_TRINKET') continue;
		const current = findCrestBonus(db, piece.bonusIds);
		if (!current) continue;
		const next = nextCrestRank(db, current);
		if (!next || next.bonusId == null) continue;

		const currentResolved =
			piece.itemLevel === current.itemLevel
				? piece
				: resolveItemStats(db, piece.itemId, {
						itemLevel: current.itemLevel,
						bonusIds: piece.bonusIds
					});
		const upgraded = resolveItemStats(db, piece.itemId, {
			itemLevel: next.itemLevel,
			bonusIds: [next.bonusId]
		});
		if (upgraded.missing) continue;

		const cmp = compareItemDelta(model, baseStats, currentResolved.stats, upgraded.stats, specKey);
		const fromBonusId =
			db.crests.tracks[String(current.trackId)]?.ranks[String(current.level)]?.bonusId ?? 0;
		const toBonusId =
			db.crests.tracks[String(next.trackId)]?.ranks[String(next.level)]?.bonusId ?? 0;

		steps.push({
			itemId: piece.itemId,
			name: piece.name,
			equipLoc: piece.equipLoc,
			fromLevel: current.itemLevel,
			toLevel: next.itemLevel,
			fromBonusId,
			toBonusId,
			currencyId: next.currencyId,
			crestCost: cost,
			dpsDelta: cmp.delta,
			dpsPerCrest: cost > 0 ? cmp.delta / cost : cmp.delta,
			currentStats: currentResolved.stats,
			upgradedStats: upgraded.stats
		});
	}

	return steps.sort((a, b) => b.dpsPerCrest - a.dpsPerCrest);
}

/**
 * Greedy crest spend plan: repeatedly pick the affordable upgrade with best ΔDPS/crest.
 * Chains multiple ranks on the same piece when still best.
 */
export function planCrestUpgrades(
	db: ItemDbJson,
	model: LoadedModel,
	baseStats: CombatStats,
	equipped: ResolvedItem[],
	specKey: string,
	balances: CrestBalances
): CrestPlanResult {
	const warnings: string[] = [];
	const remaining = { ...balances };
	const spent: Record<number, number> = {};
	const working = equipped.map((p) => ({ ...p, bonusIds: [...p.bonusIds] }));
	let stats = { ...baseStats };
	const plan: CrestUpgradeStep[] = [];
	const cost = db.crests?.costAmount ?? 20;

	for (let guard = 0; guard < 64; guard++) {
		const candidates = listCrestUpgradeCandidates(db, model, stats, working, specKey).filter(
			(s) => s.dpsDelta > 0.5 && (remaining[s.currencyId] ?? 0) >= s.crestCost
		);
		if (!candidates.length) break;
		const best = candidates[0]!;
		const idx = working.findIndex((p) => p.itemId === best.itemId);
		if (idx < 0) break;

		const piece = working[idx]!;
		const current = findCrestBonus(db, piece.bonusIds);
		if (!current) break;
		const next = nextCrestRank(db, current);
		if (!next) break;

		remaining[best.currencyId] = (remaining[best.currencyId] ?? 0) - cost;
		spent[best.currencyId] = (spent[best.currencyId] ?? 0) + cost;

		const without = { ...stats };
		without.primary_stat -= best.currentStats.primary_stat;
		without.crit -= best.currentStats.crit;
		without.haste -= best.currentStats.haste;
		without.mastery -= best.currentStats.mastery;
		without.versatility -= best.currentStats.versatility;
		stats = {
			primary_stat: without.primary_stat + best.upgradedStats.primary_stat,
			crit: without.crit + best.upgradedStats.crit,
			haste: without.haste + best.upgradedStats.haste,
			mastery: without.mastery + best.upgradedStats.mastery,
			versatility: without.versatility + best.upgradedStats.versatility
		};

		const nextBonusId =
			db.crests.tracks[String(next.trackId)]?.ranks[String(next.level)]?.bonusId ?? 0;
		const newBonuses = piece.bonusIds.filter((b) => {
			const info = db.crests.bonusIndex[String(b)];
			return !info || info.trackId !== current.trackId;
		});
		newBonuses.push(nextBonusId);
		working[idx] = {
			...resolveItemStats(db, piece.itemId, {
				itemLevel: next.itemLevel,
				bonusIds: newBonuses
			})
		};
		plan.push(best);
	}

	if (!equipped.some((p) => findCrestBonus(db, p.bonusIds))) {
		warnings.push(
			'No crest-track bonus IDs on equipped gear. Load from Armory (or paste bonus IDs) to plan upgrades.'
		);
	}

	const totalDps = plan.reduce((s, step) => s + step.dpsDelta, 0);
	return { steps: plan, totalDps, spent, warnings };
}

export function slotLabel(equipLoc: string): string {
	const map: Record<string, string> = {
		INVTYPE_HEAD: 'Head',
		INVTYPE_NECK: 'Neck',
		INVTYPE_SHOULDER: 'Shoulder',
		INVTYPE_CHEST: 'Chest',
		INVTYPE_ROBE: 'Chest',
		INVTYPE_WAIST: 'Waist',
		INVTYPE_LEGS: 'Legs',
		INVTYPE_FEET: 'Feet',
		INVTYPE_WRIST: 'Wrist',
		INVTYPE_HAND: 'Hands',
		INVTYPE_FINGER: 'Finger',
		INVTYPE_CLOAK: 'Back',
		INVTYPE_WEAPON: 'Weapon',
		INVTYPE_2HWEAPON: 'Weapon',
		INVTYPE_WEAPONMAINHAND: 'Main Hand',
		INVTYPE_WEAPONOFFHAND: 'Off Hand',
		INVTYPE_SHIELD: 'Off Hand',
		INVTYPE_HOLDABLE: 'Off Hand'
	};
	return map[equipLoc] ?? (equipLoc.replace(/^INVTYPE_/, '') || 'Slot');
}
