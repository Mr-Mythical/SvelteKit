/** Equipment slot helpers shared by bags/vault search (mirrors addon Core.lua / Predict.lua). */

export const BAG_SCAN_SLOT_ORDER = [16, 17, 1, 2, 3, 15, 5, 9, 10, 6, 7, 8, 11, 12] as const;

export const BAG_NONWEAPON_SLOT_ORDER = [1, 2, 3, 15, 5, 9, 10, 6, 7, 8, 11, 12] as const;

export const SLOT_ID_LABELS: Record<number, string> = {
	1: 'Head',
	2: 'Neck',
	3: 'Shoulder',
	5: 'Chest',
	6: 'Waist',
	7: 'Legs',
	8: 'Feet',
	9: 'Wrist',
	10: 'Hands',
	11: 'Ring 1',
	12: 'Ring 2',
	13: 'Trinket 1',
	14: 'Trinket 2',
	15: 'Back',
	16: 'Main Hand',
	17: 'Off Hand'
};

export const INVTYPE_TO_SLOT_IDS: Record<string, number[]> = {
	INVTYPE_HEAD: [1],
	INVTYPE_NECK: [2],
	INVTYPE_SHOULDER: [3],
	INVTYPE_CLOAK: [15],
	INVTYPE_CHEST: [5],
	INVTYPE_ROBE: [5],
	INVTYPE_WRIST: [9],
	INVTYPE_HAND: [10],
	INVTYPE_WAIST: [6],
	INVTYPE_LEGS: [7],
	INVTYPE_FEET: [8],
	INVTYPE_FINGER: [11, 12],
	INVTYPE_TRINKET: [13, 14],
	INVTYPE_WEAPON: [16, 17],
	INVTYPE_2HWEAPON: [16],
	INVTYPE_WEAPONMAINHAND: [16],
	INVTYPE_WEAPONOFFHAND: [17],
	INVTYPE_HOLDABLE: [17],
	INVTYPE_SHIELD: [17],
	INVTYPE_RANGED: [16],
	INVTYPE_RANGEDRIGHT: [16]
};

const MULTI_WORD_CLASSES = ['Death_Knight', 'Demon_Hunter'] as const;

/**
 * Multi-token base specs (after class). Longer than one token so
 * `Hunter_Beast_Mastery` does not collapse to `Hunter_Beast`.
 */
const MULTI_TOKEN_SPECS = ['Beast_Mastery', 'Survival_PL_DW'] as const;

export type WeaponLoadout = {
	twoHanded: boolean;
	/** May use slot 17 (1H weapon, shield, holdable, or Titan's Grip 2H). */
	dualWield: boolean;
};

/**
 * Spec weapon loadouts from addon Predict.lua SPEC_WEAPON_LOADOUTS.
 * twoHanded + !dualWield ⇒ practically 2H (or ranged) only — 1H MH alone is rejected.
 */
const SPEC_WEAPON_LOADOUTS: Record<string, WeaponLoadout> = {
	Death_Knight_Blood: { twoHanded: true, dualWield: false },
	Death_Knight_Frost: { twoHanded: true, dualWield: true },
	Death_Knight_Unholy: { twoHanded: true, dualWield: false },
	Demon_Hunter_Havoc: { twoHanded: false, dualWield: true },
	Demon_Hunter_Vengeance: { twoHanded: false, dualWield: true },
	Demon_Hunter_Devourer: { twoHanded: false, dualWield: true },
	Druid_Balance: { twoHanded: true, dualWield: true },
	Druid_Feral: { twoHanded: true, dualWield: false },
	Druid_Guardian: { twoHanded: true, dualWield: false },
	Druid_Restoration: { twoHanded: true, dualWield: true },
	Evoker_Devastation: { twoHanded: true, dualWield: true },
	Evoker_Preservation: { twoHanded: true, dualWield: true },
	Evoker_Augmentation: { twoHanded: true, dualWield: true },
	Hunter_Beast_Mastery: { twoHanded: true, dualWield: false },
	Hunter_Marksmanship: { twoHanded: true, dualWield: false },
	Hunter_Survival: { twoHanded: true, dualWield: true },
	Hunter_Survival_PL_DW: { twoHanded: true, dualWield: true },
	Mage_Arcane: { twoHanded: true, dualWield: true },
	Mage_Fire: { twoHanded: true, dualWield: true },
	Mage_Frost: { twoHanded: true, dualWield: true },
	Monk_Brewmaster: { twoHanded: true, dualWield: true },
	Monk_Mistweaver: { twoHanded: true, dualWield: true },
	Monk_Windwalker: { twoHanded: true, dualWield: true },
	Paladin_Holy: { twoHanded: false, dualWield: true },
	Paladin_Protection: { twoHanded: false, dualWield: true },
	Paladin_Retribution: { twoHanded: true, dualWield: false },
	Priest_Discipline: { twoHanded: true, dualWield: true },
	Priest_Holy: { twoHanded: true, dualWield: true },
	Priest_Shadow: { twoHanded: true, dualWield: true },
	Rogue_Assassination: { twoHanded: false, dualWield: true },
	Rogue_Outlaw: { twoHanded: false, dualWield: true },
	Rogue_Subtlety: { twoHanded: false, dualWield: true },
	Shaman_Elemental: { twoHanded: true, dualWield: true },
	Shaman_Enhancement: { twoHanded: false, dualWield: true },
	Shaman_Restoration: { twoHanded: true, dualWield: true },
	Warlock_Affliction: { twoHanded: true, dualWield: true },
	Warlock_Demonology: { twoHanded: true, dualWield: true },
	Warlock_Destruction: { twoHanded: true, dualWield: true },
	Warrior_Arms: { twoHanded: true, dualWield: false },
	/** Titan's Grip: dual 2H only (no SMF 1H in Midnight). */
	Warrior_Fury: { twoHanded: true, dualWield: true },
	Warrior_Protection: { twoHanded: false, dualWield: true }
};

/** Specs that may equip INVTYPE_2HWEAPON in the off-hand (Titan's Grip). */
const SPEC_TWO_HANDED_OFFHAND = new Set(['Warrior_Fury']);

export type ClassSpecParts = {
	classPart: string;
	specPart: string;
	/** UnitClass-style token: MAGE, DEATHKNIGHT, … */
	classToken: string;
	/** Death_Knight_Frost / Hunter_Beast_Mastery */
	specBody: string;
};

function matchMultiTokenSpec(restTokens: string[]): string | null {
	const joined = restTokens.join('_');
	for (const multi of MULTI_TOKEN_SPECS) {
		if (joined === multi || joined.startsWith(multi + '_')) {
			return multi;
		}
	}
	return null;
}

/** Parse MID1_* profile keys into class / base-spec parts (hero talent stripped). */
export function resolveClassSpecParts(profileKey: string): ClassSpecParts | null {
	if (!profileKey) return null;
	let rest = profileKey.replace(/^MID\d+_/, '');
	let classPart = '';
	for (const multi of MULTI_WORD_CLASSES) {
		if (rest === multi || rest.startsWith(multi + '_')) {
			classPart = multi;
			rest = rest.slice(multi.length).replace(/^_/, '');
			break;
		}
	}
	if (!classPart) {
		const first = rest.split('_')[0] ?? '';
		if (!first) return null;
		classPart = first;
		rest = rest.slice(first.length).replace(/^_/, '');
	}

	const restTokens = rest.split('_').filter(Boolean);
	if (restTokens.length === 0) return null;

	const multiSpec = matchMultiTokenSpec(restTokens);
	const specPart = multiSpec ?? restTokens[0]!;

	return {
		classPart,
		specPart,
		classToken: classPart.replace(/_/g, '').toUpperCase(),
		specBody: `${classPart}_${specPart}`
	};
}

export function getWeaponLoadoutForSpec(profileKey: string): WeaponLoadout {
	const parsed = resolveClassSpecParts(profileKey);
	if (!parsed) return { twoHanded: true, dualWield: true };
	return SPEC_WEAPON_LOADOUTS[parsed.specBody] ?? { twoHanded: true, dualWield: true };
}

/** Fury Titan's Grip — 2H may occupy slot 17. */
export function isTitansGripSpec(profileKey: string): boolean {
	const parsed = resolveClassSpecParts(profileKey);
	return parsed ? SPEC_TWO_HANDED_OFFHAND.has(parsed.specBody) : false;
}

/**
 * Specs that never use 1H as a real loadout (1H may be equippable in MH in-game
 * but BiS is always 2H / ranged / dual-2H).
 */
export function rejectsOneHandedWeapons(profileKey: string): boolean {
	if (isTitansGripSpec(profileKey)) return true;
	const loadout = getWeaponLoadoutForSpec(profileKey);
	return loadout.twoHanded && !loadout.dualWield;
}

export function is2HEquipLoc(equipLoc?: string | null): boolean {
	return equipLoc === 'INVTYPE_2HWEAPON';
}

export function isRangedEquipLoc(equipLoc?: string | null): boolean {
	return equipLoc === 'INVTYPE_RANGED' || equipLoc === 'INVTYPE_RANGEDRIGHT';
}

export function isTrinketEquipLoc(equipLoc?: string | null): boolean {
	return equipLoc === 'INVTYPE_TRINKET';
}

export function slotsForEquipLoc(equipLoc?: string | null): number[] {
	if (!equipLoc) return [];
	return INVTYPE_TO_SLOT_IDS[equipLoc] ?? [];
}
