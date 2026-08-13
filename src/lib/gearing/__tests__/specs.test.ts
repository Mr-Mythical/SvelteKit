import { describe, expect, it } from 'vitest';
import { classRelativeSpecLabel, formatProfileKey, labeledSpecsForClass } from '../specs';

const KEYS = [
	'MID1_Mage_Frost',
	'MID1_Mage_Frost_Frostfire',
	'MID1_Mage_Fire',
	'MID1_Warrior_Arms',
	'MID1_Death_Knight_Frost',
	'MID1_Hunter_Beast_Mastery'
];

describe('labeledSpecsForClass', () => {
	it('limits to the loaded character class', () => {
		const mage = labeledSpecsForClass(KEYS, 'Mage');
		expect(mage.map((s) => s.profileKey)).toEqual([
			'MID1_Mage_Fire',
			'MID1_Mage_Frost',
			'MID1_Mage_Frost_Frostfire'
		]);
		expect(labeledSpecsForClass(KEYS, 'Death Knight').map((s) => s.profileKey)).toEqual([
			'MID1_Death_Knight_Frost'
		]);
	});

	it('uses compact labels when class is known', () => {
		expect(classRelativeSpecLabel(formatProfileKey('MID1_Mage_Frost_Frostfire'))).toBe(
			'Frost (Frostfire)'
		);
		expect(classRelativeSpecLabel(formatProfileKey('MID1_Hunter_Beast_Mastery'))).toBe(
			'Beast Mastery'
		);
	});
});
