/** Types for SimC-factory validation export (ValidationData.lua / snapshot JSON). */

export type ValidationOverall = {
	upgrade_picks_pct: number;
	upgrade_size_error_pct: number;
	dps_read_error_pct: number;
	scored_pairs: number;
	spec_count: number;
};

export type ValidationSpecRow = {
	upgrade_picks_pct: number;
	upgrade_size_error_pct: number;
	dps_read_error_pct: number;
	n_scored_pairs: number;
	n_tie_pairs: number;
};

export type ValidationExport = {
	has_data: boolean;
	run_id: string;
	checked_at: string;
	checked_label: string;
	status: string;
	confirmed_at?: string;
	confirmed_label?: string;
	is_full_run: boolean;
	is_current: boolean;
	overall: ValidationOverall;
	by_spec: Record<string, ValidationSpecRow>;
};

export type ValidationSpecDisplay = ValidationSpecRow & {
	profileKey: string;
	className: string;
	specName: string;
	heroTalent: string | null;
	label: string;
};

export const VALIDATION_METRIC_COPY = {
	upgrade_picks: {
		label: 'Upgrade picks',
		hint: 'On a real gear swap, does the addon pick the same winner as a full SimulationCraft sim? Tiny gaps that the sim cannot call are skipped.'
	},
	gap_error: {
		label: 'Gap error',
		hint: 'How far off the predicted DPS difference is from the sim. That is the +X DPS you see when comparing two items, as a percent of your DPS.'
	},
	dps_read_error: {
		label: 'DPS read error',
		hint: 'At one gear set with no swap, how far off is the predicted DPS number from a full sim?'
	}
} as const;
