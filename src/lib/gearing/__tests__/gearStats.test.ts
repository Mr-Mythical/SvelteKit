import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasCombatStats, scoringPaperDoll, sumEquippedCombatStats } from '../gearStats';
import { emptyStats } from '../model';
import { loadModelFromJson, type WebModelJson } from '../model';
import { estimateSeasonPieceDelta, rankSeasonSlotGroups } from '../season';
import type { CharacterState, GearPiece } from '../types';

const here = dirname(fileURLToPath(import.meta.url));
const modelPath = join(here, '../../../../static/gearing/model-v6.json');

function loadModel() {
	const raw = JSON.parse(readFileSync(modelPath, 'utf8')) as WebModelJson;
	return loadModelFromJson(raw);
}

function piece(
	partial: Partial<GearPiece> & Pick<GearPiece, 'key' | 'link' | 'itemId' | 'equipLoc'>
): GearPiece {
	return {
		source: 'equipped',
		stats: emptyStats(),
		...partial
	};
}

describe('gearStats paper doll', () => {
	it('sums only pieces that have combat ratings', () => {
		const equipped = [
			piece({
				key: 'a',
				link: 'item:1',
				itemId: 1,
				equipLoc: 'INVTYPE_HEAD',
				slotId: 1,
				stats: { primary_stat: 100, crit: 10, haste: 0, mastery: 0, versatility: 0 }
			}),
			piece({
				key: 'b',
				link: 'item:2',
				itemId: 2,
				equipLoc: 'INVTYPE_SHOULDER',
				slotId: 3,
				stats: emptyStats()
			})
		];
		const sum = sumEquippedCombatStats(equipped);
		expect(sum.primary_stat).toBe(100);
		expect(hasCombatStats(sum)).toBe(true);
		expect(scoringPaperDoll(equipped, emptyStats()).primary_stat).toBe(100);
	});

	it('prefers an authoritative fallback paper doll over the gear sum', () => {
		const equipped = [
			piece({
				key: 'a',
				link: 'item:1',
				itemId: 1,
				equipLoc: 'INVTYPE_HEAD',
				slotId: 1,
				stats: { primary_stat: 100, crit: 10, haste: 0, mastery: 0, versatility: 0 }
			})
		];
		const live = {
			primary_stat: 2500,
			crit: 900,
			haste: 800,
			mastery: 700,
			versatility: 600
		};
		expect(scoringPaperDoll(equipped, live).primary_stat).toBe(2500);
		expect(scoringPaperDoll(equipped, live).crit).toBe(900);
	});
});

describe('estimateSeasonPieceDelta with unknown equipped stats', () => {
	it('does not treat a worn item with zero stats as an empty slot', () => {
		const model = loadModel();
		const profileKey = model.specKeys.includes('MID1_Mage_Frost')
			? 'MID1_Mage_Frost'
			: model.specKeys[0]!;
		const state: CharacterState = {
			profileKey,
			stats: {
				primary_stat: 1800,
				crit: 700,
				haste: 650,
				mastery: 800,
				versatility: 400
			},
			equipped: [
				piece({
					key: 'eq:head',
					link: 'item:999001',
					itemId: 999001,
					slotId: 1,
					equipLoc: 'INVTYPE_HEAD',
					itemClass: 4,
					itemSubclass: 1,
					stats: emptyStats(),
					primaryStats: { strength: 0, agility: 0, intellect: 1 }
				})
			],
			bags: [],
			vault: []
		};
		const cand = piece({
			key: 'bag:head',
			link: 'item:999002',
			itemId: 999002,
			equipLoc: 'INVTYPE_HEAD',
			itemClass: 4,
			itemSubclass: 1,
			source: 'bag',
			stats: { primary_stat: 200, crit: 40, haste: 40, mastery: 40, versatility: 40 },
			primaryStats: { strength: 0, agility: 0, intellect: 200 }
		});
		// No Item DB / Armory ratings → refuse to score rather than invent a free upgrade.
		const estimate = estimateSeasonPieceDelta(model, state, cand, 1);
		expect(estimate).toBeNull();
	});

	it('ranks a real upgrade positive and a downgrade negative when stats are known', () => {
		const model = loadModel();
		const profileKey = model.specKeys.includes('MID1_Mage_Frost')
			? 'MID1_Mage_Frost'
			: model.specKeys[0]!;
		const eqHead = piece({
			key: 'eq:head',
			link: 'item:1',
			itemId: 1,
			slotId: 1,
			equipLoc: 'INVTYPE_HEAD',
			itemClass: 4,
			itemSubclass: 1,
			stats: { primary_stat: 150, crit: 30, haste: 30, mastery: 30, versatility: 30 },
			primaryStats: { strength: 0, agility: 0, intellect: 150 }
		});
		const better = piece({
			key: 'bag:better',
			link: 'item:2',
			itemId: 2,
			equipLoc: 'INVTYPE_HEAD',
			itemClass: 4,
			itemSubclass: 1,
			source: 'bag',
			stats: { primary_stat: 220, crit: 50, haste: 50, mastery: 50, versatility: 50 },
			primaryStats: { strength: 0, agility: 0, intellect: 220 }
		});
		const worse = piece({
			key: 'bag:worse',
			link: 'item:3',
			itemId: 3,
			equipLoc: 'INVTYPE_HEAD',
			itemClass: 4,
			itemSubclass: 1,
			source: 'bag',
			stats: { primary_stat: 40, crit: 5, haste: 5, mastery: 5, versatility: 5 },
			primaryStats: { strength: 0, agility: 0, intellect: 40 }
		});
		const state: CharacterState = {
			profileKey,
			stats: sumEquippedCombatStats([eqHead]),
			equipped: [eqHead],
			bags: [],
			vault: []
		};
		expect(estimateSeasonPieceDelta(model, state, better, 1)?.delta).toBeGreaterThan(0);
		expect(estimateSeasonPieceDelta(model, state, worse, 1)?.delta).toBeLessThan(0);

		const ranked = rankSeasonSlotGroups(model, state, [better, worse]);
		const head = ranked.find((g) => g.slotId === 1);
		expect(head?.pieces[0]?.piece.key).toBe('bag:better');
		expect(head?.pieces[0]?.estimateDelta).toBeGreaterThan(0);
		expect(head?.pieces[1]?.estimateDelta).toBeLessThan(0);
	});
});
