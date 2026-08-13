import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	annotateTierFields,
	getTierPieceInfo,
	isOtherClassTierPiece,
	loadTierSetsFromJson
} from '../tier';

const here = dirname(fileURLToPath(import.meta.url));
const staticDir = join(here, '../../../../static/gearing');

beforeAll(() => {
	loadTierSetsFromJson(JSON.parse(readFileSync(join(staticDir, 'tier-sets-v1.json'), 'utf8')));
});

describe('tier-sets artifact', () => {
	it('loads Midnight Venomous Abyss pieces from published JSON', () => {
		expect(getTierPieceInfo(271565)?.matchKey).toBe('venomous-abyss-t1:MAGE');
		expect(getTierPieceInfo(271556)?.matchKey).toBe('venomous-abyss-t1:PRIEST');
		expect(getTierPieceInfo(250061)).toBeFalsy();
		expect(isOtherClassTierPiece(271565, 'WARRIOR')).toBe(true);
		expect(isOtherClassTierPiece(271565, 'MAGE')).toBe(false);
	});

	it('annotates gear pieces with tierMatchKey', () => {
		const tagged = annotateTierFields({
			itemId: 271565,
			link: 'item:271565'
		});
		expect(tagged.isTierPiece).toBe(true);
		expect(tagged.tierMatchKey).toBe('venomous-abyss-t1:MAGE');
	});
});
