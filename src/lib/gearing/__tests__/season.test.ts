import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadItemDbFromJson, type ItemDbJson } from '../itemDb';
import { loadModelFromJson, type WebModelJson } from '../model';
import {
	candidateMatchesEquipped,
	collectEquippedDuplicateItemIds,
	estimateSeasonComboCount,
	filterSeasonPiecesByDeselection,
	filterSeasonPiecesByInstance,
	groupSeasonPiecesBySlot,
	loadSeasonLootFromJson,
	rankSeasonInstancesFromEstimates,
	rankSeasonSlotGroups,
	resolveSeasonCandidates,
	searchBestSeasonLoadout,
	searchBestSeasonLoadoutAsync,
	type SeasonLootJson
} from '../season';
import { loadTierSetsFromJson } from '../tier';
import type { CharacterState } from '../types';

const here = dirname(fileURLToPath(import.meta.url));
const staticDir = join(here, '../../../../static/gearing');

beforeAll(() => {
	const raw = JSON.parse(readFileSync(join(staticDir, 'tier-sets-v1.json'), 'utf8'));
	loadTierSetsFromJson(raw);
});

function loadModel() {
	const raw = JSON.parse(readFileSync(join(staticDir, 'model-v6.json'), 'utf8')) as WebModelJson;
	return loadModelFromJson(raw);
}

function loadDb() {
	const raw = JSON.parse(readFileSync(join(staticDir, 'item-db-v1.json'), 'utf8')) as ItemDbJson;
	return loadItemDbFromJson(raw);
}

function loadSeason() {
	const raw = JSON.parse(
		readFileSync(join(staticDir, 'season-loot-v1.json'), 'utf8')
	) as SeasonLootJson;
	return loadSeasonLootFromJson(raw);
}

function sampleState(profileKey: string): CharacterState {
	return {
		profileKey,
		stats: {
			primary_stat: 2000,
			crit: 800,
			haste: 700,
			mastery: 900,
			versatility: 500
		},
		equipped: [
			{
				key: 'eq:1',
				link: 'item:100',
				itemId: 100,
				name: 'Old Helm',
				slotId: 1,
				equipLoc: 'INVTYPE_HEAD',
				source: 'equipped',
				stats: { primary_stat: 100, crit: 20, haste: 20, mastery: 20, versatility: 20 }
			},
			{
				key: 'eq:16',
				link: 'item:116',
				itemId: 116,
				name: 'Staff',
				slotId: 16,
				equipLoc: 'INVTYPE_2HWEAPON',
				source: 'equipped',
				stats: { primary_stat: 300, crit: 40, haste: 40, mastery: 40, versatility: 40 }
			}
		],
		bags: [],
		vault: []
	};
}

describe('season loot snapshot', () => {
	it('loads published season-loot-v1 with Champion/Hero/Myth tracks', () => {
		const loot = loadSeason();
		expect(loot.version).toBe(1);
		expect(loot.itemCount).toBeGreaterThan(50);
		expect(loot.tracks.Champion?.ranks).toHaveLength(6);
		expect(loot.tracks.Myth?.ranks?.[5]?.bonusId).toBe(12854);
		expect(loot.items[0]?.tracks.Hero?.bonusIds?.length).toBeGreaterThan(0);
	});

	it('resolves candidates at Hero track via Item DB', () => {
		const db = loadDb();
		const loot = loadSeason();
		const { pieces, ilvl, rank } = resolveSeasonCandidates(db, loot, 'Hero', 6);
		expect(rank).toBe(6);
		expect(ilvl).toBe(321);
		expect(pieces.length).toBeGreaterThan(20);
		expect(pieces.every((p) => p.sourceLabel)).toBe(true);
		expect(pieces.every((p) => p.equipLoc !== 'INVTYPE_TRINKET')).toBe(true);
	});

	it('runs season loadout search without throwing', () => {
		const model = loadModel();
		const db = loadDb();
		const loot = loadSeason();
		const profileKey = model.specKeys.includes('MID1_Mage_Frost')
			? 'MID1_Mage_Frost'
			: model.specKeys[0]!;
		const result = searchBestSeasonLoadout(model, sampleState(profileKey), db, loot, 'Champion', {
			rank: 6,
			maxCombinations: 5_000
		});
		expect(result.candidateCount).toBeGreaterThan(0);
		expect(result.track).toBe('Champion');
		expect(result.combinationsChecked).toBeGreaterThan(0);
	});

	it('enforces a 4-piece class tier set in season BiS', () => {
		const model = loadModel();
		const db = loadDb();
		const loot = loadSeason();
		const profileKey = model.specKeys.includes('MID1_Mage_Fire')
			? 'MID1_Mage_Fire'
			: model.specKeys[0]!;
		const result = searchBestSeasonLoadout(model, sampleState(profileKey), db, loot, 'Hero', {
			rank: 6,
			maxCombinations: 50_000
		});
		const enforceWarning = result.warnings.find((w) => w.includes('4-piece tier set'));
		expect(enforceWarning).toBeTruthy();
		const targetKey = /\(([^)]+)\)/.exec(enforceWarning ?? '')?.[1];
		expect(targetKey).toBeTruthy();
		const tierSlots = [1, 3, 5, 7, 10];
		const targetCount = result.slotRows.filter(
			(row) => tierSlots.includes(row.slotId) && row.chosen?.tierMatchKey === targetKey
		).length;
		// Addon MIN_TIER_SET_PIECES = 4; one tier slot may stay off-set.
		expect(targetCount).toBeGreaterThanOrEqual(4);
	});

	it('async season search returns a result and source', async () => {
		const model = loadModel();
		const db = loadDb();
		const loot = loadSeason();
		const profileKey = model.specKeys.includes('MID1_Mage_Frost')
			? 'MID1_Mage_Frost'
			: model.specKeys[0]!;
		const outcome = await searchBestSeasonLoadoutAsync(
			model,
			sampleState(profileKey),
			db,
			loot,
			'Champion',
			{ rank: 6, maxCombinations: 5_000 }
		);
		expect(outcome.source === 'worker' || outcome.source === 'main').toBe(true);
		expect(outcome.workers).toBeGreaterThanOrEqual(1);
		expect(outcome.result.candidateCount).toBeGreaterThan(0);
		expect(outcome.result.track).toBe('Champion');
	});

	it('groups season pieces by equipment slot', () => {
		const model = loadModel();
		const db = loadDb();
		const loot = loadSeason();
		const profileKey = model.specKeys.includes('MID1_Mage_Frost')
			? 'MID1_Mage_Frost'
			: model.specKeys[0]!;
		const { pieces } = resolveSeasonCandidates(db, loot, 'Hero', 6, profileKey);
		const groups = groupSeasonPiecesBySlot(pieces, profileKey);
		expect(groups.length).toBeGreaterThan(5);
		expect(groups.every((g) => g.pieces.length > 0)).toBe(true);
		expect(groups.some((g) => g.slotLabel === 'Head')).toBe(true);
	});

	it('ranks season pieces by single-swap delta vs equipped', () => {
		const model = loadModel();
		const db = loadDb();
		const loot = loadSeason();
		const profileKey = model.specKeys.includes('MID1_Mage_Frost')
			? 'MID1_Mage_Frost'
			: model.specKeys[0]!;
		const { pieces } = resolveSeasonCandidates(db, loot, 'Hero', 6, profileKey);
		const state = sampleState(profileKey);
		const ranked = rankSeasonSlotGroups(model, state, pieces.slice(0, 40));
		expect(ranked.length).toBeGreaterThan(0);
		const withEstimates = ranked.flatMap((g) => g.pieces).filter((p) => p.estimateDelta != null);
		expect(withEstimates.length).toBeGreaterThan(0);
		for (const group of ranked) {
			const deltas = group.pieces.map((p) => p.estimateDelta).filter((d): d is number => d != null);
			for (let i = 1; i < deltas.length; i++) {
				expect(deltas[i]!).toBeLessThanOrEqual(deltas[i - 1]!);
			}
		}
	});

	it('attaches equipped gear to each ranked slot group', () => {
		const model = loadModel();
		const db = loadDb();
		const loot = loadSeason();
		const profileKey = model.specKeys.includes('MID1_Mage_Frost')
			? 'MID1_Mage_Frost'
			: model.specKeys[0]!;
		const { pieces } = resolveSeasonCandidates(db, loot, 'Hero', 6, profileKey);
		const state = sampleState(profileKey);
		const ranked = rankSeasonSlotGroups(model, state, pieces);
		const head = ranked.find((g) => g.slotId === 1);
		expect(head?.equipped?.itemId).toBe(100);
		expect(head?.equipped?.slotId).toBe(1);
		const mh = ranked.find((g) => g.slotId === 16);
		expect(mh?.equipped?.itemId).toBe(116);
	});

	it('detects same-item season loot at equal or lower ilvl than equipped', () => {
		expect(candidateMatchesEquipped({ itemId: 10, ilvl: 276 }, { itemId: 10, ilvl: 276 })).toBe(
			true
		);
		expect(candidateMatchesEquipped({ itemId: 10, ilvl: 276 }, { itemId: 10, ilvl: 280 })).toBe(
			true
		);
		expect(candidateMatchesEquipped({ itemId: 10, ilvl: 289 }, { itemId: 10, ilvl: 280 })).toBe(
			false
		);
		expect(candidateMatchesEquipped({ itemId: 10, ilvl: 276 }, { itemId: 11, ilvl: 276 })).toBe(
			false
		);

		const equipped = [
			{
				key: 'eq',
				link: 'item:100',
				itemId: 100,
				slotId: 1,
				ilvl: 280,
				equipLoc: 'INVTYPE_HEAD',
				source: 'equipped' as const,
				stats: { primary_stat: 1, crit: 0, haste: 0, mastery: 0, versatility: 0 }
			}
		];
		const pieces = [
			{
				key: 's1',
				link: 'item:100',
				itemId: 100,
				ilvl: 276,
				equipLoc: 'INVTYPE_HEAD',
				source: 'bag' as const,
				stats: { primary_stat: 1, crit: 0, haste: 0, mastery: 0, versatility: 0 }
			},
			{
				key: 's2',
				link: 'item:101',
				itemId: 101,
				ilvl: 276,
				equipLoc: 'INVTYPE_HEAD',
				source: 'bag' as const,
				stats: { primary_stat: 1, crit: 0, haste: 0, mastery: 0, versatility: 0 }
			},
			{
				key: 's3',
				link: 'item:100',
				itemId: 100,
				ilvl: 289,
				equipLoc: 'INVTYPE_HEAD',
				source: 'bag' as const,
				stats: { primary_stat: 1, crit: 0, haste: 0, mastery: 0, versatility: 0 }
			}
		];
		const dupes = collectEquippedDuplicateItemIds(pieces, equipped);
		expect(dupes.has(100)).toBe(true);
		expect(dupes.has(101)).toBe(false);
	});

	it('deselected items are excluded from season search candidates', () => {
		const model = loadModel();
		const db = loadDb();
		const loot = loadSeason();
		const profileKey = model.specKeys.includes('MID1_Mage_Frost')
			? 'MID1_Mage_Frost'
			: model.specKeys[0]!;
		const { pieces } = resolveSeasonCandidates(db, loot, 'Hero', 6, profileKey);
		expect(pieces.length).toBeGreaterThan(10);
		const keep = new Set(pieces.slice(0, 8).map((p) => p.itemId));
		const deselected = new Set(pieces.filter((p) => !keep.has(p.itemId)).map((p) => p.itemId));
		expect(filterSeasonPiecesByDeselection(pieces, deselected)).toHaveLength(8);
		const result = searchBestSeasonLoadout(model, sampleState(profileKey), db, loot, 'Hero', {
			rank: 6,
			maxCombinations: 50_000,
			deselectedItemIds: deselected
		});
		expect(result.candidateCount).toBe(8);
		expect(result.warnings.some((w) => w.includes('deselected'))).toBe(true);
	});

	it('instance filter limits season search candidates to that instance', () => {
		const model = loadModel();
		const db = loadDb();
		const loot = loadSeason();
		const profileKey = model.specKeys.includes('MID1_Mage_Frost')
			? 'MID1_Mage_Frost'
			: model.specKeys[0]!;
		const { pieces } = resolveSeasonCandidates(db, loot, 'Hero', 6, profileKey);
		const instanceName = pieces.find((p) => p.instanceName)?.instanceName;
		expect(instanceName).toBeTruthy();
		const scoped = filterSeasonPiecesByInstance(pieces, instanceName);
		expect(scoped.length).toBeGreaterThan(0);
		expect(scoped.length).toBeLessThan(pieces.length);
		expect(scoped.every((p) => p.instanceName === instanceName)).toBe(true);
		const result = searchBestSeasonLoadout(model, sampleState(profileKey), db, loot, 'Hero', {
			rank: 6,
			maxCombinations: 50_000,
			instanceName
		});
		expect(result.candidateCount).toBe(scoped.length);
		expect(result.warnings.some((w) => w.includes('Instance filter'))).toBe(true);
	});

	it('season combo estimate is not below combinations checked', () => {
		const model = loadModel();
		const db = loadDb();
		const loot = loadSeason();
		const profileKey = model.specKeys.includes('MID1_Mage_Frost')
			? 'MID1_Mage_Frost'
			: model.specKeys[0]!;
		const state = sampleState(profileKey);
		const { pieces } = resolveSeasonCandidates(db, loot, 'Champion', 6, profileKey);
		const keep = pieces.slice(0, 12);
		const deselected = new Set(pieces.filter((p) => !keep.includes(p)).map((p) => p.itemId));
		const estimate = estimateSeasonComboCount(pieces, profileKey, deselected, {
			equipped: state.equipped,
			itemDb: db
		});
		const result = searchBestSeasonLoadout(model, state, db, loot, 'Champion', {
			rank: 6,
			maxCombinations: 100_000,
			deselectedItemIds: deselected
		});
		expect(estimate).toBeGreaterThan(0);
		expect(estimate).toBeGreaterThanOrEqual(result.combinationsChecked);
	});

	it('ranks bosses with Droptimizer-style EV and Best from estimates', () => {
		const model = loadModel();
		const db = loadDb();
		const loot = loadSeason();
		const profileKey = model.specKeys.includes('MID1_Mage_Frost')
			? 'MID1_Mage_Frost'
			: model.specKeys[0]!;
		const state = sampleState(profileKey);
		const { pieces } = resolveSeasonCandidates(db, loot, 'Champion', 6, profileKey);
		const keep = pieces.slice(0, 40);
		const groups = rankSeasonSlotGroups(model, state, keep, { itemDb: db });
		const ranks = rankSeasonInstancesFromEstimates(groups);
		expect(ranks.length).toBeGreaterThan(0);
		expect(ranks[0]!.expectedValueDps).toBeGreaterThanOrEqual(
			ranks[ranks.length - 1]!.expectedValueDps
		);
		for (const boss of ranks) {
			expect(boss.dropCount).toBeGreaterThan(0);
			expect(boss.bestDps).toBeGreaterThanOrEqual(0);
			expect(boss.expectedValueDps).toBeGreaterThanOrEqual(0);
			expect(boss.expectedValueDps).toBeLessThanOrEqual(boss.bestDps + 1e-6);
			if (boss.expectedValueDps > 1e-9) {
				expect(boss.priority).toBeGreaterThan(0);
			} else {
				expect(boss.priority).toBeNull();
			}
		}
		const withEv = ranks.filter((r) => r.priority != null);
		for (let i = 1; i < withEv.length; i++) {
			expect(withEv[i]!.priority).toBe((withEv[i - 1]!.priority ?? 0) + 1);
		}
		const bossWithDrops = ranks.find((r) => r.upgrades.length > 0);
		expect(bossWithDrops).toBeDefined();
		// Non-upgrade drops (Δ ≤ 0) may appear alongside upgrades for icon display.
		expect(bossWithDrops!.upgrades.every((u) => Number.isFinite(u.estimateDelta))).toBe(true);
	});
});
