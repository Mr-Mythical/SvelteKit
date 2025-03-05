export const dungeonCount = 8;

export interface Run {
	dungeon: string;
	short_name: string;
	mythic_level: number;
	par_time_ms: number;
	num_keystone_upgrades: number;
	score: number;
}

export const dungeons = [
	{ value: 'Cinderbrew Meadery', label: 'Cinderbrew Meadery' },
	{ value: 'Darkflame Cleft', label: 'Darkflame Cleft' },
	{ value: 'Mechagon Workshop', label: 'Mechagon Workshop' },
	{ value: 'Operation: Floodgate', label: 'Operation: Floodgate' },
	{ value: 'Priory of the Sacred Flame', label: 'Priory of the Sacred Flame' },
	{ value: 'The MOTHERLODE!!', label: 'The MOTHERLODE!!' },
	{ value: 'The Rookery', label: 'The Rookery' },
	{ value: 'Theater of Pain', label: 'Theater of Pain' }
];

export class Dungeons {
	runs: Run[];
	constructor() {
		this.runs = [];
		for (let i = 0; i < dungeonCount; i++) {
			this.runs.push({
				dungeon: dungeons[i].value,
				short_name: '',
				mythic_level: 0,
				par_time_ms: 0,
				num_keystone_upgrades: 1,
				score: 0
			});
		}
	}
}
