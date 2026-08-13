import { describe, expect, it } from 'vitest';
import {
	armoryToEquippedPieces,
	combatStatsFromArmoryPaperDoll,
	resolveArmoryEquipment,
	slotIdForArmoryPiece,
	type ArmoryCharacterResponse
} from '../armory';
import { emptyStats, type CombatStats } from '../model';
import type { ItemDbJson, ResolvedItem } from '../itemDb';

function resolved(
	partial: Partial<ResolvedItem> & Pick<ResolvedItem, 'itemId' | 'name' | 'missing'>
): ResolvedItem {
	return {
		slot: '',
		equipLoc: '',
		quality: 3,
		itemLevel: 600,
		stats: emptyStats() as CombatStats,
		bonusIds: [],
		...partial
	};
}

describe('armoryToEquippedPieces', () => {
	it('keeps items missing from the Item DB so the equipped list stays complete', () => {
		const character: ArmoryCharacterResponse = {
			name: 'Test',
			realm: 'Realm',
			region: 'eu',
			level: 80,
			characterClass: 'Mage',
			activeSpec: 'Frost',
			notes: [],
			equipped: [
				{
					slot: 'HEAD',
					itemId: 1,
					bonusIds: [1],
					itemLevel: 610,
					name: 'Known Helm'
				},
				{
					slot: 'NECK',
					itemId: 2,
					bonusIds: [],
					itemLevel: 610,
					name: 'Missing Neck'
				},
				{
					slot: 'SHIRT',
					itemId: 3,
					bonusIds: [],
					itemLevel: 1,
					name: 'Tabard-ish Shirt'
				}
			]
		};
		const resolvedItems = [
			resolved({
				itemId: 1,
				name: 'Known Helm',
				equipLoc: 'INVTYPE_HEAD',
				missing: false,
				stats: { primary_stat: 10, crit: 1, haste: 0, mastery: 0, versatility: 0 }
			}),
			resolved({ itemId: 2, name: 'db', missing: true }),
			resolved({ itemId: 3, name: 'db', missing: true })
		];

		const pieces = armoryToEquippedPieces(character, resolvedItems);
		expect(pieces).toHaveLength(2);
		expect(pieces[0]?.slotId).toBe(1);
		expect(pieces[0]?.stats.primary_stat).toBe(10);
		expect(pieces[1]?.name).toBe('Missing Neck');
		expect(pieces[1]?.slotId).toBe(2);
		expect(pieces[1]?.stats.primary_stat).toBe(0);
		expect(pieces.some((p) => p.sourceLabel === 'SHIRT' || p.itemId === 3)).toBe(false);
	});

	it('uses Battle.net combat ratings when the Item DB row is missing', () => {
		const character: ArmoryCharacterResponse = {
			name: 'Test',
			realm: 'Realm',
			region: 'eu',
			level: 80,
			characterClass: 'Mage',
			activeSpec: 'Frost',
			notes: [],
			equipped: [
				{
					slot: 'SHOULDER',
					itemId: 99,
					bonusIds: [],
					itemLevel: 246,
					name: 'Unknown Spaulders',
					inventoryType: 'SHOULDER',
					combatStats: {
						primary_stat: 180,
						crit: 40,
						haste: 30,
						mastery: 20,
						versatility: 10
					}
				}
			]
		};
		const pieces = armoryToEquippedPieces(character, [
			resolved({ itemId: 99, name: 'db', missing: true })
		]);
		expect(pieces).toHaveLength(1);
		expect(pieces[0]?.stats.primary_stat).toBe(180);
		expect(pieces[0]?.stats.crit).toBe(40);
		expect(pieces[0]?.equipLoc).toBe('INVTYPE_SHOULDER');
	});

	it('prefers Battle.net stats over Item DB when both exist', () => {
		const character: ArmoryCharacterResponse = {
			name: 'Test',
			realm: 'Realm',
			region: 'eu',
			level: 80,
			characterClass: 'Mage',
			activeSpec: 'Frost',
			notes: [],
			equipped: [
				{
					slot: 'HEAD',
					itemId: 1,
					bonusIds: [],
					itemLevel: 246,
					name: 'Helm',
					combatStats: {
						primary_stat: 999,
						crit: 999,
						haste: 0,
						mastery: 0,
						versatility: 0
					}
				}
			]
		};
		const pieces = armoryToEquippedPieces(character, [
			resolved({
				itemId: 1,
				name: 'Helm',
				equipLoc: 'INVTYPE_HEAD',
				missing: false,
				stats: { primary_stat: 150, crit: 25, haste: 10, mastery: 5, versatility: 0 }
			})
		]);
		expect(pieces[0]?.stats.primary_stat).toBe(999);
		expect(pieces[0]?.stats.crit).toBe(999);
	});

	it('falls back to Item DB when Battle.net omitted combat ratings', () => {
		const character: ArmoryCharacterResponse = {
			name: 'Test',
			realm: 'Realm',
			region: 'eu',
			level: 80,
			characterClass: 'Mage',
			activeSpec: 'Frost',
			notes: [],
			equipped: [
				{
					slot: 'HEAD',
					itemId: 1,
					bonusIds: [],
					itemLevel: 246,
					name: 'Helm'
				}
			]
		};
		const pieces = armoryToEquippedPieces(character, [
			resolved({
				itemId: 1,
				name: 'Helm',
				equipLoc: 'INVTYPE_HEAD',
				missing: false,
				stats: { primary_stat: 150, crit: 25, haste: 10, mastery: 5, versatility: 0 }
			})
		]);
		expect(pieces[0]?.stats.primary_stat).toBe(150);
		expect(pieces[0]?.stats.crit).toBe(25);
	});

	it('skips shirt and tabard', () => {
		const character: ArmoryCharacterResponse = {
			name: 'Test',
			realm: 'Realm',
			region: 'eu',
			level: 80,
			characterClass: 'Mage',
			activeSpec: 'Frost',
			notes: [],
			equipped: [
				{
					slot: 'TABARD',
					itemId: 9,
					bonusIds: [],
					itemLevel: 1,
					name: 'Guild Tabard'
				},
				{
					slot: 'MAIN_HAND',
					itemId: 10,
					bonusIds: [],
					itemLevel: 620,
					name: 'Staff'
				}
			]
		};
		const pieces = armoryToEquippedPieces(character, [
			resolved({ itemId: 9, name: 'Guild Tabard', missing: false }),
			resolved({
				itemId: 10,
				name: 'Staff',
				equipLoc: 'INVTYPE_2HWEAPON',
				missing: false
			})
		]);
		expect(pieces).toHaveLength(1);
		expect(pieces[0]?.itemId).toBe(10);
		expect(pieces[0]?.slotId).toBe(16);
	});

	it('maps inventory_type when slot.type is unknown', () => {
		expect(
			slotIdForArmoryPiece({
				slot: 'UNKNOWN',
				itemId: 1,
				bonusIds: [],
				itemLevel: 1,
				name: 'x',
				inventoryType: 'CLOAK'
			})
		).toBe(15);
	});
});

describe('combatStatsFromArmoryPaperDoll', () => {
	const doll = {
		strength: 100,
		agility: 200,
		intellect: 2500,
		crit: 900,
		haste: 800,
		mastery: 700,
		versatility: 600
	};

	it('picks intellect for mage profiles', () => {
		const stats = combatStatsFromArmoryPaperDoll(doll, 'MID1_Mage_Frost');
		expect(stats.primary_stat).toBe(2500);
		expect(stats.crit).toBe(900);
		expect(stats.haste).toBe(800);
	});

	it('picks agility for rogue profiles', () => {
		expect(combatStatsFromArmoryPaperDoll(doll, 'MID1_Rogue_Subtlety').primary_stat).toBe(200);
	});

	it('falls back to the largest primary without a profile', () => {
		expect(combatStatsFromArmoryPaperDoll(doll, null).primary_stat).toBe(2500);
	});
});

describe('resolveArmoryEquipment paper doll', () => {
	const emptyDb = { version: 1, items: {} } as unknown as ItemDbJson;

	it('prefers live statistics over summed gear', () => {
		const character: ArmoryCharacterResponse = {
			name: 'Test',
			realm: 'Realm',
			region: 'eu',
			level: 80,
			characterClass: 'Mage',
			activeSpec: 'Frost',
			notes: [],
			paperDoll: {
				strength: 50,
				agility: 50,
				intellect: 3200,
				crit: 1100,
				haste: 1000,
				mastery: 900,
				versatility: 800
			},
			equipped: [
				{
					slot: 'HEAD',
					itemId: 1,
					bonusIds: [],
					itemLevel: 246,
					name: 'Helm',
					combatStats: {
						primary_stat: 150,
						crit: 25,
						haste: 10,
						mastery: 5,
						versatility: 0
					}
				}
			]
		};
		const result = resolveArmoryEquipment(emptyDb, character, ['MID1_Mage_Frost']);
		expect(result.statsFromPaperDoll).toBe(true);
		expect(result.stats.primary_stat).toBe(3200);
		expect(result.stats.crit).toBe(1100);
		expect(result.matchedSpecKey).toBe('MID1_Mage_Frost');
	});
});
