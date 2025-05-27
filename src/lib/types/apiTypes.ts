export interface ApiResponse<T> {
	data: {
		reportData: {
			report: T;
		};
	};
}

export interface Fight {
	id: number;
	name: string;
	startTime: number;
	endTime: number;
	encounterID: number;
	kill: boolean | null;
	bossPercentage: number;
	difficulty: number;
}

export interface ReportOwner {
	name: string;
}

export interface ReportGuild {
	name: string;
}

export interface FightsAndReportInfoResponse {
	title: string;
	owner: ReportOwner
	guild: ReportGuild | null; // Null means its a personal report
	fights: Fight[];
}

export interface Player {
	name: string;
	id: number;
	guid: number;
	type: string;
	server: string;
	icon: string;
	specs: Spec[];
	minItemLevel: number;
	maxItemLevel: number;
	potionUse: number;
	healthstoneUse: number;
	combatantInfo: [];
}

export interface Spec {
	spec: string;
	count: number;
}

export interface PlayerDetails {
	dps: Player[];
	tanks: Player[];
	healers: Player[];
}

export interface PlayerDetailsResponse {
	playerDetails: PlayerDetails;
}

export interface GraphData {
	series: Series[];
	startTime: number;
	endTime: number;
}

export interface Series {
	name: string;
	id: number | string;
	guid?: number;
	type: string;
	pointStart: number;
	pointInterval: number;
	total?: number;
	data: number[];
}

export interface GraphResponse {
	graph: {
		data: GraphData;
	};
}

export interface CastEvent {
	timestamp: number;
	type: 'cast';
	sourceID: number;
	targetID: number;
	abilityGameID: number;
	fight: number;
}

export interface EventsResponse {
	events: {
		data: CastEvent[];
		nextPageTimestamp: number | null;
	};
}

export interface FullReport {
	fights: Fight[];
	playerDetails: PlayerDetails;
	graph: GraphData;
	events: EventsResponse;
}

export interface RaiderIoRun {
	dungeon: string;
	short_name: string;
	mythic_level: number;
	par_time_ms: number;
	num_keystone_upgrades: number;
	score: number;
}

export interface AccessToken {
	token: string;
	expiresIn: number;
	obtainedAt: number;
}

export interface TemporalAverage {
	percentile: number;
	avg: number;
	stddev: number;
	samples: number;
}

export interface BrowseLogsParams {
	bossId?: number;         // Corresponds to healer_compositions.encounter_id
	minDuration?: number;    // In seconds (frontend)
	maxDuration?: number;    // In seconds (frontend)
	healerSpecs?: string[];  // Array of "ClassName-SpecName" strings, e.g., ["Druid-Restoration"]
	page?: number;           // For pagination
	limit?: number;          // For pagination
}

export interface BrowsedLog {
	log_code: string;         // From healer_compositions.report_code
	title: string;            // Derived from encounter_name or guild_name
	boss_name: string;        // Derived from encounter_id using bossData.ts or encounter_name
	duration_seconds: number; // Calculated from healer_compositions.duration_ms
	healer_composition: string[]; // Array of "ClassName-SpecName" from healer_specs.spec_icon
	log_url?: string;         // Constructed URL to Warcraft Logs
	fight_id: number;         // From healer_compositions.fight_id
	start_time: number;       // From healer_compositions.report_absolute_start_time_ms
	end_time: number;         // Calculated from start_time + duration_ms
}

export interface BrowseLogsResponse {
	logs: BrowsedLog[];
	total: number;            // Total number of logs matching the filters
	page: number;             // Current page number
	limit: number;            // Number of items per page
}
