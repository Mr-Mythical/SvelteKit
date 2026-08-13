/**
 * Shared character / gear types for the Gearing Dashboard.
 * Addon export schema v1 is the high-fidelity bags + vault ingest path.
 */

import { emptyStats, type CombatStats } from './model';

export const EXPORT_SCHEMA_VERSION = 1 as const;

export type GearSource = 'equipped' | 'bag' | 'vault';

/** One scorable gear piece with ratings embedded (no Item DB required). */
export type GearPiece = {
	key: string;
	link: string;
	itemId: number;
	name?: string;
	/** Inventory slot when equipped (1–17). */
	slotId?: number;
	equipLoc?: string;
	ilvl?: number;
	quality?: number;
	source: GearSource;
	sourceLabel?: string;
	/** Season journal instance name when sourced from season-loot. */
	instanceName?: string;
	/** Season journal instance kind (`Raid` / `Dungeon`) when known. */
	instanceKind?: string;
	/** Season journal encounter / boss name when known. */
	encounterName?: string;
	vaultActivityId?: number | string;
	stats: CombatStats;
	isEmbellished?: boolean;
	isTierPiece?: boolean;
	tierMatchKey?: string | null;
	bag?: number;
	slot?: number;
	guid?: string;
	/** From Item DB — used for class/armor/weapon filters. */
	itemClass?: number;
	itemSubclass?: number;
	/** Str/Agi/Int allocations (hybrid mods expanded) for primary-stat filter. */
	primaryStats?: {
		strength: number;
		agility: number;
		intellect: number;
	};
};

export type CharacterIdentity = {
	name?: string;
	realm?: string;
	classToken?: string;
	specId?: number;
};

/**
 * Internal character state used by Compare / Bags / Vault.
 * Populated from addon export (authoritative for bags/vault), SimC paste, or Armory later.
 */
export type CharacterState = {
	profileKey: string;
	stats: CombatStats;
	equipped: GearPiece[];
	bags: GearPiece[];
	vault: GearPiece[];
	identity?: CharacterIdentity;
	exportMeta?: {
		schemaVersion: number;
		exportedAt?: string;
		addonVersion?: string;
		vaultNote?: string | null;
	};
};

/** Versioned JSON copied from `/mrdps export` in the addon. */
export type AddonExportV1 = {
	schemaVersion: typeof EXPORT_SCHEMA_VERSION;
	exportedAt: string;
	addonVersion?: string;
	profileKey: string;
	character?: CharacterIdentity;
	stats: CombatStats;
	equipped: GearPiece[];
	bags: GearPiece[];
	vault: GearPiece[];
	notes?: {
		vaultNote?: string | null;
	};
};

export function emptyCharacterState(profileKey = ''): CharacterState {
	return {
		profileKey,
		stats: emptyStats(),
		equipped: [],
		bags: [],
		vault: []
	};
}

export function hasBagExport(state: CharacterState | null | undefined): boolean {
	return (state?.bags?.length ?? 0) > 0 || (state?.exportMeta?.schemaVersion ?? 0) >= 1;
}

export function hasVaultExport(state: CharacterState | null | undefined): boolean {
	return (state?.vault?.length ?? 0) > 0;
}
