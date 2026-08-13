import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildLoadoutSearchPlan, estimateLoadoutComboCount } from '../loadout';
import { loadModelFromJson, type WebModelJson } from '../model';
import type { CharacterState, GearPiece } from '../types';
import { applyPairedWeaponCandidateScoring, computeWeaponLoadoutStatDelta } from '../weaponRank';

const here = dirname(fileURLToPath(import.meta.url));
const modelPath = join(here, '../../../../static/gearing/model-v6.json');

function loadModel() {
	const raw = JSON.parse(readFileSync(modelPath, 'utf8')) as WebModelJson;
	return loadModelFromJson(raw);
}

function piece(
	partial: Partial<GearPiece> & Pick<GearPiece, 'key' | 'link' | 'itemId' | 'equipLoc' | 'stats'>
): GearPiece {
	return {
		source: 'bag',
		...partial
	};
}

describe('computeWeaponLoadoutStatDelta', () => {
	const eqMh = piece({
		key: 'eq:mh',
		link: 'item:1',
		itemId: 1,
		equipLoc: 'INVTYPE_WEAPON',
		stats: { primary_stat: 100, crit: 10, haste: 0, mastery: 0, versatility: 0 }
	});
	const eqOh = piece({
		key: 'eq:oh',
		link: 'item:2',
		itemId: 2,
		equipLoc: 'INVTYPE_HOLDABLE',
		stats: { primary_stat: 40, crit: 5, haste: 0, mastery: 0, versatility: 0 }
	});
	const better2h = piece({
		key: 'bag:2h',
		link: 'item:3',
		itemId: 3,
		equipLoc: 'INVTYPE_2HWEAPON',
		stats: { primary_stat: 200, crit: 20, haste: 0, mastery: 0, versatility: 0 }
	});

	it('drops the old off-hand when swapping a 1H+OH set for a 2H', () => {
		const delta = computeWeaponLoadoutStatDelta(better2h, null, eqMh, eqOh);
		expect(delta).not.toBeNull();
		expect(delta!.primary_stat).toBe(60);
		expect(delta!.crit).toBe(5);
	});

	it('returns null when loadout keys are unchanged', () => {
		expect(computeWeaponLoadoutStatDelta(eqMh, eqOh, eqMh, eqOh)).toBeNull();
	});

	it('replaces a worn 2H with 1H+OH stats', () => {
		const eqStaff = piece({
			key: 'eq:staff',
			link: 'item:50',
			itemId: 50,
			equipLoc: 'INVTYPE_2HWEAPON',
			stats: { primary_stat: 200, crit: 20, haste: 0, mastery: 0, versatility: 0 }
		});
		const mh = piece({
			key: 'bag:mh',
			link: 'item:51',
			itemId: 51,
			equipLoc: 'INVTYPE_WEAPONMAINHAND',
			stats: { primary_stat: 90, crit: 9, haste: 0, mastery: 0, versatility: 0 }
		});
		const oh = piece({
			key: 'bag:oh',
			link: 'item:52',
			itemId: 52,
			equipLoc: 'INVTYPE_HOLDABLE',
			stats: { primary_stat: 80, crit: 8, haste: 0, mastery: 0, versatility: 0 }
		});
		const delta = computeWeaponLoadoutStatDelta(mh, oh, eqStaff, null);
		expect(delta).not.toBeNull();
		expect(delta!.primary_stat).toBe(-30);
		expect(delta!.crit).toBe(-3);
	});
});

describe('applyPairedWeaponCandidateScoring', () => {
	it('when already MH+OH, scores single-slot swaps (not best opposite-hand pair)', () => {
		const model = loadModel();
		const profileKey = model.specKeys.includes('MID1_Mage_Frost')
			? 'MID1_Mage_Frost'
			: model.specKeys[0]!;

		const eqMh = piece({
			key: 'eq:mh',
			link: 'item:10',
			itemId: 10,
			slotId: 16,
			equipLoc: 'INVTYPE_WEAPONMAINHAND',
			itemClass: 2,
			itemSubclass: 15,
			stats: { primary_stat: 120, crit: 20, haste: 20, mastery: 20, versatility: 20 },
			primaryStats: { strength: 0, agility: 0, intellect: 120 }
		});
		const eqOh = piece({
			key: 'eq:oh',
			link: 'item:11',
			itemId: 11,
			slotId: 17,
			equipLoc: 'INVTYPE_HOLDABLE',
			itemClass: 4,
			itemSubclass: 0,
			stats: { primary_stat: 80, crit: 10, haste: 10, mastery: 10, versatility: 10 },
			primaryStats: { strength: 0, agility: 0, intellect: 80 }
		});
		const weakMh = piece({
			key: 'bag:weak-mh',
			link: 'item:12',
			itemId: 12,
			equipLoc: 'INVTYPE_WEAPONMAINHAND',
			itemClass: 2,
			itemSubclass: 15,
			ilvl: 200,
			stats: { primary_stat: 40, crit: 5, haste: 5, mastery: 5, versatility: 5 },
			primaryStats: { strength: 0, agility: 0, intellect: 40 }
		});
		const bisOh = piece({
			key: 'bag:bis-oh',
			link: 'item:13',
			itemId: 13,
			equipLoc: 'INVTYPE_HOLDABLE',
			itemClass: 4,
			itemSubclass: 0,
			ilvl: 700,
			stats: { primary_stat: 200, crit: 40, haste: 40, mastery: 40, versatility: 40 },
			primaryStats: { strength: 0, agility: 0, intellect: 200 }
		});

		const state: CharacterState = {
			profileKey,
			stats: {
				primary_stat: 2000,
				crit: 800,
				haste: 700,
				mastery: 900,
				versatility: 500
			},
			equipped: [eqMh, eqOh],
			bags: [],
			vault: []
		};

		const scores = applyPairedWeaponCandidateScoring(
			model,
			state,
			new Map([
				[16, [weakMh]],
				[17, [bisOh]]
			])
		);

		const mhScore = scores.get('16:bag:weak-mh');
		const ohScore = scores.get('17:bag:bis-oh');
		expect(mhScore).toBeDefined();
		expect(ohScore).toBeDefined();
		expect(mhScore!.weaponPairScored).toBe(false);
		expect(ohScore!.weaponPairScored).toBe(false);
		// Weak MH vs equipped MH (keep OH) is a downgrade — must not inherit BiS OH.
		expect(mhScore!.delta).toBeLessThan(0);
		// Strong OH vs equipped OH (keep MH) is an upgrade.
		expect(ohScore!.delta).toBeGreaterThan(0);
	});

	it('does not treat OH as a free upgrade when a 2H staff is equipped', () => {
		const model = loadModel();
		const profileKey = model.specKeys.includes('MID1_Mage_Frost')
			? 'MID1_Mage_Frost'
			: model.specKeys[0]!;

		const eqStaff = piece({
			key: 'eq:staff',
			link: 'item:100',
			itemId: 100,
			slotId: 16,
			equipLoc: 'INVTYPE_2HWEAPON',
			itemClass: 2,
			itemSubclass: 10,
			stats: { primary_stat: 220, crit: 30, haste: 30, mastery: 30, versatility: 30 },
			primaryStats: { strength: 0, agility: 0, intellect: 220 }
		});
		const weakMh = piece({
			key: 'bag:weak-mh',
			link: 'item:101',
			itemId: 101,
			equipLoc: 'INVTYPE_WEAPONMAINHAND',
			itemClass: 2,
			itemSubclass: 15,
			stats: { primary_stat: 50, crit: 5, haste: 5, mastery: 5, versatility: 5 },
			primaryStats: { strength: 0, agility: 0, intellect: 50 }
		});
		const strongOh = piece({
			key: 'bag:strong-oh',
			link: 'item:102',
			itemId: 102,
			equipLoc: 'INVTYPE_HOLDABLE',
			itemClass: 4,
			itemSubclass: 0,
			stats: { primary_stat: 180, crit: 25, haste: 25, mastery: 25, versatility: 25 },
			primaryStats: { strength: 0, agility: 0, intellect: 180 }
		});
		const strongMh = piece({
			key: 'bag:strong-mh',
			link: 'item:103',
			itemId: 103,
			equipLoc: 'INVTYPE_WEAPONMAINHAND',
			itemClass: 2,
			itemSubclass: 15,
			stats: { primary_stat: 160, crit: 22, haste: 22, mastery: 22, versatility: 22 },
			primaryStats: { strength: 0, agility: 0, intellect: 160 }
		});

		const state: CharacterState = {
			profileKey,
			stats: {
				primary_stat: 2200,
				crit: 800,
				haste: 700,
				mastery: 900,
				versatility: 500
			},
			equipped: [eqStaff],
			bags: [],
			vault: []
		};

		const scores = applyPairedWeaponCandidateScoring(
			model,
			state,
			new Map([
				[16, [weakMh, strongMh]],
				[17, [strongOh]]
			])
		);

		const ohScore = scores.get('17:bag:strong-oh');
		const weakMhScore = scores.get('16:bag:weak-mh');
		const strongMhScore = scores.get('16:bag:strong-mh');

		expect(ohScore).toBeDefined();
		expect(ohScore!.weaponPairScored).toBe(true);
		// OH must be paired with best MH (strongMh), not scored vs empty under the staff.
		// strongMh(160)+strongOh(180)=340 vs staff 220 → positive; not +180 free.
		expect(ohScore!.delta).toBeGreaterThan(0);

		expect(weakMhScore).toBeDefined();
		expect(weakMhScore!.weaponPairScored).toBe(true);
		// weak MH + strong OH vs staff should not look like a free OH add onto the staff.
		expect(weakMhScore!.delta).toBeLessThan(ohScore!.delta);

		expect(strongMhScore).toBeDefined();
		expect(strongMhScore!.weaponPairScored).toBe(true);
	});
});

describe('2H candidates in combo count with equipped OH', () => {
	it('includes staffs in the estimate so deselecting one changes the total', () => {
		const model = loadModel();
		const profileKey = model.specKeys.includes('MID1_Mage_Frost')
			? 'MID1_Mage_Frost'
			: model.specKeys[0]!;

		const eqMh = piece({
			key: 'eq:mh',
			link: 'item:10',
			itemId: 10,
			slotId: 16,
			equipLoc: 'INVTYPE_WEAPONMAINHAND',
			itemClass: 2,
			itemSubclass: 15,
			stats: { primary_stat: 100, crit: 10, haste: 10, mastery: 10, versatility: 10 },
			primaryStats: { strength: 0, agility: 0, intellect: 100 }
		});
		const eqOh = piece({
			key: 'eq:oh',
			link: 'item:11',
			itemId: 11,
			slotId: 17,
			equipLoc: 'INVTYPE_HOLDABLE',
			itemClass: 4,
			itemSubclass: 0,
			stats: { primary_stat: 50, crit: 5, haste: 5, mastery: 5, versatility: 5 },
			primaryStats: { strength: 0, agility: 0, intellect: 50 }
		});
		const staffA = piece({
			key: 'bag:staff-a',
			link: 'item:20',
			itemId: 20,
			equipLoc: 'INVTYPE_2HWEAPON',
			itemClass: 2,
			itemSubclass: 10,
			stats: { primary_stat: 150, crit: 15, haste: 15, mastery: 15, versatility: 15 },
			primaryStats: { strength: 0, agility: 0, intellect: 150 }
		});
		const staffB = piece({
			key: 'bag:staff-b',
			link: 'item:21',
			itemId: 21,
			equipLoc: 'INVTYPE_2HWEAPON',
			itemClass: 2,
			itemSubclass: 10,
			stats: { primary_stat: 160, crit: 16, haste: 16, mastery: 16, versatility: 16 },
			primaryStats: { strength: 0, agility: 0, intellect: 160 }
		});
		const helm = piece({
			key: 'bag:helm',
			link: 'item:30',
			itemId: 30,
			equipLoc: 'INVTYPE_HEAD',
			itemClass: 4,
			itemSubclass: 1,
			stats: { primary_stat: 40, crit: 4, haste: 4, mastery: 4, versatility: 4 },
			primaryStats: { strength: 0, agility: 0, intellect: 40 }
		});

		const withStaffs: CharacterState = {
			profileKey,
			stats: {
				primary_stat: 2000,
				crit: 800,
				haste: 700,
				mastery: 900,
				versatility: 500
			},
			equipped: [eqMh, eqOh],
			bags: [staffA, staffB, helm],
			vault: []
		};
		const withoutOne: CharacterState = {
			...withStaffs,
			bags: [staffB, helm]
		};

		const full = estimateLoadoutComboCount(withStaffs);
		const trimmed = estimateLoadoutComboCount(withoutOne);
		expect(full).toBeGreaterThan(0);
		expect(trimmed).toBeGreaterThan(0);
		expect(trimmed).toBeLessThan(full);

		const plan = buildLoadoutSearchPlan(model, withStaffs);
		expect(plan).toMatchObject({ ok: true });
		if (!('ok' in plan) || plan.ok !== true) return;
		const emptyOh = plan.slotCandidates[17]?.some((c) => c.key === 'empty:17');
		expect(emptyOh).toBe(true);
	});
});
