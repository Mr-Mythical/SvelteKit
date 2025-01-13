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

interface ReportData {
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
  
  interface GraphData {
	series: Series[];
	startTime: number;
	endTime: number;
  }
  
  interface Series {
	name: string;
	id: number | string;
	guid?: number;
	type: string;
	pointStart: number;
	pointInterval: number;
	data: number[];
  }
  
  
