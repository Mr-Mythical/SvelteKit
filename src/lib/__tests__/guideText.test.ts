import { describe, expect, it } from 'vitest';
import { parseGuideText, plainGuideText, spell, spellsFromText } from '$lib/guideText';

describe('guide text markers', () => {
	it('parses mixed prose and spell tokens', () => {
		expect(parseGuideText(`Stand in ${spell(1285623, 'Soulcoil Well')}.`)).toEqual([
			{ type: 'text', value: 'Stand in ' },
			{ type: 'spell', id: 1285623, name: 'Soulcoil Well' },
			{ type: 'text', value: '.' }
		]);
	});

	it('strips markers for JSON-LD and leaves names', () => {
		expect(plainGuideText(`Soak ${spell(1290516, 'Ravenous Feast')} once.`)).toBe(
			'Soak Ravenous Feast once.'
		);
	});

	it('collects unique spells in order', () => {
		expect(
			spellsFromText(
				`${spell(1288772, 'Soulcoil Rite')} then ${spell(1285623, 'Soulcoil Well')} then ${spell(1288772, 'Soulcoil Rite')}`
			)
		).toEqual([
			{ name: 'Soulcoil Rite', id: 1288772 },
			{ name: 'Soulcoil Well', id: 1285623 }
		]);
	});
});
