/**
 * Unit tests for item DB resolve + crest helpers (fixture-backed, no network).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	findCrestBonus,
	loadItemDbFromJson,
	resolveItemStats,
	sumResolvedStats,
	type ItemDbJson
} from '../itemDb';
import { emptyCrestBalances, listCrestUpgradeCandidates, slotLabel } from '../crests';
import { loadModelFromJson, type WebModelJson } from '../model';

function loadDb(): ItemDbJson {
	const path = resolve(process.cwd(), 'static/gearing/item-db-v1.json');
	return loadItemDbFromJson(JSON.parse(readFileSync(path, 'utf8')) as ItemDbJson);
}

describe('itemDb', () => {
	it('resolves a known Midnight weapon to positive combat stats', () => {
		const db = loadDb();
		const resolved = resolveItemStats(db, 273873, { itemLevel: 246 });
		expect(resolved.missing).toBe(false);
		expect(resolved.name).toContain('Sunfury');
		expect(resolved.stats.primary_stat).toBeGreaterThan(50);
		expect(resolved.stats.crit + resolved.stats.mastery).toBeGreaterThan(50);
	});

	it('clamps out-of-range item levels into the scale table', () => {
		const db = loadDb();
		const clamped = resolveItemStats(db, 273873, { itemLevel: 400 });
		expect(clamped.missing).toBe(false);
		expect(clamped.itemLevel).toBe(db.scale.ilevelMax);
		expect(clamped.stats.primary_stat).toBeGreaterThan(50);
	});

	it('scales stats up with item level', () => {
		const db = loadDb();
		const low = resolveItemStats(db, 273873, { itemLevel: 220 });
		const high = resolveItemStats(db, 273873, { itemLevel: 276 });
		expect(high.stats.primary_stat).toBeGreaterThan(low.stats.primary_stat);
	});

	it('maps crest bonus IDs to item levels', () => {
		const db = loadDb();
		const info = findCrestBonus(db, [12817, 999]);
		expect(info?.itemLevel).toBe(266);
		expect(info?.currencyId).toBe(3442);
	});

	it('resolves item level from published bonuses table before crest index', () => {
		const db = loadDb();
		const withBonuses: ItemDbJson = {
			...db,
			bonuses: {
				'900001': { itemLevel: 289 },
				'900002': { levelOffset: 0 }
			}
		};
		const resolved = resolveItemStats(withBonuses, 273873, { bonusIds: [900001] });
		expect(resolved.itemLevel).toBe(289);
		expect(resolved.stats.primary_stat).toBeGreaterThan(50);
	});

	it('sums equipment while skipping trinkets', () => {
		const db = loadDb();
		const a = resolveItemStats(db, 273873, { itemLevel: 246 });
		const trinket = {
			...a,
			equipLoc: 'INVTYPE_TRINKET',
			stats: { ...a.stats, primary_stat: 9999 }
		};
		const total = sumResolvedStats([a, trinket], true);
		expect(total.primary_stat).toBe(a.stats.primary_stat);
	});
});

describe('crests', () => {
	it('lists a next-rank upgrade when a crest bonus is present', () => {
		const db = loadDb();
		const modelPath = resolve(process.cwd(), 'static/gearing/model-v6.json');
		const model = loadModelFromJson(JSON.parse(readFileSync(modelPath, 'utf8')) as WebModelJson);
		const specKey = model.specKeys.includes('MID1_Mage_Frost')
			? 'MID1_Mage_Frost'
			: model.specKeys[0]!;

		const piece = resolveItemStats(db, 273873, {
			itemLevel: 266,
			bonusIds: [12817]
		});
		const base = sumResolvedStats([piece]);
		const candidates = listCrestUpgradeCandidates(db, model, base, [piece], specKey);
		expect(candidates.length).toBeGreaterThan(0);
		expect(candidates[0]!.toLevel).toBe(269);
		expect(candidates[0]!.currencyId).toBe(3442);
		expect(emptyCrestBalances(db)[3442]).toBe(0);
		expect(slotLabel('INVTYPE_2HWEAPON')).toBe('Weapon');
	});
});
