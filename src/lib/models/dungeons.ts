export const dungeonCount = 8;

export interface Run {
    affixes: Affix[];
    dungeon: string;
    short_name: string;
    mythic_level: number;
    par_time_ms: number;
    num_keystone_upgrades: number;
    score: number;
}

export interface Affix {
    name: string;
}

export interface Dungeons {
    fortified: Run[];
    tyrannical: Run[];

    // Index Signature
    [key: string]: Run[] | undefined;
}

export class Dungeons {
    fortified: Run[];
    tyrannical: Run[];
    constructor() {
        this.fortified = [];
        this.tyrannical = [];

        for (let i = 0; i < dungeonCount; i++) {
            this.fortified.push({
                affixes: [{ name: '' }],
                dungeon: String(i + 1),
                short_name: '',
                mythic_level: 0,
                par_time_ms: 0,
                num_keystone_upgrades: 1,
                score: 0
            });

            this.tyrannical.push({
                affixes: [{ name: '' }],
                dungeon: String(i + 1),
                short_name: '',
                mythic_level: 0,
                par_time_ms: 0,
                num_keystone_upgrades: 1,
                score: 0
            });
        }
    }
}
