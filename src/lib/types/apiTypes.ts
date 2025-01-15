export interface Fight {
	id: number;
	name: string;
	startTime: number;
	endTime: number;
	encounterID: number;
	kill: boolean;
	bossPercentage: number;
	difficulty: number;
}

export interface FightsResponse {
	data: {
		reportData: {
			report: {
				fights: Fight[];
			};
		};
	};
	errors?: any;
}

export interface AccessToken {
	token: string;
	expiresIn: number;
	obtainedAt: number;
}

export interface ReportData {
	data: {
		reportData: {
			report: {
				graph: {
					data: GraphData;
				};
			};
		};
	};
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
	data: number[];
}

export interface RaiderIoRun {
	dungeon: string;
	short_name: string;
	mythic_level: number;
	par_time_ms: number;
	num_keystone_upgrades: number;
	score: number;
}
