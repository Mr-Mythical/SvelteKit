export const dungeonCount = 8;

export interface Run {
	dungeon: string;
	short_name: string;
	mythic_level: number;
	par_time_ms: number;
	num_keystone_upgrades: number;
	score: number;
}

/** Midnight Season 2 Mythic+ pool (short names match MrMythical SHORT_NAMES). */
export const dungeons = [
	{ value: 'Altar of Fangs', label: 'Altar of Fangs', short_name: 'AOF' },
	{ value: 'The Blinding Vale', label: 'The Blinding Vale', short_name: 'BV' },
	{ value: 'Den of Nalorakk', label: 'Den of Nalorakk', short_name: 'DON' },
	{ value: "Kings' Rest", label: "Kings' Rest", short_name: 'KR' },
	{ value: 'Murder Row', label: 'Murder Row', short_name: 'MR' },
	{ value: 'Ruby Life Pools', label: 'Ruby Life Pools', short_name: 'RLP' },
	{ value: 'Temple of Sethraliss', label: 'Temple of Sethraliss', short_name: 'TOS' },
	{ value: 'Voidscar Arena', label: 'Voidscar Arena', short_name: 'VA' }
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
