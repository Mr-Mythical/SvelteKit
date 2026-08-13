/**
 * Item→stats database loader and SimC-style scaled_stat resolver.
 * Artifact: /gearing/item-db-v{N}.json (published by simc-factory from SimC DBC).
 * Version fields: `version`, `model_compat`, `season`, `wow_build`, optional `source` / `bonuses`.
 */

import type { ArtifactMeta, GameDataSource, ItemBonusEntry } from './gameDataContract';
import { emptyStats, type CombatStats } from './model';
import { itemDbFetchUrl } from './versions';

export type ItemStatAlloc = [mod: number, alloc: number];

export type ItemDbEntry = {
	name: string;
	quality: number;
	level: number;
	inv: number;
	equipLoc: string;
	itemClass: number;
	itemSubclass: number;
	stats: ItemStatAlloc[];
};

export type CrestRank = {
	itemLevel: number;
	bonusId: number;
	rank: number;
};

export type CrestTrack = {
	currencyId: number;
	maxLevel: number;
	ranks: Record<string, CrestRank>;
};

export type CrestBonusInfo = {
	trackId: number;
	level: number;
	itemLevel: number;
	currencyId: number;
	rank: number;
	maxLevel: number;
	bonusId?: number;
};

export type CrestData = {
	costAmount: number;
	accountDiscountMultiplier: number;
	currencies: { id: number; name: string }[];
	tracks: Record<string, CrestTrack>;
	bonusIndex: Record<string, CrestBonusInfo>;
};

export type ScaleTables = {
	ilevelMin: number;
	ilevelMax: number;
	epic: number[][];
	rare: number[][];
	uncommon: number[][];
	crMult: {
		armor: number[];
		weapon: number[];
		trinket: number[];
		jewelry: number[];
	};
	socketCost: number[];
};

export type ItemDbJson = ArtifactMeta & {
	/** Artifact schema version (filename item-db-v{N}.json). */
	version: number;
	/** Must match model_version of the paired NN (e.g. "v6"). */
	model_compat?: string;
	wow_build?: string;
	season?: string;
	notes?: string[];
	source?: GameDataSource;
	itemCount: number;
	items: Record<string, ItemDbEntry>;
	scale: ScaleTables;
	crests: CrestData;
	/**
	 * Optional ItemBonus subset (set-ilevel / offsets). When present, preferred
	 * over crest bonusIndex for resolving target ilvl from bonusIds.
	 */
	bonuses?: Record<string, ItemBonusEntry>;
};

export type ResolvedItem = {
	itemId: number;
	name: string;
	slot: string;
	equipLoc: string;
	quality: number;
	itemLevel: number;
	stats: CombatStats;
	bonusIds: number[];
	missing: boolean;
};

const PRIMARY_MODS = new Set([3, 4, 5, 71, 72, 73, 74]);
const RATING_MODS: Record<number, keyof CombatStats> = {
	32: 'crit',
	36: 'haste',
	40: 'versatility',
	49: 'mastery'
};

const INV = {
	HEAD: 1,
	NECK: 2,
	SHOULDERS: 3,
	CHEST: 5,
	WAIST: 6,
	LEGS: 7,
	FEET: 8,
	WRISTS: 9,
	HANDS: 10,
	FINGER: 11,
	TRINKET: 12,
	WEAPON: 13,
	SHIELD: 14,
	CLOAK: 16,
	WEAPON_2H: 17,
	ROBE: 20,
	WEAPON_MH: 21,
	WEAPON_OH: 22,
	HOLDABLE: 23
} as const;

export function itemDbKey(itemId: number, bonusIds: number[] = []): string {
	const sorted = [...bonusIds].filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
	return sorted.length ? `${itemId}:${sorted.join(',')}` : String(itemId);
}

export function loadItemDbFromJson(raw: ItemDbJson): ItemDbJson {
	if (!raw?.items || !raw.scale) {
		throw new Error('Invalid item DB JSON');
	}
	if (!raw.source) {
		raw = {
			...raw,
			source: {
				pipeline: 'simc-dbc',
				extractor: 'simc casc_extract + dbc_extract → simc-factory export_item_db',
				publishedFrom: 'engine/dbc/generated item_data.inc'
			}
		};
	}
	return raw;
}

/** Fetch published item DB (cache-busted via ?v=). */
export async function fetchItemDb(url: string = itemDbFetchUrl()): Promise<ItemDbJson> {
	const res = await fetch(url, { cache: 'default' });
	if (!res.ok) {
		throw new Error(`Failed to load item DB (${res.status}): ${url}`);
	}
	return loadItemDbFromJson((await res.json()) as ItemDbJson);
}

function bankRound(value: number): number {
	// Match std::nearbyint / Python round half-to-even for socket penalty.
	const floored = Math.floor(value);
	const diff = value - floored;
	if (diff > 0.5) return floored + 1;
	if (diff < 0.5) return floored;
	return floored % 2 === 0 ? floored : floored + 1;
}

function randomSuffixType(itemClass: number, itemSubclass: number, inv: number): number {
	if (itemClass === 2) {
		// Match SimC item_database::random_suffix_type for weapons.
		// 2H-budget subclasses: axe2, bow, gun, mace2, polearm, sword2, staff, crossbow, thrown
		if ([1, 2, 3, 5, 6, 8, 10, 16, 18].includes(itemSubclass) || inv === INV.WEAPON_2H) {
			return 0;
		}
		return 3;
	}
	if (itemClass === 4) {
		switch (inv) {
			case INV.HEAD:
			case INV.CHEST:
			case INV.LEGS:
			case INV.ROBE:
				return 0;
			case INV.SHOULDERS:
			case INV.WAIST:
			case INV.FEET:
			case INV.HANDS:
			case INV.TRINKET:
				return 1;
			case INV.NECK:
			case INV.FINGER:
			case INV.CLOAK:
			case INV.WRISTS:
				return 2;
			case INV.WEAPON_OH:
			case INV.HOLDABLE:
			case INV.SHIELD:
				return 3;
			default:
				return -1;
		}
	}
	return -1;
}

/** Fallback when `inv` is missing/unknown but equipLoc is present. */
function randomSuffixTypeFromEquipLoc(equipLoc: string): number {
	switch (equipLoc) {
		case 'INVTYPE_HEAD':
		case 'INVTYPE_CHEST':
		case 'INVTYPE_ROBE':
		case 'INVTYPE_LEGS':
			return 0;
		case 'INVTYPE_SHOULDER':
		case 'INVTYPE_WAIST':
		case 'INVTYPE_FEET':
		case 'INVTYPE_HAND':
		case 'INVTYPE_TRINKET':
			return 1;
		case 'INVTYPE_NECK':
		case 'INVTYPE_FINGER':
		case 'INVTYPE_CLOAK':
		case 'INVTYPE_WRIST':
			return 2;
		case 'INVTYPE_WEAPONOFFHAND':
		case 'INVTYPE_HOLDABLE':
		case 'INVTYPE_SHIELD':
			return 3;
		case 'INVTYPE_2HWEAPON':
		case 'INVTYPE_RANGED':
		case 'INVTYPE_RANGEDRIGHT':
			return 0;
		case 'INVTYPE_WEAPON':
		case 'INVTYPE_WEAPONMAINHAND':
			return 3;
		default:
			return -1;
	}
}

function clampItemLevel(scale: ScaleTables, ilevel: number): number {
	if (!Number.isFinite(ilevel) || ilevel <= 0) return scale.ilevelMin;
	return Math.min(scale.ilevelMax, Math.max(scale.ilevelMin, Math.round(ilevel)));
}

function crMultKey(inv: number): keyof ScaleTables['crMult'] | null {
	switch (inv) {
		case INV.NECK:
		case INV.FINGER:
			return 'jewelry';
		case INV.TRINKET:
			return 'trinket';
		case INV.WEAPON:
		case INV.WEAPON_2H:
		case INV.WEAPON_MH:
		case INV.WEAPON_OH:
			return 'weapon';
		case INV.ROBE:
		case INV.HEAD:
		case INV.SHOULDERS:
		case INV.CHEST:
		case INV.CLOAK:
		case INV.WRISTS:
		case INV.WAIST:
		case INV.LEGS:
		case INV.FEET:
		case INV.SHIELD:
		case INV.HOLDABLE:
		case INV.HANDS:
			return 'armor';
		default:
			return null;
	}
}

function budgetFor(scale: ScaleTables, quality: number, ilevel: number, slotType: number): number {
	if (slotType < 0 || ilevel < scale.ilevelMin || ilevel > scale.ilevelMax) return 0;
	const idx = ilevel - scale.ilevelMin;
	const table =
		quality === 4 || quality === 5
			? scale.epic
			: quality === 3 || quality === 7
				? scale.rare
				: scale.uncommon;
	const row = table[idx];
	return row?.[slotType] ?? 0;
}

function crMultiplier(scale: ScaleTables, inv: number, ilevel: number): number {
	const key = crMultKey(inv);
	if (!key || ilevel < scale.ilevelMin || ilevel > scale.ilevelMax) return 1;
	const idx = ilevel - scale.ilevelMin;
	const v = scale.crMult[key][idx];
	return v && v !== 0 ? v : 1;
}

function socketCost(scale: ScaleTables, ilevel: number): number {
	if (ilevel < scale.ilevelMin || ilevel > scale.ilevelMax) return 0;
	return scale.socketCost[ilevel - scale.ilevelMin] ?? 0;
}

/** Scale one item's allocations to a target item level (SimC scaled_stat). */
export function resolveItemStats(
	db: ItemDbJson,
	itemId: number,
	opts: { itemLevel?: number; bonusIds?: number[] } = {}
): ResolvedItem {
	const entry = db.items[String(itemId)];
	const bonusIds = opts.bonusIds ?? [];
	let itemLevel = opts.itemLevel ?? resolveItemLevelFromBonuses(db, bonusIds) ?? entry?.level ?? 0;

	if (!entry) {
		return {
			itemId,
			name: `Item ${itemId}`,
			slot: '',
			equipLoc: '',
			quality: 0,
			itemLevel,
			stats: emptyStats(),
			bonusIds,
			missing: true
		};
	}

	let slotType = randomSuffixType(entry.itemClass, entry.itemSubclass, entry.inv);
	if (slotType < 0 && entry.equipLoc) {
		slotType = randomSuffixTypeFromEquipLoc(entry.equipLoc);
	}

	// Keep requests inside the published random-prop scale table (zero budget ⇒ empty stats).
	if (itemLevel < db.scale.ilevelMin || itemLevel > db.scale.ilevelMax) {
		itemLevel = clampItemLevel(db.scale, itemLevel);
	}

	let budget = budgetFor(db.scale, entry.quality, itemLevel, slotType);
	const cr = crMultiplier(db.scale, entry.inv, itemLevel);
	const sock = socketCost(db.scale, itemLevel);
	const stats = emptyStats();

	for (const [mod, alloc] of entry.stats) {
		// Socket mul not exported per-stat in compact DB; penalty ≈ 0 for modern gear.
		const raw = alloc * budget * 0.0001 - bankRound(0 * sock);
		let value = raw;
		if (RATING_MODS[mod]) {
			value = raw * cr;
		}
		const rounded = Math.round(value);
		if (PRIMARY_MODS.has(mod)) {
			stats.primary_stat += rounded;
		} else {
			const key = RATING_MODS[mod];
			if (key) stats[key] += rounded;
		}
	}

	return {
		itemId,
		name: entry.name,
		slot: entry.equipLoc,
		equipLoc: entry.equipLoc,
		quality: entry.quality,
		itemLevel,
		stats,
		bonusIds,
		missing: false
	};
}

/**
 * Resolve item level from bonus IDs (Raidbots/SimC-style):
 * 1) published `bonuses` table (set-level + offsets)
 * 2) crest track bonusIndex
 */
export function resolveItemLevelFromBonuses(db: ItemDbJson, bonusIds: number[]): number | null {
	const table = db.bonuses;
	if (table && bonusIds.length) {
		let level: number | null = null;
		let offset = 0;
		for (const id of bonusIds) {
			const row = table[String(id)];
			if (!row) continue;
			if (typeof row.itemLevel === 'number' && row.itemLevel > 0) {
				level = level == null ? row.itemLevel : Math.max(level, row.itemLevel);
			}
			if (typeof row.levelOffset === 'number') offset += row.levelOffset;
		}
		if (level != null) return level + offset;
		if (offset !== 0) {
			// Offset-only bonuses need a base; fall through to crest/entry.
		}
	}
	return resolveCrestItemLevel(db, bonusIds);
}

export function resolveCrestItemLevel(db: ItemDbJson, bonusIds: number[]): number | null {
	const index = db.crests?.bonusIndex;
	if (!index) return null;
	for (const id of bonusIds) {
		const info = index[String(id)];
		if (info?.itemLevel) return info.itemLevel;
	}
	return null;
}

export function findCrestBonus(db: ItemDbJson, bonusIds: number[]): CrestBonusInfo | null {
	const index = db.crests?.bonusIndex;
	if (!index) return null;
	for (const id of bonusIds) {
		const info = index[String(id)];
		if (info) return info;
	}
	return null;
}

export function sumResolvedStats(pieces: ResolvedItem[], skipTrinkets = true): CombatStats {
	const total = emptyStats();
	for (const piece of pieces) {
		if (skipTrinkets && piece.equipLoc === 'INVTYPE_TRINKET') continue;
		if (piece.missing) continue;
		total.primary_stat += piece.stats.primary_stat;
		total.crit += piece.stats.crit;
		total.haste += piece.stats.haste;
		total.mastery += piece.stats.mastery;
		total.versatility += piece.stats.versatility;
	}
	return total;
}

export function isTrinket(equipLoc: string, inv?: number): boolean {
	return equipLoc === 'INVTYPE_TRINKET' || inv === INV.TRINKET;
}
