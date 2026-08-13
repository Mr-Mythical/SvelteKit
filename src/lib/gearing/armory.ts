/**
 * Client helpers for Battle.net character load on /gearing.
 */

import { matchSpecKey } from './specs';
import { resolveItemStats, type ItemDbJson, type ResolvedItem } from './itemDb';
import { hasCombatStats, sumEquippedCombatStats } from './gearStats';
import { emptyStats, type CombatStats } from './model';
import { primaryStatForProfile, type PrimaryStatKind } from './usable';
import type { GearPiece } from './types';

export type ArmoryEquippedPiece = {
	slot: string;
	itemId: number;
	bonusIds: number[];
	itemLevel: number;
	name: string;
	inventoryType?: string;
	/** Battle.net equipment ratings (preferred for worn gear; includes gems/enchants when reported). */
	combatStats?: CombatStats;
};

/** Live character-sheet ratings from Battle.net `/statistics`. */
export type ArmoryPaperDoll = {
	strength: number;
	agility: number;
	intellect: number;
	crit: number;
	haste: number;
	mastery: number;
	versatility: number;
};

export type ArmoryCharacterResponse = {
	name: string;
	realm: string;
	region: string;
	level: number | null;
	characterClass: string | null;
	activeSpec: string | null;
	equipped: ArmoryEquippedPiece[];
	/** Present when the statistics endpoint returned usable ratings. */
	paperDoll?: ArmoryPaperDoll | null;
	notes: string[];
	error?: string;
};

export type ArmoryLoadResult = {
	character: ArmoryCharacterResponse;
	resolved: ResolvedItem[];
	stats: CombatStats;
	/** True when `stats` came from Battle.net character statistics. */
	statsFromPaperDoll: boolean;
	matchedSpecKey: string | null;
	missingIds: number[];
	warnings: string[];
};

/**
 * Map live `/statistics` primaries + ratings into the NN vector for a profile.
 * Falls back to the largest primary when the profile key is unknown.
 */
export function combatStatsFromArmoryPaperDoll(
	doll: ArmoryPaperDoll,
	profileKey?: string | null
): CombatStats {
	const kind: PrimaryStatKind | null = profileKey ? primaryStatForProfile(profileKey) : null;
	let primary = 0;
	if (kind === 'strength') primary = doll.strength;
	else if (kind === 'agility') primary = doll.agility;
	else if (kind === 'intellect') primary = doll.intellect;
	else primary = Math.max(doll.strength, doll.agility, doll.intellect);

	return {
		primary_stat: primary,
		crit: doll.crit,
		haste: doll.haste,
		mastery: doll.mastery,
		versatility: doll.versatility
	};
}

export async function fetchArmoryCharacter(opts: {
	name: string;
	realm: string;
	region: string;
}): Promise<ArmoryCharacterResponse> {
	const qs = new URLSearchParams({
		name: opts.name.trim(),
		realm: opts.realm.trim(),
		region: opts.region.trim().toLowerCase()
	});
	const res = await fetch(`/api/gearing/character?${qs}`);
	const body = (await res.json()) as ArmoryCharacterResponse & { error?: string };
	if (!res.ok) {
		throw new Error(body.error || `Armory request failed (${res.status})`);
	}
	return body;
}

/** Blizzard profile equipment `slot.type` → inventory slot id (1–17). */
export const BLIZZARD_EQUIP_SLOT_TO_ID: Record<string, number> = {
	HEAD: 1,
	NECK: 2,
	SHOULDER: 3,
	CHEST: 5,
	WAIST: 6,
	LEGS: 7,
	FEET: 8,
	WRIST: 9,
	HANDS: 10,
	FINGER_1: 11,
	FINGER_2: 12,
	TRINKET_1: 13,
	TRINKET_2: 14,
	BACK: 15,
	MAIN_HAND: 16,
	OFF_HAND: 17
};

/** Fallback when `slot.type` is missing — Blizzard `inventory_type.type`. */
const BLIZZARD_INV_TYPE_TO_ID: Record<string, number> = {
	HEAD: 1,
	NECK: 2,
	SHOULDER: 3,
	CLOAK: 15,
	CHEST: 5,
	ROBE: 5,
	WRIST: 9,
	HAND: 10,
	WAIST: 6,
	LEGS: 7,
	FEET: 8,
	FINGER: 11,
	TRINKET: 13,
	WEAPON: 16,
	TWOHWEAPON: 16,
	TWO_HAND: 16,
	WEAPONMAINHAND: 16,
	WEAPONOFFHAND: 17,
	HOLDABLE: 17,
	SHIELD: 17,
	RANGED: 16,
	RANGEDRIGHT: 16
};

/** Blizzard inventory_type.type → WoW equipLoc string. */
const BLIZZARD_INV_TYPE_TO_EQUIP_LOC: Record<string, string> = {
	HEAD: 'INVTYPE_HEAD',
	NECK: 'INVTYPE_NECK',
	SHOULDER: 'INVTYPE_SHOULDER',
	CLOAK: 'INVTYPE_CLOAK',
	CHEST: 'INVTYPE_CHEST',
	ROBE: 'INVTYPE_ROBE',
	WRIST: 'INVTYPE_WRIST',
	HAND: 'INVTYPE_HAND',
	WAIST: 'INVTYPE_WAIST',
	LEGS: 'INVTYPE_LEGS',
	FEET: 'INVTYPE_FEET',
	FINGER: 'INVTYPE_FINGER',
	TRINKET: 'INVTYPE_TRINKET',
	WEAPON: 'INVTYPE_WEAPON',
	TWOHWEAPON: 'INVTYPE_2HWEAPON',
	TWO_HAND: 'INVTYPE_2HWEAPON',
	WEAPONMAINHAND: 'INVTYPE_WEAPONMAINHAND',
	WEAPONOFFHAND: 'INVTYPE_WEAPONOFFHAND',
	HOLDABLE: 'INVTYPE_HOLDABLE',
	SHIELD: 'INVTYPE_SHIELD',
	RANGED: 'INVTYPE_RANGED',
	RANGEDRIGHT: 'INVTYPE_RANGEDRIGHT'
};

export function slotIdForArmoryPiece(armory: ArmoryEquippedPiece): number | undefined {
	const fromSlot = BLIZZARD_EQUIP_SLOT_TO_ID[armory.slot];
	if (fromSlot != null) return fromSlot;
	const inv = (armory.inventoryType || '').toUpperCase().replace(/^INVTYPE_/, '');
	return BLIZZARD_INV_TYPE_TO_ID[inv];
}

export function equipLocForArmoryPiece(armory: ArmoryEquippedPiece): string | undefined {
	const inv = (armory.inventoryType || '').toUpperCase().replace(/^INVTYPE_/, '');
	return BLIZZARD_INV_TYPE_TO_EQUIP_LOC[inv];
}

/**
 * Prefer Battle.net equipment ratings for worn gear (usually includes gems /
 * enchants). Fall back to Item DB when Blizzard omitted usable ratings.
 * Season loot candidates still score from Item DB separately.
 */
export function pickEquippedCombatStats(
	resolved: ResolvedItem | undefined,
	armory: ArmoryEquippedPiece
): CombatStats {
	if (armory.combatStats && hasCombatStats(armory.combatStats)) {
		return { ...emptyStats(), ...armory.combatStats };
	}
	if (resolved && !resolved.missing && hasCombatStats(resolved.stats)) {
		return resolved.stats;
	}
	return emptyStats();
}

/** Map Armory equipment + resolved stats into GearPieces (with slotId when known). */
export function armoryToEquippedPieces(
	character: ArmoryCharacterResponse,
	resolved: ResolvedItem[]
): GearPiece[] {
	const out: GearPiece[] = [];
	for (let i = 0; i < character.equipped.length; i++) {
		const armory = character.equipped[i]!;
		if (armory.slot === 'SHIRT' || armory.slot === 'TABARD') continue;
		const r = resolved[i];
		const slotId = slotIdForArmoryPiece(armory);
		const bonusIds = r?.bonusIds?.length ? r.bonusIds : armory.bonusIds;
		const itemId = r?.itemId ?? armory.itemId;
		// Keep missing-from-DB items visible — skip only made the equipped list look incomplete.
		out.push({
			key: `armory:${slotId ?? armory.slot}:${itemId}:${i}`,
			link: bonusIds.length > 0 ? `item:${itemId}:${bonusIds.join(',')}` : `item:${itemId}`,
			itemId,
			name: armory.name || r?.name || `Item ${itemId}`,
			slotId,
			equipLoc: r?.equipLoc || r?.slot || equipLocForArmoryPiece(armory) || undefined,
			ilvl: armory.itemLevel || r?.itemLevel || undefined,
			quality: r?.quality,
			source: 'equipped',
			sourceLabel: armory.slot.replace(/_/g, ' '),
			stats: pickEquippedCombatStats(r, armory)
		});
	}
	return out;
}

export function resolveArmoryEquipment(
	db: ItemDbJson,
	character: ArmoryCharacterResponse,
	specKeys: string[]
): ArmoryLoadResult {
	const warnings: string[] = [];
	const missingIds: number[] = [];
	const resolved: ResolvedItem[] = [];

	for (const piece of character.equipped) {
		const r = resolveItemStats(db, piece.itemId, {
			itemLevel: piece.itemLevel || undefined,
			bonusIds: piece.bonusIds
		});
		// Prefer Armory display name when present.
		if (piece.name) r.name = piece.name;
		if (r.missing) missingIds.push(piece.itemId);
		resolved.push(r);
	}

	const equippedPieces = armoryToEquippedPieces(character, resolved);
	const gearSum = sumEquippedCombatStats(equippedPieces);

	const matchedSpecKey = matchSpecKey(specKeys, {
		classToken: character.characterClass?.replace(/\s+/g, '') ?? undefined,
		specToken: character.activeSpec?.split(/\s+/)[0] ?? undefined
	});

	let stats = emptyStats();
	let statsFromPaperDoll = false;
	const live =
		character.paperDoll != null
			? combatStatsFromArmoryPaperDoll(character.paperDoll, matchedSpecKey)
			: null;
	if (live && hasCombatStats(live)) {
		stats = live;
		statsFromPaperDoll = true;
	} else if (hasCombatStats(gearSum)) {
		stats = gearSum;
	} else {
		warnings.push('Could not read combat ratings for this character.');
	}

	return {
		character,
		resolved,
		stats,
		statsFromPaperDoll,
		matchedSpecKey,
		missingIds,
		warnings
	};
}
