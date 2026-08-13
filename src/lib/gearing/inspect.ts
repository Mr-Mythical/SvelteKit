/**
 * Normalize gear shapes into a single inspect view for the Gearing Dashboard.
 */

import { slotLabel as equipLocLabel, type CrestUpgradeStep } from './crests';
import { resolveItemStats, type ItemDbEntry, type ItemDbJson, type ResolvedItem } from './itemDb';
import { emptyStats, STAT_NAMES, type CombatStats, type StatName } from './model';
import { SLOT_ID_LABELS } from './slots';
import { getTierPieceInfo } from './tier';
import type { GearPiece } from './types';
import { bonusIdsFromLink } from './wowhead';

export type InspectableGear = {
	key: string;
	itemId: number;
	name: string;
	link: string;
	ilvl?: number;
	quality?: number;
	equipLoc?: string;
	slotLabel?: string;
	sourceLabel?: string;
	stats: CombatStats;
	bonusIds: number[];
	isTierPiece?: boolean;
	tierMatchKey?: string | null;
	isEmbellished?: boolean;
	note?: string;
};

const STAT_LABELS: Record<StatName, string> = {
	primary_stat: 'Primary',
	crit: 'Crit',
	haste: 'Haste',
	mastery: 'Mastery',
	versatility: 'Versatility'
};

export function inspectStatLabels(): Record<StatName, string> {
	return STAT_LABELS;
}

export function inspectStatEntries(
	stats: CombatStats
): { name: StatName; label: string; value: number }[] {
	return STAT_NAMES.map((name) => ({
		name,
		label: STAT_LABELS[name],
		value: Math.round(stats[name] ?? 0)
	})).filter((e) => e.value !== 0);
}

export function inspectFromPiece(
	piece: GearPiece | null | undefined,
	opts?: { slotLabel?: string }
): InspectableGear | null {
	if (!piece?.itemId) return null;
	const bonusIds = bonusIdsFromLink(piece.link);
	const label =
		opts?.slotLabel ||
		(piece.slotId != null ? SLOT_ID_LABELS[piece.slotId] : undefined) ||
		piece.equipLoc;
	return {
		key: piece.key || `item:${piece.itemId}`,
		itemId: piece.itemId,
		name: piece.name || `Item ${piece.itemId}`,
		link: piece.link || `item:${piece.itemId}`,
		ilvl: piece.ilvl,
		quality: piece.quality,
		equipLoc: piece.equipLoc,
		slotLabel: label,
		sourceLabel: piece.sourceLabel || piece.source,
		stats: piece.stats ?? emptyStats(),
		bonusIds,
		isTierPiece: piece.isTierPiece,
		tierMatchKey: piece.tierMatchKey,
		isEmbellished: piece.isEmbellished
	};
}

export function inspectFromResolved(item: ResolvedItem | null | undefined): InspectableGear | null {
	if (!item || item.missing || !item.itemId) return null;
	const link =
		item.bonusIds.length > 0
			? `item:${item.itemId}:${item.bonusIds.join(',')}`
			: `item:${item.itemId}`;
	return {
		key: `resolved:${item.itemId}:${item.bonusIds.join(',')}`,
		itemId: item.itemId,
		name: item.name || `Item ${item.itemId}`,
		link,
		ilvl: item.itemLevel,
		quality: item.quality,
		equipLoc: item.equipLoc || item.slot,
		slotLabel: item.equipLoc || item.slot,
		sourceLabel: 'Resolved',
		stats: item.stats,
		bonusIds: [...item.bonusIds]
	};
}

/** Crest plan step — inspect the upgraded form (target ilvl + bonus). */
export function inspectFromCrestStep(step: CrestUpgradeStep): InspectableGear {
	return {
		key: `crest:${step.itemId}:${step.toBonusId}`,
		itemId: step.itemId,
		name: step.name,
		link: `item:${step.itemId}:${step.toBonusId}`,
		ilvl: step.toLevel,
		equipLoc: step.equipLoc,
		slotLabel: step.equipLoc,
		sourceLabel: `Crest upgrade ${step.fromLevel}→${step.toLevel}`,
		stats: step.upgradedStats,
		bonusIds: [step.toBonusId],
		note: `From bonus ${step.fromBonusId} · ${formatCrestCost(step)}`
	};
}

/**
 * Resolve an Item DB entry at a target ilvl / bonus list for on-site catalog inspect.
 */
export function inspectFromItemDb(
	db: ItemDbJson,
	itemId: number,
	opts?: {
		itemLevel?: number;
		bonusIds?: number[];
		sourceLabel?: string;
		instanceName?: string;
		/** Used when the item is in season-loot but not yet in item-db. */
		fallback?: Pick<ItemDbEntry, 'name' | 'equipLoc' | 'quality'>;
	}
): InspectableGear | null {
	const entry = db.items[String(itemId)];
	const fallback = opts?.fallback;
	if (!entry && !fallback) return null;
	const bonusIds = opts?.bonusIds ?? [];
	const resolved = resolveItemStats(db, itemId, {
		itemLevel: opts?.itemLevel,
		bonusIds
	});
	const tier = getTierPieceInfo(itemId);
	const link = bonusIds.length > 0 ? `item:${itemId}:${bonusIds.join(',')}` : `item:${itemId}`;
	const sourceLabel = opts?.sourceLabel || opts?.instanceName || 'Item DB';
	const name = entry?.name || fallback?.name || resolved.name || `Item ${itemId}`;
	const equipLoc = entry?.equipLoc || fallback?.equipLoc || '';
	const quality = entry?.quality ?? fallback?.quality;
	const ilvl = opts?.itemLevel ?? resolved.itemLevel ?? entry?.level ?? 0;
	return {
		key: `db:${itemId}:${ilvl}:${bonusIds.join(',')}`,
		itemId,
		name,
		link,
		ilvl: ilvl || undefined,
		quality,
		equipLoc: equipLoc || undefined,
		slotLabel: equipLoc ? equipLocLabel(equipLoc) : undefined,
		sourceLabel,
		stats: resolved.stats,
		bonusIds,
		isTierPiece: Boolean(tier),
		tierMatchKey: tier?.matchKey ?? null,
		note: entry
			? `Base ilvl ${entry.level} · class ${entry.itemClass}/${entry.itemSubclass}`
			: 'Listed in season Journal loot; missing from Item DB (stats unresolved).'
	};
}

export type ItemDbSearchHit = {
	itemId: number;
	entry: ItemDbEntry;
	/** From season-loot join when available. */
	instanceName?: string;
	instanceKind?: string;
	sourceLabel?: string;
};

export type SeasonInstanceRef = {
	instanceName: string;
	instanceKind: string;
	itemCount: number;
};

/** Unique instances from season loot, sorted Dungeon then Raid then name. */
export function listSeasonInstances(loot: {
	items: {
		instanceName?: string;
		instanceKind?: string;
		itemId?: number;
	}[];
}): SeasonInstanceRef[] {
	const map = new Map<string, SeasonInstanceRef>();
	for (const item of loot.items) {
		const name = (item.instanceName || '').trim();
		if (!name) continue;
		const kind = (item.instanceKind || 'Unknown').trim() || 'Unknown';
		const key = `${kind}::${name}`;
		const prev = map.get(key);
		if (prev) {
			prev.itemCount += 1;
		} else {
			map.set(key, { instanceName: name, instanceKind: kind, itemCount: 1 });
		}
	}
	return [...map.values()].sort((a, b) => {
		// Raids first so new 12.0.7 raids (Sporefall, etc.) are easy to find.
		const ak = a.instanceKind === 'Raid' ? 0 : 1;
		const bk = b.instanceKind === 'Raid' ? 0 : 1;
		if (ak !== bk) return ak - bk;
		return a.instanceName.localeCompare(b.instanceName);
	});
}

export type SeasonItemSource = {
	instanceName: string;
	instanceKind: string;
	sourceLabel: string;
	/** Present when season loot lists an item absent from Item DB. */
	catalogFallback?: Pick<ItemDbEntry, 'name' | 'equipLoc' | 'quality'>;
};

/** itemId → first season loot source row (for instance filter / labels). */
export function buildSeasonItemSourceIndex(loot: {
	items: {
		itemId: number;
		name?: string;
		equipLoc?: string;
		quality?: number;
		instanceName?: string;
		instanceKind?: string;
		sourceLabel?: string;
		encounterName?: string;
	}[];
}): Map<number, SeasonItemSource> {
	const map = new Map<number, SeasonItemSource>();
	for (const item of loot.items) {
		if (!item.itemId || map.has(item.itemId)) continue;
		const instanceName = (item.instanceName || '').trim();
		if (!instanceName) continue;
		const instanceKind = (item.instanceKind || 'Unknown').trim() || 'Unknown';
		const sourceLabel =
			item.sourceLabel ||
			(item.encounterName ? `${item.encounterName} — ${instanceName}` : instanceName);
		map.set(item.itemId, {
			instanceName,
			instanceKind,
			sourceLabel,
			catalogFallback: {
				name: item.name || `Item ${item.itemId}`,
				equipLoc: item.equipLoc || '',
				quality: item.quality ?? 4
			}
		});
	}
	return map;
}

/**
 * Search the published item catalog by name substring or exact/partial item id.
 * Optional season-loot index filters by instance and annotates drops.
 */
export function searchItemDb(
	db: ItemDbJson,
	query: string,
	opts?: {
		equipLoc?: string;
		limit?: number;
		instanceName?: string;
		seasonIndex?: Map<number, SeasonItemSource>;
	}
): ItemDbSearchHit[] {
	const q = query.trim().toLowerCase();
	const equipLoc = opts?.equipLoc || '';
	const instanceName = (opts?.instanceName || '').trim();
	const seasonIndex = opts?.seasonIndex;
	/** Instance-only (or instance+slot) browses return the full drop list — no UI cap. */
	const uncapped = Boolean(instanceName) && !q;
	const limit = opts?.limit ?? (uncapped ? Number.POSITIVE_INFINITY : 50);

	if (!q && !equipLoc && !instanceName) return [];

	const idQuery = /^\d+$/.test(q) ? q : '';
	const hits: ItemDbSearchHit[] = [];

	const candidateIds: number[] | null = instanceName
		? [...(seasonIndex?.entries() ?? [])]
				.filter(([, src]) => src.instanceName === instanceName)
				.map(([id]) => id)
		: null;

	const scanIds = candidateIds ?? Object.keys(db.items).map((id) => Number(id));

	for (const itemId of scanIds) {
		const src = seasonIndex?.get(itemId);
		const entry =
			db.items[String(itemId)] ??
			(src?.catalogFallback
				? {
						name: src.catalogFallback.name,
						quality: src.catalogFallback.quality,
						level: 0,
						inv: 0,
						equipLoc: src.catalogFallback.equipLoc,
						itemClass: 0,
						itemSubclass: 0,
						stats: []
					}
				: undefined);
		if (!entry) continue;
		// Skip non-gear / unresolved catalog stubs (empty equipLoc).
		if (!entry.equipLoc) continue;
		if (equipLoc && entry.equipLoc !== equipLoc) continue;
		if (q) {
			const nameHit = entry.name.toLowerCase().includes(q);
			const idHit = idQuery ? String(itemId).includes(idQuery) : false;
			if (!nameHit && !idHit) continue;
		}
		hits.push({
			itemId,
			entry,
			instanceName: src?.instanceName,
			instanceKind: src?.instanceKind,
			sourceLabel: src?.sourceLabel
		});
	}

	hits.sort((a, b) => {
		if (idQuery) {
			const aExact = a.itemId.toString() === idQuery;
			const bExact = b.itemId.toString() === idQuery;
			if (aExact !== bExact) return aExact ? -1 : 1;
		}
		if (q && !idQuery) {
			const aStarts = a.entry.name.toLowerCase().startsWith(q);
			const bStarts = b.entry.name.toLowerCase().startsWith(q);
			if (aStarts !== bStarts) return aStarts ? -1 : 1;
		}
		const levelDiff = (b.entry.level ?? 0) - (a.entry.level ?? 0);
		if (levelDiff) return levelDiff;
		return a.entry.name.localeCompare(b.entry.name);
	});
	return hits.slice(0, Number.isFinite(limit) ? limit : hits.length);
}

function formatCrestCost(step: CrestUpgradeStep): string {
	return `${step.crestCost} crests · ${step.dpsDelta >= 0 ? '+' : ''}${step.dpsDelta.toFixed(0)} DPS`;
}
