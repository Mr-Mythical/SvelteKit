import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	buildComboCountParts,
	buildLoadoutSearchPlan,
	countLoadoutCombinations,
	countValidLoadoutLeaves,
	estimateLoadoutComboCount,
	plainGearPiece,
	searchBestBagLoadout
} from '../loadout';
import { loadModelFromJson, type WebModelJson } from '../model';
import { rankVaultOptions } from '../vault';
import type { CharacterState } from '../types';

const here = dirname(fileURLToPath(import.meta.url));
const modelPath = join(here, '../../../../static/gearing/model-v6.json');

function loadModel() {
	const raw = JSON.parse(readFileSync(modelPath, 'utf8')) as WebModelJson;
	return loadModelFromJson(raw);
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
		bags: [
			{
				key: 'bag:1',
				link: 'item:200',
				itemId: 200,
				name: 'Better Helm',
				equipLoc: 'INVTYPE_HEAD',
				source: 'bag',
				stats: { primary_stat: 180, crit: 40, haste: 40, mastery: 40, versatility: 40 }
			}
		],
		vault: [
			{
				key: 'vault:1',
				link: 'item:300',
				itemId: 300,
				name: 'Vault Helm',
				equipLoc: 'INVTYPE_HEAD',
				source: 'vault',
				stats: { primary_stat: 200, crit: 50, haste: 50, mastery: 50, versatility: 50 }
			},
			{
				key: 'vault:trinket',
				link: 'item:301',
				itemId: 301,
				name: 'Vault Trinket',
				equipLoc: 'INVTYPE_TRINKET',
				source: 'vault',
				stats: { primary_stat: 0, crit: 0, haste: 0, mastery: 0, versatility: 0 }
			}
		],
		exportMeta: { schemaVersion: 1 }
	};
}

describe('searchBestBagLoadout', () => {
	it('picks the higher-stat helm from bags', () => {
		const model = loadModel();
		const profileKey = model.specKeys.includes('MID1_Mage_Frost')
			? 'MID1_Mage_Frost'
			: model.specKeys[0]!;
		const result = searchBestBagLoadout(model, sampleState(profileKey));
		expect(result.combinationsChecked).toBeGreaterThan(0);
		const helm = result.slotRows.find((r) => r.slotId === 1);
		expect(helm?.isUpgrade).toBe(true);
		expect(helm?.chosen?.key).toBe('bag:1');
		expect(result.delta).toBeGreaterThan(0);
	});

	it('combo estimate matches plan total and is not below checked leaves', () => {
		const model = loadModel();
		const profileKey = model.specKeys.includes('MID1_Mage_Frost')
			? 'MID1_Mage_Frost'
			: model.specKeys[0]!;
		const state = sampleState(profileKey);
		const estimate = estimateLoadoutComboCount(state);
		const plan = buildLoadoutSearchPlan(model, state);
		expect(plan).toMatchObject({ ok: true });
		if (!('ok' in plan) || plan.ok !== true) return;
		expect(estimate).toBe(plan.total);
		const result = searchBestBagLoadout(model, state);
		expect(estimate).toBe(result.combinationsChecked);
	});

	it('formula/DP count matches combinationsChecked and DFS leaves', () => {
		const model = loadModel();
		const profileKey = model.specKeys.includes('MID1_Mage_Frost')
			? 'MID1_Mage_Frost'
			: model.specKeys[0]!;
		const state = sampleState(profileKey);
		const parts = buildComboCountParts(state);
		expect(parts).not.toBeNull();
		if (!parts) return;
		const counted = countLoadoutCombinations(
			parts.slotCandidates,
			parts.weaponPairs,
			parts.tierRules
		);
		const leaves = countValidLoadoutLeaves(
			parts.slotCandidates,
			parts.weaponPairs,
			parts.tierRules
		);
		expect(counted).toBe(leaves);
		const result = searchBestBagLoadout(model, state);
		expect(counted).toBe(result.combinationsChecked);
		const plan = buildLoadoutSearchPlan(model, state, { comboTotalHint: counted });
		expect(plan).toMatchObject({ ok: true });
		if (!('ok' in plan) || plan.ok !== true) return;
		expect(plan.total).toBe(counted);
	});

	it('search plan stays structured-cloneable when equipped stats are Proxies', () => {
		const model = loadModel();
		const profileKey = model.specKeys.includes('MID1_Mage_Frost')
			? 'MID1_Mage_Frost'
			: model.specKeys[0]!;
		const state = sampleState(profileKey);
		// Simulate Svelte $state nested proxies (shallow spread keeps Proxy stats).
		state.equipped = state.equipped.map((piece) => ({
			...piece,
			stats: new Proxy(
				{ ...piece.stats },
				{
					get(target, prop, receiver) {
						return Reflect.get(target, prop, receiver);
					}
				}
			)
		}));
		expect(() => structuredClone(state.equipped[0])).toThrow();
		expect(() => structuredClone(plainGearPiece(state.equipped[0]!))).not.toThrow();
		const plan = buildLoadoutSearchPlan(model, state);
		expect(plan).toMatchObject({ ok: true });
		if (!('ok' in plan) || plan.ok !== true) return;
		expect(() => structuredClone(plan)).not.toThrow();
	});
});

describe('rankVaultOptions', () => {
	it('ranks vault helm and skips trinkets', () => {
		const model = loadModel();
		const profileKey = model.specKeys.includes('MID1_Mage_Frost')
			? 'MID1_Mage_Frost'
			: model.specKeys[0]!;
		const result = rankVaultOptions(model, sampleState(profileKey));
		expect(result.trinketCount).toBe(1);
		expect(result.rows).toHaveLength(1);
		expect(result.rows[0]?.piece.key).toBe('vault:1');
		expect(result.rows[0]?.delta).toBeGreaterThan(0);
	});

	it('returns empty reason when vault missing', () => {
		const model = loadModel();
		const state = sampleState(model.specKeys[0]!);
		state.vault = [];
		const result = rankVaultOptions(model, state);
		expect(result.rows).toHaveLength(0);
		expect(result.emptyReason).toMatch(/No Great Vault/);
	});
});
