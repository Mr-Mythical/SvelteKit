// Realm option lists for the four regions where Warcraft Logs / Raider.io
// publish data. The values used here are the realm slugs accepted by both
// APIs; the labels are display strings.
//
// The data lives in `realms.json` so that adding/removing realms is a pure
// data change with no code review of import statements or array brackets.
// Update path: edit `realms.json` (a tool can regenerate from Blizzard's
// GameData /data/wow/realm/index endpoint per region).
import realmsData from './realms.json';

export interface RealmOption {
	value: string;
	label: string;
}

interface RealmsJson {
	us: RealmOption[];
	eu: RealmOption[];
	tw: RealmOption[];
	kr: RealmOption[];
}

const data = realmsData as RealmsJson;

export const usRealmOptions: RealmOption[] = data.us;
export const euRealmOptions: RealmOption[] = data.eu;
export const twRealmOptions: RealmOption[] = data.tw;
export const krRealmOptions: RealmOption[] = data.kr;

export type Region = keyof RealmsJson;

export function realmsForRegion(region: Region): RealmOption[] {
	return data[region];
}
