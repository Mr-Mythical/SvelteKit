/**
 * Parse / validate addon Gearing Dashboard export JSON (schema v1).
 */

import { emptyStats, STAT_NAMES, type CombatStats } from './model';
import {
	EXPORT_SCHEMA_VERSION,
	emptyCharacterState,
	type AddonExportV1,
	type CharacterState,
	type GearPiece,
	type GearSource
} from './types';

export type ExportParseResult = {
	ok: boolean;
	state: CharacterState | null;
	warnings: string[];
	error?: string;
};

function asNumber(v: unknown, fallback = 0): number {
	const n = typeof v === 'number' ? v : Number(v);
	return Number.isFinite(n) ? n : fallback;
}

function parseStats(raw: unknown): CombatStats {
	const out = emptyStats();
	if (!raw || typeof raw !== 'object') return out;
	const obj = raw as Record<string, unknown>;
	for (const name of STAT_NAMES) {
		out[name] = Math.max(0, asNumber(obj[name], 0));
	}
	return out;
}

function parseSource(raw: unknown): GearSource {
	if (raw === 'equipped' || raw === 'bag' || raw === 'vault') return raw;
	return 'bag';
}

function parsePiece(raw: unknown, index: number, fallbackSource: GearSource): GearPiece | null {
	if (!raw || typeof raw !== 'object') return null;
	const obj = raw as Record<string, unknown>;
	const link = typeof obj.link === 'string' ? obj.link : '';
	const itemId = asNumber(obj.itemId ?? obj.item_id, 0);
	if (!link && !itemId) return null;

	const key =
		typeof obj.key === 'string' && obj.key
			? obj.key
			: link
				? `link:${link}`
				: `${fallbackSource}:${itemId}:${index}`;

	const piece: GearPiece = {
		key,
		link: link || `item:${itemId}`,
		itemId,
		source: parseSource(obj.source) || fallbackSource,
		stats: parseStats(obj.stats)
	};

	if (typeof obj.name === 'string') piece.name = obj.name;
	if (obj.slotId != null || obj.slot_id != null) piece.slotId = asNumber(obj.slotId ?? obj.slot_id);
	if (typeof obj.equipLoc === 'string') piece.equipLoc = obj.equipLoc;
	else if (typeof obj.equip_loc === 'string') piece.equipLoc = obj.equip_loc;
	if (obj.ilvl != null) piece.ilvl = asNumber(obj.ilvl);
	if (obj.quality != null) piece.quality = asNumber(obj.quality);
	if (typeof obj.sourceLabel === 'string') piece.sourceLabel = obj.sourceLabel;
	else if (typeof obj.source_label === 'string') piece.sourceLabel = obj.source_label;
	if (obj.vaultActivityId != null || obj.vault_activity_id != null) {
		piece.vaultActivityId = (obj.vaultActivityId ?? obj.vault_activity_id) as number | string;
	}
	if (typeof obj.isEmbellished === 'boolean') piece.isEmbellished = obj.isEmbellished;
	else if (typeof obj.is_embellished === 'boolean') piece.isEmbellished = obj.is_embellished;
	if (typeof obj.isTierPiece === 'boolean') piece.isTierPiece = obj.isTierPiece;
	else if (typeof obj.is_tier_piece === 'boolean') piece.isTierPiece = obj.is_tier_piece;
	if (obj.tierMatchKey != null || obj.tier_match_key != null) {
		const k = obj.tierMatchKey ?? obj.tier_match_key;
		piece.tierMatchKey = k == null ? null : String(k);
	}
	if (obj.bag != null) piece.bag = asNumber(obj.bag);
	if (obj.slot != null) piece.slot = asNumber(obj.slot);
	if (typeof obj.guid === 'string') piece.guid = obj.guid;

	return piece;
}

function parsePieceList(raw: unknown, fallbackSource: GearSource, warnings: string[]): GearPiece[] {
	if (!Array.isArray(raw)) return [];
	const out: GearPiece[] = [];
	for (let i = 0; i < raw.length; i++) {
		const piece = parsePiece(raw[i], i, fallbackSource);
		if (piece) out.push(piece);
		else warnings.push(`Skipped invalid ${fallbackSource} entry at index ${i}.`);
	}
	return out;
}

/** Accepts a JSON string or already-parsed object. */
export function parseAddonExport(
	input: string | unknown,
	opts?: { preferProfileKey?: string }
): ExportParseResult {
	const warnings: string[] = [];
	let raw: unknown = input;

	if (typeof input === 'string') {
		const trimmed = input.trim();
		if (!trimmed) {
			return { ok: false, state: null, warnings, error: 'Paste is empty.' };
		}
		try {
			raw = JSON.parse(trimmed);
		} catch {
			return {
				ok: false,
				state: null,
				warnings,
				error: 'Could not parse JSON. Copy again with /mrdps export in-game.'
			};
		}
	}

	if (!raw || typeof raw !== 'object') {
		return { ok: false, state: null, warnings, error: 'Export root must be a JSON object.' };
	}

	const obj = raw as Record<string, unknown>;
	const schemaVersion = asNumber(obj.schemaVersion ?? obj.schema_version, 0);
	if (schemaVersion !== EXPORT_SCHEMA_VERSION) {
		if (schemaVersion === 0) {
			warnings.push('Missing schemaVersion — treating as v1 best-effort.');
		} else {
			return {
				ok: false,
				state: null,
				warnings,
				error: `Unsupported export schemaVersion ${schemaVersion} (expected ${EXPORT_SCHEMA_VERSION}).`
			};
		}
	}

	const profileKey =
		(typeof obj.profileKey === 'string' && obj.profileKey) ||
		(typeof obj.profile_key === 'string' && obj.profile_key) ||
		opts?.preferProfileKey ||
		'';

	if (!profileKey) {
		warnings.push('No profileKey in export — pick a spec profile manually.');
	}

	const stats = parseStats(obj.stats);
	const equipped = parsePieceList(obj.equipped, 'equipped', warnings);
	const bags = parsePieceList(obj.bags, 'bag', warnings);
	const vault = parsePieceList(obj.vault, 'vault', warnings);

	if (equipped.length === 0 && bags.length === 0 && vault.length === 0) {
		warnings.push('Export has no equipped, bag, or vault items.');
	}

	const character =
		obj.character && typeof obj.character === 'object'
			? (obj.character as AddonExportV1['character'])
			: undefined;

	const notes =
		obj.notes && typeof obj.notes === 'object'
			? (obj.notes as { vaultNote?: string | null })
			: undefined;

	const state: CharacterState = {
		...emptyCharacterState(profileKey),
		profileKey,
		stats,
		equipped,
		bags,
		vault,
		identity: character,
		exportMeta: {
			schemaVersion: schemaVersion || EXPORT_SCHEMA_VERSION,
			exportedAt: typeof obj.exportedAt === 'string' ? obj.exportedAt : undefined,
			addonVersion: typeof obj.addonVersion === 'string' ? obj.addonVersion : undefined,
			vaultNote: notes?.vaultNote ?? null
		}
	};

	return { ok: true, state, warnings };
}

/** Apply export into Compare form fields (stats + profile). */
export function applyExportToCompareFields(state: CharacterState): {
	stats: CombatStats;
	profileKey: string;
} {
	return {
		stats: { ...state.stats },
		profileKey: state.profileKey
	};
}
