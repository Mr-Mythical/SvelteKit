import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadItemDbFromJson } from '../src/lib/gearing/itemDb.js';
import { loadModelFromJson } from '../src/lib/gearing/model.js';
import {
	loadSeasonLootFromJson,
	resolveSeasonCandidates,
	searchBestSeasonLoadoutAsync
} from '../src/lib/gearing/season.js';
import { buildLoadoutSearchPlan } from '../src/lib/gearing/loadout.js';
import { isTargetTierPiece } from '../src/lib/gearing/tier.js';

const d = join(process.cwd(), 'static/gearing');
const model = loadModelFromJson(JSON.parse(readFileSync(join(d, 'model-v6.json'), 'utf8')));
const itemDb = loadItemDbFromJson(JSON.parse(readFileSync(join(d, 'item-db-v1.json'), 'utf8')));
const loot = loadSeasonLootFromJson(
	JSON.parse(readFileSync(join(d, 'season-loot-v1.json'), 'utf8'))
);
const profileKey = 'MID1_Mage_Fire';
const resolved = resolveSeasonCandidates(itemDb, loot, 'Hero', 6, profileKey);
const state = {
	profileKey,
	stats: { primary_stat: 2000, crit: 800, haste: 700, mastery: 900, versatility: 500 },
	equipped: [
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
const plan = buildLoadoutSearchPlan(model, { ...state, bags: resolved.pieces }, { itemDb });
const o = await searchBestSeasonLoadoutAsync(model, state, itemDb, loot, 'Hero', {
	rank: 6,
	maxCombinations: 500_000
});
let n = 0;
for (const sid of [1, 3, 5, 7, 10]) {
	const row = o.result.slotRows.find((x) => x.slotId === sid);
	if (row?.chosen && isTargetTierPiece(row.chosen, plan.ok ? plan.tierRules : null)) n++;
}
console.log('async', {
	source: o.source,
	workers: o.workers,
	targetTier: n,
	bestDps: o.result.bestDps,
	tierRules: plan.ok ? plan.tierRules?.targetMatchKeys : null
});
