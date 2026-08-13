import { describe, expect, it } from 'vitest';
import { parseAddonExport } from '../export';
import { EXPORT_SCHEMA_VERSION } from '../types';

const SAMPLE = {
	schemaVersion: EXPORT_SCHEMA_VERSION,
	exportedAt: '2026-07-23T12:00:00Z',
	addonVersion: '1.2.3',
	profileKey: 'MID1_Mage_Frost',
	character: { name: 'Test', realm: 'Area 52', classToken: 'MAGE' },
	stats: {
		primary_stat: 1800,
		crit: 700,
		haste: 650,
		mastery: 800,
		versatility: 400
	},
	equipped: [
		{
			key: 'eq:1',
			link: '|cff0070dd|Hitem:12345::::::::80::::::::::|h[Helm]|h|r',
			itemId: 12345,
			name: 'Helm',
			slotId: 1,
			equipLoc: 'INVTYPE_HEAD',
			source: 'equipped',
			stats: { primary_stat: 200, crit: 50, haste: 40, mastery: 30, versatility: 20 }
		}
	],
	bags: [
		{
			key: 'bag:0:1',
			link: '|cff0070dd|Hitem:22222::::::::80::::::::::|h[Better Helm]|h|r',
			itemId: 22222,
			name: 'Better Helm',
			equipLoc: 'INVTYPE_HEAD',
			source: 'bag',
			stats: { primary_stat: 250, crit: 60, haste: 50, mastery: 40, versatility: 25 }
		}
	],
	vault: [
		{
			key: 'vault:1:33333',
			link: '|cffa335ee|Hitem:33333::::::::80::::::::::|h[Vault Shoulders]|h|r',
			itemId: 33333,
			name: 'Vault Shoulders',
			equipLoc: 'INVTYPE_SHOULDER',
			source: 'vault',
			vaultActivityId: 1,
			stats: { primary_stat: 220, crit: 55, haste: 45, mastery: 35, versatility: 22 }
		}
	],
	notes: { vaultNote: null }
};

describe('parseAddonExport', () => {
	it('parses v1 export into CharacterState', () => {
		const result = parseAddonExport(JSON.stringify(SAMPLE));
		expect(result.ok).toBe(true);
		expect(result.state?.profileKey).toBe('MID1_Mage_Frost');
		expect(result.state?.stats.crit).toBe(700);
		expect(result.state?.equipped).toHaveLength(1);
		expect(result.state?.bags).toHaveLength(1);
		expect(result.state?.vault).toHaveLength(1);
		expect(result.state?.exportMeta?.schemaVersion).toBe(1);
	});

	it('accepts snake_case field aliases', () => {
		const raw = {
			schema_version: 1,
			profile_key: 'MID1_Mage_Frost',
			stats: SAMPLE.stats,
			equipped: [
				{
					key: 'eq:5',
					link: 'item:1',
					item_id: 1,
					slot_id: 5,
					equip_loc: 'INVTYPE_CHEST',
					source: 'equipped',
					stats: SAMPLE.stats
				}
			],
			bags: [],
			vault: []
		};
		const result = parseAddonExport(raw);
		expect(result.ok).toBe(true);
		expect(result.state?.equipped[0]?.slotId).toBe(5);
		expect(result.state?.equipped[0]?.equipLoc).toBe('INVTYPE_CHEST');
	});

	it('rejects unsupported schema versions', () => {
		const result = parseAddonExport({ schemaVersion: 99, stats: SAMPLE.stats });
		expect(result.ok).toBe(false);
		expect(result.error).toMatch(/Unsupported/);
	});

	it('fails on invalid JSON string', () => {
		const result = parseAddonExport('{not json');
		expect(result.ok).toBe(false);
	});
});
