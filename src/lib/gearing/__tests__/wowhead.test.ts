import { describe, expect, it } from 'vitest';
import {
	bonusIdsFromLink,
	wowheadItemDataAttr,
	wowheadItemHref,
	wowheadItemRefFromPiece
} from '../wowhead';

describe('wowhead helpers', () => {
	it('parses compact item:id:bonus links', () => {
		expect(bonusIdsFromLink('item:237567:12804,12805')).toEqual([12804, 12805]);
		expect(bonusIdsFromLink('item:237567')).toEqual([]);
	});

	it('builds href and data-wowhead with bonus + ilvl', () => {
		const ref = wowheadItemRefFromPiece({
			itemId: 237567,
			link: 'item:237567:12804',
			ilvl: 276,
			name: 'Test Helm'
		});
		expect(ref).toMatchObject({ itemId: 237567, bonusIds: [12804], ilvl: 276 });
		expect(wowheadItemHref(ref!)).toContain('item=237567');
		expect(wowheadItemHref(ref!)).toContain('bonus=12804');
		expect(wowheadItemHref(ref!)).toContain('ilvl=276');
		expect(wowheadItemDataAttr(ref!)).toBe('item=237567&bonus=12804&ilvl=276');
	});
});
