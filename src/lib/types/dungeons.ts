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
	{ value: 'The Dawnbreaker', label: 'The Dawnbreaker' },
	{ value: 'Ara-Kara, City of Echoes', label: 'Ara-Kara, City of Echoes' },
	{ value: 'Mists of Tirna Scithe', label: 'Mists of Tirna Scithe' },
	{ value: 'The Necrotic Wake', label: 'The Necrotic Wake' },
	{ value: 'The Stonevault', label: 'The Stonevault' },
	{ value: 'Siege of Boralus', label: 'Siege of Boralus' },
	{ value: 'Grim Batol', label: 'Grim Batol' },
	{ value: 'City of Threads', label: 'City of Threads' }
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
