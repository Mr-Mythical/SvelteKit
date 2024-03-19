// Purpose: Model for dungeons data.

export const dungeonCount = 8;

export interface Run {
    dungeon: string;
    mythicLevel: number;
    clearTime: number;
    parTime: number;
    numKeystoneUpgrades: number;
    score: number;
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
                dungeon: String(i + 1),
                mythicLevel: 0,
                clearTime: 0,
                parTime: 0,
                numKeystoneUpgrades: 1,
                score: 0
            });

            this.tyrannical.push({
                dungeon: String(i + 1),
                mythicLevel: 0,
                clearTime: 0,
                parTime: 0,
                numKeystoneUpgrades: 1,
                score: 0
            });
        }
    }
}
