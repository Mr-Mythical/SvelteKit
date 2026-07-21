import { describe, expect, it } from 'vitest';
import { formatProfileKey } from '$lib/server/dpsValidation';
import { parseValidationLua } from '$lib/server/parseValidationLua';

describe('parseValidationLua', () => {
	it('parses overall and by_spec from ValidationData.lua shape', () => {
		const lua = `-- Auto-generated
local V = {}
V.has_data = true
V.run_id = "validate-test"
V.checked_label = "2026-07-21 00:09"
V.overall = {
  upgrade_picks_pct = 97.3,
  upgrade_size_error_pct = 0.236,
  dps_read_error_pct = 0.24,
  scored_pairs = 337,
  spec_count = 50,
}
V.by_spec = {
  ["MID1_Mage_Frost"] = {
    upgrade_picks_pct = 100,
    upgrade_size_error_pct = 0.707,
    dps_read_error_pct = 0.34,
    n_scored_pairs = 7,
    n_tie_pairs = 1,
  },
}
_G.MrMythicalValidationExport = V
`;
		const fields = parseValidationLua(lua);
		expect(fields.has_data).toBe(true);
		expect(fields.run_id).toBe('validate-test');
		expect(fields.overall).toMatchObject({
			upgrade_picks_pct: 97.3,
			scored_pairs: 337
		});
		expect((fields.by_spec as Record<string, unknown>)['MID1_Mage_Frost']).toMatchObject({
			upgrade_picks_pct: 100,
			n_tie_pairs: 1
		});
	});
});

describe('formatProfileKey', () => {
	it('formats multi-word classes and hero talents', () => {
		expect(formatProfileKey("MID1_Death_Knight_Unholy_San'layn")).toMatchObject({
			className: 'Death Knight',
			specName: 'Unholy',
			heroTalent: "San'layn",
			label: "Death Knight Unholy (San'layn)"
		});
		expect(formatProfileKey('MID1_Mage_Frost')).toMatchObject({
			className: 'Mage',
			specName: 'Frost',
			heroTalent: null,
			label: 'Mage Frost'
		});
	});
});
