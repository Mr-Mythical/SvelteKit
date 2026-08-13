import { describe, expect, it } from 'vitest';
import { parseSimcPaste } from '../simc';
import { matchSpecKey } from '../specs';

const SPEC_KEYS = [
	'MID1_Mage_Frost',
	'MID1_Mage_Frost_Frostfire',
	"MID1_Death_Knight_Unholy_San'layn",
	'MID1_Death_Knight_Unholy',
	'MID1_Shaman_Enhancement_Stormbringer'
];

describe('parseSimcPaste', () => {
	it('reads rating lines and matches frost mage', () => {
		const text = `
# Mage "Test" - Frost
mage="Test"
spec=frost
crit_rating=700
haste_rating=650
mastery_rating=800
versatility_rating=400
primary_stat=1800
`;
		const parsed = parseSimcPaste(text, SPEC_KEYS);
		expect(parsed.matchedSpecKey).toBe('MID1_Mage_Frost');
		expect(parsed.stats.crit).toBe(700);
		expect(parsed.stats.primary_stat).toBe(1800);
		expect(parsed.statsFound.length).toBe(5);
	});

	it('warns when only item lines are present', () => {
		const text = `
mage="Test"
spec=frost
head=,id=12345,bonus_id=1
chest=,id=999
`;
		const parsed = parseSimcPaste(text, SPEC_KEYS);
		expect(parsed.hasItemLines).toBe(true);
		expect(parsed.warnings.some((w) => /item→stats/i.test(w))).toBe(true);
	});
});

describe('matchSpecKey', () => {
	it('prefers base frost over hero when hero omitted', () => {
		expect(matchSpecKey(SPEC_KEYS, { classToken: 'mage', specToken: 'frost' })).toBe(
			'MID1_Mage_Frost'
		);
	});

	it('matches multi-word class + hero', () => {
		expect(
			matchSpecKey(SPEC_KEYS, {
				classToken: 'deathknight',
				specToken: 'unholy',
				heroToken: 'sanlayn'
			})
		).toBe("MID1_Death_Knight_Unholy_San'layn");
	});
});
