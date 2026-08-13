/**
 * Class / armor / weapon / primary-stat usability filters.
 * Ports addon Predict.lua + GearSources.lua `slotCanUseCandidate` /
 * `isGearLinkUsableForPlayer` so Season/Bags don't score plate for priests, etc.
 */

import type { ItemDbEntry, ItemDbJson } from './itemDb';
import type { GearPiece } from './types';
import { annotateTierFields, isOtherClassTierPiece } from './tier';
import {
	getWeaponLoadoutForSpec,
	is2HEquipLoc,
	isRangedEquipLoc,
	isTitansGripSpec,
	rejectsOneHandedWeapons,
	resolveClassSpecParts,
	type ClassSpecParts
} from './slots';

export type PrimaryStatKind = 'strength' | 'agility' | 'intellect';

export type PrimaryStatTotals = {
	strength: number;
	agility: number;
	intellect: number;
};

/** Enough fields to run slot/weapon/armor/primary filters (from export or Item DB). */
export type GearUsabilityInfo = {
	link?: string;
	equipLoc?: string;
	itemId?: number;
	itemClass?: number;
	itemSubclass?: number;
	primaryStats?: PrimaryStatTotals;
};

const WEAPON_SUBCLASS = {
	AXE1: 0,
	AXE2: 1,
	BOW: 2,
	GUN: 3,
	MACE1: 4,
	MACE2: 5,
	POLEARM: 6,
	SWORD1: 7,
	SWORD2: 8,
	WARGLAIVE: 9,
	STAFF: 10,
	FIST: 13,
	DAGGER: 15,
	CROSSBOW: 18,
	WAND: 19
} as const;

type ClassWeaponRules = {
	weaponSubclasses: Set<number>;
	allowShield: boolean;
	allowHoldable: boolean;
};

function weaponSet(...ids: number[]): Set<number> {
	return new Set(ids);
}

/** UnitClass tokens → armor subclass (1 cloth … 4 plate). */
export const CLASS_PRIMARY_ARMOR: Record<string, number> = {
	WARRIOR: 4,
	PALADIN: 4,
	DEATHKNIGHT: 4,
	HUNTER: 3,
	SHAMAN: 3,
	EVOKER: 3,
	ROGUE: 2,
	DRUID: 2,
	MONK: 2,
	DEMONHUNTER: 2,
	MAGE: 1,
	WARLOCK: 1,
	PRIEST: 1
};

const CLASS_WEAPON_RULES: Record<string, ClassWeaponRules> = {
	DEATHKNIGHT: {
		weaponSubclasses: weaponSet(
			WEAPON_SUBCLASS.AXE1,
			WEAPON_SUBCLASS.AXE2,
			WEAPON_SUBCLASS.MACE1,
			WEAPON_SUBCLASS.MACE2,
			WEAPON_SUBCLASS.SWORD1,
			WEAPON_SUBCLASS.SWORD2,
			WEAPON_SUBCLASS.POLEARM
		),
		allowShield: false,
		allowHoldable: false
	},
	DEMONHUNTER: {
		weaponSubclasses: weaponSet(
			WEAPON_SUBCLASS.AXE1,
			WEAPON_SUBCLASS.SWORD1,
			WEAPON_SUBCLASS.FIST,
			WEAPON_SUBCLASS.WARGLAIVE
		),
		allowShield: false,
		allowHoldable: false
	},
	DRUID: {
		weaponSubclasses: weaponSet(
			WEAPON_SUBCLASS.DAGGER,
			WEAPON_SUBCLASS.FIST,
			WEAPON_SUBCLASS.MACE1,
			WEAPON_SUBCLASS.MACE2,
			WEAPON_SUBCLASS.POLEARM,
			WEAPON_SUBCLASS.STAFF
		),
		allowShield: false,
		allowHoldable: true
	},
	EVOKER: {
		weaponSubclasses: weaponSet(
			WEAPON_SUBCLASS.AXE1,
			WEAPON_SUBCLASS.DAGGER,
			WEAPON_SUBCLASS.FIST,
			WEAPON_SUBCLASS.MACE1,
			WEAPON_SUBCLASS.SWORD1,
			WEAPON_SUBCLASS.STAFF
		),
		allowShield: false,
		allowHoldable: true
	},
	HUNTER: {
		weaponSubclasses: weaponSet(
			WEAPON_SUBCLASS.AXE1,
			WEAPON_SUBCLASS.AXE2,
			WEAPON_SUBCLASS.SWORD1,
			WEAPON_SUBCLASS.SWORD2,
			WEAPON_SUBCLASS.POLEARM,
			WEAPON_SUBCLASS.STAFF,
			WEAPON_SUBCLASS.BOW,
			WEAPON_SUBCLASS.GUN,
			WEAPON_SUBCLASS.CROSSBOW
		),
		allowShield: false,
		allowHoldable: false
	},
	MAGE: {
		weaponSubclasses: weaponSet(
			WEAPON_SUBCLASS.DAGGER,
			WEAPON_SUBCLASS.SWORD1,
			WEAPON_SUBCLASS.STAFF,
			WEAPON_SUBCLASS.WAND
		),
		allowShield: false,
		allowHoldable: true
	},
	MONK: {
		weaponSubclasses: weaponSet(
			WEAPON_SUBCLASS.AXE1,
			WEAPON_SUBCLASS.MACE1,
			WEAPON_SUBCLASS.SWORD1,
			WEAPON_SUBCLASS.POLEARM,
			WEAPON_SUBCLASS.STAFF,
			WEAPON_SUBCLASS.FIST
		),
		allowShield: false,
		allowHoldable: true
	},
	PALADIN: {
		weaponSubclasses: weaponSet(
			WEAPON_SUBCLASS.AXE1,
			WEAPON_SUBCLASS.AXE2,
			WEAPON_SUBCLASS.MACE1,
			WEAPON_SUBCLASS.MACE2,
			WEAPON_SUBCLASS.SWORD1,
			WEAPON_SUBCLASS.SWORD2,
			WEAPON_SUBCLASS.POLEARM
		),
		allowShield: true,
		allowHoldable: false
	},
	PRIEST: {
		weaponSubclasses: weaponSet(
			WEAPON_SUBCLASS.DAGGER,
			WEAPON_SUBCLASS.MACE1,
			WEAPON_SUBCLASS.STAFF,
			WEAPON_SUBCLASS.WAND
		),
		allowShield: false,
		allowHoldable: true
	},
	ROGUE: {
		weaponSubclasses: weaponSet(
			WEAPON_SUBCLASS.AXE1,
			WEAPON_SUBCLASS.MACE1,
			WEAPON_SUBCLASS.SWORD1,
			WEAPON_SUBCLASS.DAGGER,
			WEAPON_SUBCLASS.FIST
		),
		allowShield: false,
		allowHoldable: false
	},
	SHAMAN: {
		weaponSubclasses: weaponSet(
			WEAPON_SUBCLASS.AXE1,
			WEAPON_SUBCLASS.AXE2,
			WEAPON_SUBCLASS.MACE1,
			WEAPON_SUBCLASS.MACE2,
			WEAPON_SUBCLASS.STAFF,
			WEAPON_SUBCLASS.DAGGER,
			WEAPON_SUBCLASS.FIST
		),
		allowShield: true,
		allowHoldable: true
	},
	WARLOCK: {
		weaponSubclasses: weaponSet(
			WEAPON_SUBCLASS.DAGGER,
			WEAPON_SUBCLASS.SWORD1,
			WEAPON_SUBCLASS.STAFF,
			WEAPON_SUBCLASS.WAND
		),
		allowShield: false,
		allowHoldable: true
	},
	WARRIOR: {
		weaponSubclasses: weaponSet(
			WEAPON_SUBCLASS.AXE1,
			WEAPON_SUBCLASS.AXE2,
			WEAPON_SUBCLASS.MACE1,
			WEAPON_SUBCLASS.MACE2,
			WEAPON_SUBCLASS.SWORD1,
			WEAPON_SUBCLASS.SWORD2,
			WEAPON_SUBCLASS.POLEARM,
			WEAPON_SUBCLASS.STAFF,
			WEAPON_SUBCLASS.DAGGER,
			WEAPON_SUBCLASS.FIST
		),
		allowShield: true,
		allowHoldable: false
	}
};

const SPEC_OFFHAND_WEAPON_ALLOWED = new Set([
	'Death_Knight_Frost',
	'Demon_Hunter_Havoc',
	'Demon_Hunter_Vengeance',
	'Demon_Hunter_Devourer',
	'Hunter_Survival',
	'Hunter_Survival_PL_DW',
	'Monk_Brewmaster',
	'Monk_Windwalker',
	'Rogue_Assassination',
	'Rogue_Outlaw',
	'Rogue_Subtlety',
	'Shaman_Enhancement'
	// Warrior_Fury uses Titan's Grip (dual 2H), not 1H off-hand weapons.
]);

/** Specs that may equip shields in the off-hand. */
const SPEC_SHIELD_ALLOWED = new Set([
	'Paladin_Holy',
	'Paladin_Protection',
	'Shaman_Elemental',
	'Shaman_Restoration',
	'Warrior_Protection'
]);

/** Spec body (`Mage_Frost`) → primary. DPS-focused; healers default to intellect. */
const SPEC_PRIMARY_STAT: Record<string, PrimaryStatKind> = {
	Death_Knight_Blood: 'strength',
	Death_Knight_Frost: 'strength',
	Death_Knight_Unholy: 'strength',
	Demon_Hunter_Havoc: 'agility',
	Demon_Hunter_Vengeance: 'agility',
	Demon_Hunter_Devourer: 'agility',
	Druid_Balance: 'intellect',
	Druid_Feral: 'agility',
	Druid_Guardian: 'agility',
	Druid_Restoration: 'intellect',
	Evoker_Devastation: 'intellect',
	Evoker_Preservation: 'intellect',
	Evoker_Augmentation: 'intellect',
	Hunter_Beast_Mastery: 'agility',
	Hunter_Marksmanship: 'agility',
	Hunter_Survival: 'agility',
	Hunter_Survival_PL_DW: 'agility',
	Mage_Arcane: 'intellect',
	Mage_Fire: 'intellect',
	Mage_Frost: 'intellect',
	Monk_Brewmaster: 'agility',
	Monk_Mistweaver: 'intellect',
	Monk_Windwalker: 'agility',
	Paladin_Holy: 'intellect',
	Paladin_Protection: 'strength',
	Paladin_Retribution: 'strength',
	Priest_Discipline: 'intellect',
	Priest_Holy: 'intellect',
	Priest_Shadow: 'intellect',
	Rogue_Assassination: 'agility',
	Rogue_Outlaw: 'agility',
	Rogue_Subtlety: 'agility',
	Shaman_Elemental: 'intellect',
	Shaman_Enhancement: 'agility',
	Shaman_Restoration: 'intellect',
	Warlock_Affliction: 'intellect',
	Warlock_Demonology: 'intellect',
	Warlock_Destruction: 'intellect',
	Warrior_Arms: 'strength',
	Warrior_Fury: 'strength',
	Warrior_Protection: 'strength'
};

const ITEM_CLASS_WEAPON = 2;
const ITEM_CLASS_ARMOR = 4;

/** WoW item mod IDs for primary stats (and hybrids). */
const MOD_AGILITY = 3;
const MOD_STRENGTH = 4;
const MOD_INTELLECT = 5;
const MOD_AGI_STR_INT = 71;
const MOD_AGI_STR = 72;
const MOD_AGI_INT = 73;
const MOD_STR_INT = 74;

export type { ClassSpecParts };

export function parseClassSpec(profileKey: string): ClassSpecParts | null {
	return resolveClassSpecParts(profileKey);
}

export function primaryStatForProfile(profileKey: string): PrimaryStatKind | null {
	const parsed = parseClassSpec(profileKey);
	if (!parsed) return null;
	return SPEC_PRIMARY_STAT[parsed.specBody] ?? null;
}

export function primaryTotalsFromEntry(entry: ItemDbEntry): PrimaryStatTotals {
	const totals: PrimaryStatTotals = { strength: 0, agility: 0, intellect: 0 };
	for (const [mod, alloc] of entry.stats) {
		if (alloc <= 0) continue;
		switch (mod) {
			case MOD_STRENGTH:
				totals.strength += alloc;
				break;
			case MOD_AGILITY:
				totals.agility += alloc;
				break;
			case MOD_INTELLECT:
				totals.intellect += alloc;
				break;
			case MOD_AGI_STR_INT:
				totals.strength += alloc;
				totals.agility += alloc;
				totals.intellect += alloc;
				break;
			case MOD_AGI_STR:
				totals.strength += alloc;
				totals.agility += alloc;
				break;
			case MOD_AGI_INT:
				totals.agility += alloc;
				totals.intellect += alloc;
				break;
			case MOD_STR_INT:
				totals.strength += alloc;
				totals.intellect += alloc;
				break;
			default:
				break;
		}
	}
	return totals;
}

export function annotatePieceFromItemDb(
	piece: GearPiece,
	db: ItemDbJson | null | undefined
): GearPiece {
	let next = annotateTierFields(piece);
	if (!db || !next.itemId) return next;
	const entry = db.items[String(next.itemId)];
	if (!entry) return next;
	next = {
		...next,
		equipLoc: next.equipLoc || entry.equipLoc,
		itemClass: next.itemClass ?? entry.itemClass,
		itemSubclass: next.itemSubclass ?? entry.itemSubclass,
		primaryStats: next.primaryStats ?? primaryTotalsFromEntry(entry)
	};
	return annotateTierFields(next);
}

export function annotatePiecesFromItemDb(
	pieces: GearPiece[],
	db: ItemDbJson | null | undefined
): GearPiece[] {
	if (!db) return pieces;
	return pieces.map((p) => annotatePieceFromItemDb(p, db));
}

function primaryTotalsHaveWrongStat(totals: PrimaryStatTotals, wanted: PrimaryStatKind): boolean {
	const wantedAmount = totals[wanted] ?? 0;
	let hasWrong = false;
	for (const kind of ['strength', 'agility', 'intellect'] as const) {
		if (kind !== wanted && (totals[kind] ?? 0) > 0) {
			hasWrong = true;
			break;
		}
	}
	if (hasWrong && wantedAmount <= 0) return true;
	return hasWrong;
}

/**
 * Addon `itemHasUsablePrimaryStat` (without live C_Item fallback).
 * Unknown totals → allow (rings/cloaks often have no primary).
 */
export function itemHasUsablePrimaryStat(info: GearUsabilityInfo, profileKey: string): boolean {
	const wanted = primaryStatForProfile(profileKey);
	if (!wanted) return true;

	const totals = info.primaryStats;
	if (!totals) return true;

	const totalPrimary = totals.strength + totals.agility + totals.intellect;
	if (totalPrimary <= 0) return true;

	if (primaryTotalsHaveWrongStat(totals, wanted)) {
		if (info.itemClass === ITEM_CLASS_WEAPON) return false;
		if ((totals[wanted] ?? 0) <= 0) return false;
	}
	return true;
}

export function isArmorCandidateAllowedForClass(
	classToken: string,
	itemClassID: number | undefined,
	itemSubClassID: number | undefined
): boolean {
	if (itemClassID == null || itemSubClassID == null) return true;
	if (itemClassID !== ITEM_CLASS_ARMOR) return true;
	// Misc (0) — shirts/jewelry-ish; shields (6) are gated by allowShield / INVTYPE_SHIELD.
	if (itemSubClassID === 0) return true;
	if (itemSubClassID === 6) return false;
	const primaryArmor = CLASS_PRIMARY_ARMOR[classToken];
	if (primaryArmor == null) return true;
	return itemSubClassID === primaryArmor;
}

export function isWeaponSubclassAllowedForClass(
	classToken: string,
	subClassID: number | undefined
): boolean {
	if (subClassID == null) return true;
	const rules = CLASS_WEAPON_RULES[classToken];
	if (!rules) return false;
	return rules.weaponSubclasses.has(subClassID);
}

export function isItemAllowedForMainHand(
	classToken: string,
	itemClassID: number | undefined,
	itemSubClassID: number | undefined,
	equipLoc: string | undefined
): boolean {
	if (!classToken) return false;
	if (equipLoc === 'INVTYPE_SHIELD' || equipLoc === 'INVTYPE_HOLDABLE') return false;
	if (itemClassID != null && itemClassID !== ITEM_CLASS_WEAPON) return false;
	return isWeaponSubclassAllowedForClass(classToken, itemSubClassID);
}

export function isItemAllowedForOffHand(
	classToken: string,
	profileKey: string,
	itemClassID: number | undefined,
	itemSubClassID: number | undefined,
	equipLoc: string | undefined
): boolean {
	if (!classToken) return false;
	const rules = CLASS_WEAPON_RULES[classToken];
	if (!rules) return false;

	const parsed = parseClassSpec(profileKey);
	const specBody = parsed?.specBody;

	if (equipLoc === 'INVTYPE_SHIELD') {
		return Boolean(specBody && SPEC_SHIELD_ALLOWED.has(specBody) && rules.allowShield);
	}
	if (equipLoc === 'INVTYPE_HOLDABLE') return rules.allowHoldable;

	if (itemClassID != null && itemClassID !== ITEM_CLASS_WEAPON) return false;
	if (!isWeaponSubclassAllowedForClass(classToken, itemSubClassID)) return false;
	if (!specBody) return false;
	// Fury rejects 1H entirely (Titan's Grip is dual 2H only).
	if (rejectsOneHandedWeapons(profileKey)) return false;
	return SPEC_OFFHAND_WEAPON_ALLOWED.has(specBody);
}

function isMainHandEquipLocAllowed(equipLoc: string | undefined, profileKey: string): boolean {
	if (!equipLoc) return false;
	if (isRangedEquipLoc(equipLoc) || is2HEquipLoc(equipLoc)) {
		return getWeaponLoadoutForSpec(profileKey).twoHanded || isRangedEquipLoc(equipLoc);
	}
	// 1H / MH-only: rejected for pure-2H specs and Titan's Grip Fury.
	if (rejectsOneHandedWeapons(profileKey)) return false;
	return true;
}

/**
 * Addon `slotCanUseCandidate` — slot fit + armor type + weapon type + primary.
 * Empty candidates (no link) allowed for OH / rings.
 */
export function slotCanUseCandidate(
	slotId: number,
	cand: GearUsabilityInfo,
	profileKey: string
): boolean {
	const parsed = parseClassSpec(profileKey);
	const classToken = parsed?.classToken ?? '';
	const loadout = getWeaponLoadoutForSpec(profileKey);

	if (!cand.link) {
		return slotId === 17 || slotId === 11 || slotId === 12 || slotId === 13 || slotId === 14;
	}

	if (!itemHasUsablePrimaryStat(cand, profileKey)) return false;

	if (parsed && isOtherClassTierPiece(cand.itemId, parsed.classToken)) {
		return false;
	}

	const equipLoc = cand.equipLoc;
	if (!equipLoc) return false;

	const itemClassID = cand.itemClass;
	const itemSubClassID = cand.itemSubclass;

	if (slotId === 16) {
		if (!isMainHandEquipLocAllowed(equipLoc, profileKey)) return false;
		if (is2HEquipLoc(equipLoc)) {
			return (
				loadout.twoHanded &&
				isItemAllowedForMainHand(classToken, itemClassID, itemSubClassID, equipLoc)
			);
		}
		return isItemAllowedForMainHand(classToken, itemClassID, itemSubClassID, equipLoc);
	}

	if (slotId === 17) {
		if (!loadout.dualWield) return false;
		if (is2HEquipLoc(equipLoc)) {
			return (
				isTitansGripSpec(profileKey) &&
				isItemAllowedForMainHand(classToken, itemClassID, itemSubClassID, equipLoc)
			);
		}
		return isItemAllowedForOffHand(classToken, profileKey, itemClassID, itemSubClassID, equipLoc);
	}

	if (slotId === 11 || slotId === 12) return equipLoc === 'INVTYPE_FINGER';
	if (slotId === 13 || slotId === 14) return equipLoc === 'INVTYPE_TRINKET';

	// Cloaks / necks are wearable by all armor classes (not primary-armor gated).
	if (equipLoc === 'INVTYPE_CLOAK' || equipLoc === 'INVTYPE_NECK') return true;

	return isArmorCandidateAllowedForClass(classToken, itemClassID, itemSubClassID);
}

/** Broad “could this character ever use this item?” (season catalog filter). */
export function isGearUsableForProfile(info: GearUsabilityInfo, profileKey: string): boolean {
	if (!info.equipLoc || info.equipLoc === 'INVTYPE_TRINKET') return false;
	if (!itemHasUsablePrimaryStat(info, profileKey)) return false;

	const parsed = parseClassSpec(profileKey);
	if (!parsed) return true;
	const { classToken } = parsed;
	const loadout = getWeaponLoadoutForSpec(profileKey);

	if (isOtherClassTierPiece(info.itemId, classToken)) return false;

	// Shields / holdables are armor itemClass but off-hand only — check before armor type.
	if (info.equipLoc === 'INVTYPE_SHIELD' || info.equipLoc === 'INVTYPE_HOLDABLE') {
		if (!loadout.dualWield) return false;
		return isItemAllowedForOffHand(
			classToken,
			profileKey,
			info.itemClass,
			info.itemSubclass,
			info.equipLoc
		);
	}

	if (info.itemClass === ITEM_CLASS_ARMOR) {
		if (info.equipLoc === 'INVTYPE_CLOAK' || info.equipLoc === 'INVTYPE_NECK') return true;
		if (info.equipLoc === 'INVTYPE_FINGER') return true;
		return isArmorCandidateAllowedForClass(classToken, info.itemClass, info.itemSubclass);
	}

	if (
		info.itemClass === ITEM_CLASS_WEAPON ||
		info.equipLoc?.includes('WEAPON') ||
		info.equipLoc === 'INVTYPE_RANGED' ||
		info.equipLoc === 'INVTYPE_RANGEDRIGHT'
	) {
		const equipLoc = info.equipLoc;
		if (is2HEquipLoc(equipLoc)) {
			if (!loadout.twoHanded) return false;
			if (isTitansGripSpec(profileKey)) {
				return isItemAllowedForMainHand(classToken, info.itemClass, info.itemSubclass, equipLoc);
			}
			return isItemAllowedForMainHand(classToken, info.itemClass, info.itemSubclass, equipLoc);
		}
		if (isRangedEquipLoc(equipLoc)) {
			return isItemAllowedForMainHand(classToken, info.itemClass, info.itemSubclass, equipLoc);
		}
		if (!isMainHandEquipLocAllowed(equipLoc, profileKey)) return false;
		if (
			isItemAllowedForMainHand(classToken, info.itemClass, info.itemSubclass, equipLoc) ||
			(loadout.dualWield &&
				isItemAllowedForOffHand(
					classToken,
					profileKey,
					info.itemClass,
					info.itemSubclass,
					equipLoc
				))
		) {
			return true;
		}
		return false;
	}

	return true;
}
