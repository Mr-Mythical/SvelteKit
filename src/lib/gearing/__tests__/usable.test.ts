import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ItemDbJson } from '../itemDb';
import {
	annotatePieceFromItemDb,
	isArmorCandidateAllowedForClass,
	isGearUsableForProfile,
	parseClassSpec,
	primaryStatForProfile,
	slotCanUseCandidate
} from '../usable';
import type { GearPiece } from '../types';
import { emptyStats } from '../model';

const here = dirname(fileURLToPath(import.meta.url));
const dbPath = join(here, '../../../../static/gearing/item-db-v1.json');

function loadDb(): ItemDbJson {
	return JSON.parse(readFileSync(dbPath, 'utf8')) as ItemDbJson;
}

function piece(partial: Partial<GearPiece> & Pick<GearPiece, 'itemId' | 'equipLoc'>): GearPiece {
	return {
		key: `t:${partial.itemId}`,
		link: `item:${partial.itemId}`,
		source: 'bag',
		stats: emptyStats(),
		...partial
	};
}

describe('parseClassSpec / primaryStatForProfile', () => {
	it('parses multi-word classes and priest intellect', () => {
		expect(parseClassSpec('MID1_Death_Knight_Frost')?.classToken).toBe('DEATHKNIGHT');
		expect(parseClassSpec('MID1_Priest_Shadow')?.specBody).toBe('Priest_Shadow');
		expect(primaryStatForProfile('MID1_Priest_Shadow')).toBe('intellect');
		expect(primaryStatForProfile('MID1_Warrior_Arms')).toBe('strength');
		expect(primaryStatForProfile('MID1_Rogue_Subtlety')).toBe('agility');
	});

	it('keeps multi-token specs like Beast Mastery and Survival PL DW', () => {
		expect(parseClassSpec('MID1_Hunter_Beast_Mastery')?.specBody).toBe('Hunter_Beast_Mastery');
		expect(parseClassSpec('MID1_Hunter_Survival_PL_DW')?.specBody).toBe('Hunter_Survival_PL_DW');
		expect(parseClassSpec('MID1_Demon_Hunter_Devourer_Void-Scarred')?.specBody).toBe(
			'Demon_Hunter_Devourer'
		);
		expect(primaryStatForProfile('MID1_Hunter_Beast_Mastery')).toBe('agility');
	});
});

describe('armor filters', () => {
	it('allows cloth for priest and rejects plate', () => {
		expect(isArmorCandidateAllowedForClass('PRIEST', 4, 1)).toBe(true);
		expect(isArmorCandidateAllowedForClass('PRIEST', 4, 4)).toBe(false);
		expect(isArmorCandidateAllowedForClass('WARRIOR', 4, 4)).toBe(true);
		expect(isArmorCandidateAllowedForClass('WARRIOR', 4, 1)).toBe(false);
	});

	it('allows cloaks for every class', () => {
		const cloak = piece({
			itemId: 1,
			equipLoc: 'INVTYPE_CLOAK',
			itemClass: 4,
			itemSubclass: 1
		});
		expect(slotCanUseCandidate(15, cloak, 'MID1_Warrior_Arms')).toBe(true);
		expect(isGearUsableForProfile(cloak, 'MID1_Warrior_Arms')).toBe(true);
	});
});

describe('weapon + primary filters', () => {
	it('rejects strength 1H axe on priest main hand', () => {
		const axe = piece({
			itemId: 2,
			equipLoc: 'INVTYPE_WEAPON',
			itemClass: 2,
			itemSubclass: 0, // axe 1H
			primaryStats: { strength: 100, agility: 0, intellect: 0 }
		});
		expect(slotCanUseCandidate(16, axe, 'MID1_Priest_Shadow')).toBe(false);
	});

	it('allows intellect staff on priest', () => {
		const staff = piece({
			itemId: 3,
			equipLoc: 'INVTYPE_2HWEAPON',
			itemClass: 2,
			itemSubclass: 10, // staff
			primaryStats: { strength: 0, agility: 0, intellect: 200 }
		});
		expect(slotCanUseCandidate(16, staff, 'MID1_Priest_Shadow')).toBe(true);
	});

	it('rejects plate helm for mage via Item DB annotation when present', () => {
		const db = loadDb();
		const plate = Object.entries(db.items).find(
			([, e]) => e.equipLoc === 'INVTYPE_HEAD' && e.itemClass === 4 && e.itemSubclass === 4
		);
		expect(plate).toBeTruthy();
		const [id] = plate!;
		const annotated = annotatePieceFromItemDb(
			piece({ itemId: Number(id), equipLoc: 'INVTYPE_HEAD' }),
			db
		);
		expect(isGearUsableForProfile(annotated, 'MID1_Mage_Frost')).toBe(false);
		expect(slotCanUseCandidate(1, annotated, 'MID1_Mage_Frost')).toBe(false);
	});

	it('allows cloth helm for mage via Item DB', () => {
		const db = loadDb();
		const cloth = Object.entries(db.items).find(
			([, e]) => e.equipLoc === 'INVTYPE_HEAD' && e.itemClass === 4 && e.itemSubclass === 1
		);
		expect(cloth).toBeTruthy();
		const [id] = cloth!;
		const annotated = annotatePieceFromItemDb(
			piece({ itemId: Number(id), equipLoc: 'INVTYPE_HEAD' }),
			db
		);
		expect(isGearUsableForProfile(annotated, 'MID1_Mage_Frost')).toBe(true);
		expect(slotCanUseCandidate(1, annotated, 'MID1_Mage_Frost')).toBe(true);
	});

	it('gates shields and holdables by class/spec weapon rules', () => {
		const shield = piece({
			itemId: 10,
			equipLoc: 'INVTYPE_SHIELD',
			itemClass: 4,
			itemSubclass: 6
		});
		const holdable = piece({
			itemId: 11,
			equipLoc: 'INVTYPE_HOLDABLE',
			itemClass: 4,
			itemSubclass: 0
		});
		const oneHand = piece({
			itemId: 12,
			equipLoc: 'INVTYPE_WEAPON',
			itemClass: 2,
			itemSubclass: 7, // 1H sword
			primaryStats: { strength: 100, agility: 0, intellect: 0 }
		});
		const twoHand = piece({
			itemId: 13,
			equipLoc: 'INVTYPE_2HWEAPON',
			itemClass: 2,
			itemSubclass: 8, // 2H sword
			primaryStats: { strength: 200, agility: 0, intellect: 0 }
		});

		// Shields: only Prot / Holy Paladin / Elemental / Resto Shaman.
		for (const key of [
			'MID1_Mage_Frost',
			'MID1_Warlock_Affliction',
			'MID1_Priest_Shadow',
			'MID1_Hunter_Beast_Mastery',
			'MID1_Rogue_Subtlety',
			'MID1_Death_Knight_Frost',
			'MID1_Druid_Balance',
			'MID1_Monk_Windwalker',
			'MID1_Demon_Hunter_Havoc',
			'MID1_Evoker_Devastation',
			'MID1_Warrior_Arms',
			'MID1_Paladin_Retribution',
			'MID1_Shaman_Enhancement',
			'MID1_Warrior_Fury'
		] as const) {
			expect(isGearUsableForProfile(shield, key)).toBe(false);
			expect(slotCanUseCandidate(17, shield, key)).toBe(false);
		}
		for (const key of [
			'MID1_Warrior_Protection',
			'MID1_Paladin_Protection',
			'MID1_Paladin_Holy',
			'MID1_Shaman_Elemental',
			'MID1_Shaman_Restoration'
		] as const) {
			expect(isGearUsableForProfile(shield, key)).toBe(true);
			expect(slotCanUseCandidate(17, shield, key)).toBe(true);
		}

		// Holdables: caster / healer classes with allowHoldable (incl. Balance / Mistweaver).
		expect(isGearUsableForProfile(holdable, 'MID1_Mage_Frost')).toBe(true);
		expect(isGearUsableForProfile(holdable, 'MID1_Priest_Shadow')).toBe(true);
		expect(isGearUsableForProfile(holdable, 'MID1_Warlock_Affliction')).toBe(true);
		expect(isGearUsableForProfile(holdable, 'MID1_Evoker_Devastation')).toBe(true);
		expect(isGearUsableForProfile(holdable, 'MID1_Druid_Balance')).toBe(true);
		expect(slotCanUseCandidate(17, holdable, 'MID1_Druid_Balance')).toBe(true);
		expect(isGearUsableForProfile(holdable, 'MID1_Monk_Mistweaver')).toBe(true);
		expect(isGearUsableForProfile(holdable, 'MID1_Warrior_Arms')).toBe(false);
		expect(isGearUsableForProfile(holdable, 'MID1_Hunter_Beast_Mastery')).toBe(false);

		// 2H-only specs reject bare 1H; Fury rejects 1H (Titan's Grip is dual 2H).
		expect(slotCanUseCandidate(16, oneHand, 'MID1_Warrior_Arms')).toBe(false);
		expect(slotCanUseCandidate(16, oneHand, 'MID1_Paladin_Retribution')).toBe(false);
		expect(slotCanUseCandidate(16, oneHand, 'MID1_Hunter_Beast_Mastery')).toBe(false);
		expect(slotCanUseCandidate(16, oneHand, 'MID1_Warrior_Fury')).toBe(false);
		expect(slotCanUseCandidate(16, twoHand, 'MID1_Warrior_Arms')).toBe(true);
		expect(slotCanUseCandidate(16, twoHand, 'MID1_Warrior_Fury')).toBe(true);
		expect(slotCanUseCandidate(17, twoHand, 'MID1_Warrior_Fury')).toBe(true);

		// Survival / Devourer can dual-wield 1H weapons.
		const agi1h = piece({
			itemId: 14,
			equipLoc: 'INVTYPE_WEAPON',
			itemClass: 2,
			itemSubclass: 0,
			primaryStats: { strength: 0, agility: 100, intellect: 0 }
		});
		expect(slotCanUseCandidate(16, agi1h, 'MID1_Hunter_Survival')).toBe(true);
		expect(slotCanUseCandidate(17, agi1h, 'MID1_Hunter_Survival')).toBe(true);
		expect(slotCanUseCandidate(17, agi1h, 'MID1_Hunter_Survival_PL_DW')).toBe(true);
		expect(slotCanUseCandidate(17, agi1h, 'MID1_Demon_Hunter_Devourer')).toBe(true);
	});
});
