/**
 * Best-effort SimC profile paste parser.
 * Rating lines are authoritative; gear lines can be resolved via Item DB when provided.
 */

import { emptyStats, type CombatStats, type StatName, STAT_NAMES } from './model';
import { matchSpecKey } from './specs';
import { resolveItemStats, sumResolvedStats, type ItemDbJson, type ResolvedItem } from './itemDb';
import type { GearPiece } from './types';

export type SimcGearLine = {
	slot: string;
	itemId: number;
	bonusIds: number[];
};

export type SimcParseResult = {
	stats: Partial<CombatStats>;
	statsFound: StatName[];
	classToken?: string;
	specToken?: string;
	heroToken?: string;
	matchedSpecKey: string | null;
	warnings: string[];
	hasItemLines: boolean;
	gearLines: SimcGearLine[];
};

/** SimC profile slot token → inventory slot id. */
export const SIMC_SLOT_TO_ID: Record<string, number> = {
	head: 1,
	neck: 2,
	shoulder: 3,
	back: 15,
	chest: 5,
	wrist: 9,
	hands: 10,
	waist: 6,
	legs: 7,
	feet: 8,
	finger1: 11,
	finger2: 12,
	trinket1: 13,
	trinket2: 14,
	main_hand: 16,
	off_hand: 17
};

const CLASS_LINE =
	/^\s*(deathknight|demonhunter|druid|evoker|hunter|mage|monk|paladin|priest|rogue|shaman|warlock|warrior)\s*=/i;

const GEAR_SLOT_RE =
	/^\s*(head|neck|shoulder|back|chest|wrist|hands|waist|legs|feet|finger1|finger2|trinket1|trinket2|main_hand|off_hand)\s*=\s*(.*)$/i;

const RATING_PATTERNS: { name: StatName; re: RegExp }[] = [
	{ name: 'crit', re: /(?:^|\n)\s*#?\s*(?:gear_)?crit(?:_rating)?\s*[:=]\s*([\d.]+)/i },
	{ name: 'haste', re: /(?:^|\n)\s*#?\s*(?:gear_)?haste(?:_rating)?\s*[:=]\s*([\d.]+)/i },
	{ name: 'mastery', re: /(?:^|\n)\s*#?\s*(?:gear_)?mastery(?:_rating)?\s*[:=]\s*([\d.]+)/i },
	{
		name: 'versatility',
		re: /(?:^|\n)\s*#?\s*(?:gear_)?vers(?:atility)?(?:_rating)?\s*[:=]\s*([\d.]+)/i
	},
	{
		name: 'primary_stat',
		re: /(?:^|\n)\s*#?\s*(?:gear_)?(?:primary|strength|agility|intellect)(?:_stat|_rating)?\s*[:=]\s*([\d.]+)/i
	}
];

function parseGearLine(slot: string, value: string): SimcGearLine | null {
	const idMatch = value.match(/(?:^|,)\s*id\s*=\s*(\d+)/i) || value.match(/^\s*(\d+)\s*(?:,|$)/);
	if (!idMatch?.[1]) return null;
	const itemId = Number(idMatch[1]);
	const bonusIds: number[] = [];
	const bonusMatch = value.match(/bonus_id\s*=\s*([0-9/]+)/i);
	if (bonusMatch?.[1]) {
		for (const part of bonusMatch[1].split('/')) {
			const n = Number(part);
			if (Number.isFinite(n) && n > 0) bonusIds.push(n);
		}
	}
	return { slot: slot.toLowerCase(), itemId, bonusIds };
}

export function parseSimcPaste(text: string, specKeys: string[]): SimcParseResult {
	const warnings: string[] = [];
	const stats: Partial<CombatStats> = {};
	const statsFound: StatName[] = [];
	const gearLines: SimcGearLine[] = [];

	let classToken: string | undefined;
	let specToken: string | undefined;
	let heroToken: string | undefined;

	const classMatch = text.match(CLASS_LINE);
	if (classMatch?.[1]) {
		classToken = classMatch[1].toLowerCase();
	}

	const specMatch = text.match(/(?:^|\n)\s*spec\s*=\s*([a-z0-9_]+)/i);
	if (specMatch?.[1]) {
		specToken = specMatch[1].toLowerCase();
	}

	const heroMatch = text.match(/(?:^|\n)\s*(?:hero_talent|hero)\s*=\s*([a-z0-9_]+)/i);
	if (heroMatch?.[1]) {
		heroToken = heroMatch[1].toLowerCase();
	}

	// Header comment: `# Mage "Name" - Frost - ...`
	const header = text.match(
		/#\s*(Death\s*Knight|Demon\s*Hunter|Druid|Evoker|Hunter|Mage|Monk|Paladin|Priest|Rogue|Shaman|Warlock|Warrior)\b[^\n]*?-\s*([A-Za-z][A-Za-z\s']+)/i
	);
	if (header) {
		if (!classToken) classToken = header[1]!.replace(/\s+/g, '').toLowerCase();
		if (!specToken) specToken = header[2]!.trim().split(/\s+/)[0]!.toLowerCase();
	}

	for (const line of text.split(/\r?\n/)) {
		const gm = line.match(GEAR_SLOT_RE);
		if (!gm) continue;
		const parsed = parseGearLine(gm[1]!, gm[2] ?? '');
		if (parsed) gearLines.push(parsed);
	}

	for (const { name, re } of RATING_PATTERNS) {
		const m = text.match(re);
		if (m?.[1]) {
			const n = Number(m[1]);
			if (Number.isFinite(n)) {
				stats[name] = n;
				statsFound.push(name);
			}
		}
	}

	// Explicit dashboard keys (also useful for manual paste).
	for (const name of STAT_NAMES) {
		const re = new RegExp(`(?:^|\\n)\\s*${name}\\s*[:=]\\s*([\\d.]+)`, 'i');
		const m = text.match(re);
		if (m?.[1] && stats[name] == null) {
			const n = Number(m[1]);
			if (Number.isFinite(n)) {
				stats[name] = n;
				statsFound.push(name);
			}
		}
	}

	const hasItemLines = gearLines.length > 0;
	if (hasItemLines && statsFound.length < 5) {
		warnings.push(
			'SimC gear lines were found. Item→stats resolution from gear lines is best-effort — prefer Armory load or paste rating lines (crit=, haste=, …).'
		);
	}

	const matchedSpecKey = matchSpecKey(specKeys, { classToken, specToken, heroToken });
	if ((classToken || specToken) && !matchedSpecKey) {
		warnings.push(
			'Could not match a trained spec profile from the SimC paste — pick one manually.'
		);
	}

	if (statsFound.length === 0 && !hasItemLines) {
		warnings.push('No combat ratings found in the paste. Fill the current-stats form below.');
	}

	return {
		stats,
		statsFound,
		classToken,
		specToken,
		heroToken,
		matchedSpecKey,
		warnings,
		hasItemLines,
		gearLines
	};
}

/** Resolve SimC gear lines through the Item DB (skips trinkets). */
export function resolveSimcGearLines(
	db: ItemDbJson,
	gearLines: SimcGearLine[]
): { resolved: ResolvedItem[]; stats: CombatStats; missingIds: number[] } {
	const resolved: ResolvedItem[] = [];
	const missingIds: number[] = [];
	for (const line of gearLines) {
		if (line.slot.startsWith('trinket')) continue;
		const r = resolveItemStats(db, line.itemId, { bonusIds: line.bonusIds });
		if (r.missing) missingIds.push(line.itemId);
		resolved.push(r);
	}
	return { resolved, stats: sumResolvedStats(resolved, true), missingIds };
}

/** Resolve SimC gear lines into equipped GearPieces with slotIds (for scoring / search). */
export function resolveSimcEquippedPieces(db: ItemDbJson, gearLines: SimcGearLine[]): GearPiece[] {
	const out: GearPiece[] = [];
	for (const line of gearLines) {
		const slotId = SIMC_SLOT_TO_ID[line.slot];
		if (slotId == null) continue;
		const r = resolveItemStats(db, line.itemId, { bonusIds: line.bonusIds });
		if (r.missing) continue;
		out.push({
			key: `simc:${slotId}:${r.itemId}`,
			link: r.bonusIds.length > 0 ? `item:${r.itemId}:${r.bonusIds.join(',')}` : `item:${r.itemId}`,
			itemId: r.itemId,
			name: r.name,
			slotId,
			equipLoc: r.equipLoc || r.slot || undefined,
			ilvl: r.itemLevel,
			quality: r.quality,
			source: 'equipped',
			stats: r.stats
		});
	}
	return out;
}

export function mergeParsedStats(current: CombatStats, parsed: Partial<CombatStats>): CombatStats {
	const next = emptyStats();
	for (const name of STAT_NAMES) {
		next[name] = parsed[name] != null ? Number(parsed[name]) : current[name];
	}
	return next;
}
