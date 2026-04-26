// src/lib/utils/characterData.ts
//
// Framework-agnostic data fetchers for character data. These return raw,
// normalized data objects and *do not* import any Svelte stores or UI helpers
// (toast / popup state). Callers in the component layer wire the result into
// stores or UI feedback as appropriate.
import { dungeonCount } from '$lib/types/dungeons';
import type { RaiderIoRun } from '$lib/types/apiTypes';

export interface DungeonRun {
	dungeon: string;
	short_name: string;
	mythic_level: number;
	par_time_ms: number;
	num_keystone_upgrades: number;
	score: number;
}

export const EMPTY_DUNGEON_RUN: DungeonRun = {
	dungeon: '',
	short_name: '',
	mythic_level: 0,
	par_time_ms: 0,
	num_keystone_upgrades: 0,
	score: 0
};

export function emptyDungeonRuns(): DungeonRun[] {
	return Array.from({ length: dungeonCount }, () => ({ ...EMPTY_DUNGEON_RUN }));
}

export type FetchRunsResult =
	| { kind: 'ok'; runs: DungeonRun[] }
	| { kind: 'empty' }
	| { kind: 'error'; status: number };

/**
 * Fetch Mythic+ runs from `/api/raiderio` for the given character.
 * Returns a discriminated union — the caller decides whether to toast or
 * update a store. Pure (other than the fetch itself) and store-free.
 *
 * @throws Never — network failures are surfaced as `{ kind: 'error', status: 0 }`.
 */
export async function fetchRuns(
	region: string,
	realm: string,
	characterName: string
): Promise<FetchRunsResult> {
	const url =
		`/api/raiderio?name=${encodeURIComponent(characterName)}` +
		`&region=${encodeURIComponent(region)}` +
		`&realm=${encodeURIComponent(realm)}`;

	let response: Response;
	try {
		response = await fetch(url);
	} catch {
		return { kind: 'error', status: 0 };
	}

	if (!response.ok) {
		return { kind: 'error', status: response.status };
	}

	const data = (await response.json()) as { runs?: RaiderIoRun[] };
	if (!data.runs?.length) return { kind: 'empty' };

	const mappedRuns: DungeonRun[] = data.runs.slice(0, dungeonCount).map((run) => ({
		dungeon: run.dungeon,
		short_name: run.short_name || '',
		mythic_level: run.mythic_level || 0,
		par_time_ms: run.par_time_ms || 0,
		num_keystone_upgrades: run.num_keystone_upgrades || 0,
		score: run.score || 0
	}));

	while (mappedRuns.length < dungeonCount) {
		mappedRuns.push({ ...EMPTY_DUNGEON_RUN });
	}

	return { kind: 'ok', runs: mappedRuns };
}

export type FetchWowSummaryResult<T = unknown> =
	| { kind: 'ok'; summary: T }
	| { kind: 'error'; status: number };

/**
 * Fetch Blizzard WoW character summary from `/api/blizzard`. Returns the
 * raw summary payload on success; callers decide whether to update a store.
 *
 * @throws Never — non-OK responses are surfaced as `{ kind: 'error' }`.
 */
export async function fetchWowSummary<T = unknown>(
	region: string,
	realm: string,
	characterName: string
): Promise<FetchWowSummaryResult<T>> {
	const url = `/api/blizzard?name=${encodeURIComponent(characterName)}&region=${encodeURIComponent(region)}&realm=${encodeURIComponent(realm)}`;

	let response: Response;
	try {
		response = await fetch(url);
	} catch {
		return { kind: 'error', status: 0 };
	}

	if (!response.ok) {
		return { kind: 'error', status: response.status };
	}

	const summary = (await response.json()) as T;
	return { kind: 'ok', summary };
}
