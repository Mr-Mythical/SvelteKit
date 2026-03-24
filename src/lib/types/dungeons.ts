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
	{ value: "Algeth'ar Academy", label: "Algeth'ar Academy", short_name: 'AA' },
	{ value: "Magisters' Terrace", label: "Magisters' Terrace", short_name: 'MT' },
	{ value: 'Maisara Caverns', label: 'Maisara Caverns', short_name: 'MC' },
	{ value: 'Nexus-Point Xenas', label: 'Nexus-Point Xenas', short_name: 'NPX' },
	{ value: 'Pit of Saron', label: 'Pit of Saron', short_name: 'POS' },
	{ value: 'Seat of the Triumvirate', label: 'Seat of the Triumvirate', short_name: 'SEAT' },
	{ value: 'Skyreach', label: 'Skyreach', short_name: 'SR' },
	{ value: 'Windrunner Spire', label: 'Windrunner Spire', short_name: 'WS' }
];

export class Dungeons {
	runs: Run[];
	constructor() {
		this.runs = [];
		for (let i = 0; i < dungeonCount; i++) {
			this.runs.push({
				dungeon: dungeons[i].value,
				short_name: dungeons[i].short_name,
				mythic_level: 0,
				par_time_ms: 0,
				num_keystone_upgrades: 1,
				score: 0
			});
		}
	}
}
