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
	bossId?: number;        
	minDuration?: number;    
	maxDuration?: number;    
	healerSpecs?: string[];  
	page?: number;           
	limit?: number;        
}

export interface BrowsedLog {
	log_code: string;         
	title: string;           
	boss_name: string;        
	duration_seconds: number; 
	healer_composition: string[];
	log_url?: string;        
	fight_id: number;       
	start_time: number;      
	end_time: number;        
}

export interface BrowseLogsResponse {
	logs: BrowsedLog[];
	total: number;           
	page: number;           
	limit: number;          
}
