import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	buildSeasonItemSourceIndex,
	inspectFromItemDb,
	inspectFromPiece,
	inspectStatEntries,
	listSeasonInstances,
	searchItemDb
} from '../inspect';
import { loadItemDbFromJson, type ItemDbJson } from '../itemDb';
import { emptyStats } from '../model';
import type { GearPiece } from '../types';

describe('inspect', () => {
	it('builds an inspectable view with bonus ids and stats', () => {
		const piece: GearPiece = {
			key: 't:1',
			link: 'item:271565:12854',
			itemId: 271565,
			name: 'Venomwoven Gloves',
			ilvl: 334,
			slotId: 10,
			equipLoc: 'INVTYPE_HAND',
			source: 'bag',
			sourceLabel: 'The Venomous Abyss',
			isTierPiece: true,
			tierMatchKey: 'venomous-abyss-t1:MAGE',
			stats: { ...emptyStats(), primary_stat: 1200, crit: 400 }
		};
		const view = inspectFromPiece(piece);
		expect(view?.itemId).toBe(271565);
		expect(view?.bonusIds).toEqual([12854]);
		expect(view?.slotLabel).toBe('Hands');
		expect(inspectStatEntries(view!.stats).map((s) => s.name)).toEqual(['primary_stat', 'crit']);
	});

	it('searches the item DB by name and resolves inspect stats', () => {
		const path = resolve(process.cwd(), 'static/gearing/item-db-v1.json');
		const db = loadItemDbFromJson(JSON.parse(readFileSync(path, 'utf8')) as ItemDbJson);
		const hits = searchItemDb(db, 'Sunfury', { limit: 5 });
		expect(hits.length).toBeGreaterThan(0);
		const view = inspectFromItemDb(db, hits[0]!.itemId, { itemLevel: 276 });
		expect(view?.ilvl).toBe(276);
		expect(view?.stats.primary_stat).toBeGreaterThan(0);
	});

	it('lists Tidebound Grotto as a Midnight raid with journal loot', () => {
		const lootPath = resolve(process.cwd(), 'static/gearing/season-loot-v1.json');
		const loot = JSON.parse(readFileSync(lootPath, 'utf8')) as {
			items: { instanceName: string; instanceKind: string }[];
		};
		const tidebound = listSeasonInstances(loot).find(
			(i) => i.instanceName === 'The Tidebound Grotto'
		);
		expect(tidebound?.instanceKind).toBe('Raid');
		expect(tidebound!.itemCount).toBeGreaterThanOrEqual(10);
	});

	it('filters catalog hits by season instance', () => {
		const dbPath = resolve(process.cwd(), 'static/gearing/item-db-v1.json');
		const lootPath = resolve(process.cwd(), 'static/gearing/season-loot-v1.json');
		const db = loadItemDbFromJson(JSON.parse(readFileSync(dbPath, 'utf8')) as ItemDbJson);
		const loot = JSON.parse(readFileSync(lootPath, 'utf8')) as {
			items: {
				itemId: number;
				instanceName: string;
				instanceKind: string;
				sourceLabel?: string;
			}[];
		};
		const instances = listSeasonInstances(loot);
		expect(instances.length).toBeGreaterThan(0);
		const abyss = instances.find((i) => i.instanceName === 'The Venomous Abyss');
		expect(abyss).toBeTruthy();
		const index = buildSeasonItemSourceIndex(loot);
		const hits = searchItemDb(db, '', {
			instanceName: 'The Venomous Abyss',
			seasonIndex: index
		});
		expect(hits.length).toBe(abyss!.itemCount);
		expect(hits.every((h) => h.instanceName === 'The Venomous Abyss')).toBe(true);
	});
});
