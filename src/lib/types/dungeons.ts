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
	{ value: 'Ara-Kara, City of Echoes', label: 'Ara-Kara, City of Echoes', short_name: 'ARAK' },
	{ value: "Eco-Dome Al'dani", label: "Eco-Dome Al'dani", short_name: 'EDA' },
	{ value: 'Halls of Atonement', label: 'Halls of Atonement', short_name: 'HOA' },
	{ value: 'Operation: Floodgate', label: 'Operation: Floodgate', short_name: 'FLOOD' },
	{ value: 'Priory of the Sacred Flame', label: 'Priory of the Sacred Flame', short_name: 'PSF' },
	{ value: "Tazavesh: So'leah's Gambit", label: "Tazavesh: So'leah's Gambit", short_name: 'GMBT' },
	{
		value: 'Tazavesh: Streets of Wonder',
		label: 'Tazavesh: Streets of Wonder',
		short_name: 'STRT'
	},
	{ value: 'The Dawnbreaker', label: 'The Dawnbreaker', short_name: 'DAWN' }
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
