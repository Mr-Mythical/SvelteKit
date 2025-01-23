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

export interface FightsResponse {
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
