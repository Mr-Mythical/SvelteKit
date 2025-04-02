// src/lib/api/characterData.ts
import { dungeonData, apiPopup, wowSummaryStore } from '../../stores';
import { dungeonCount } from '$lib/types/dungeons';
import type { RaiderIoRun } from '$lib/types/apiTypes';
import { toast } from 'svelte-sonner';

function resetRuns() {
	const emptyRuns = Array.from({ length: dungeonCount }, () => ({
		dungeon: '',
		short_name: '',
		mythic_level: 0,
		par_time_ms: 0,
		num_keystone_upgrades: 0,
		score: 0
	}));
	dungeonData.set({ runs: emptyRuns });
}

/**
 * Fetches Raider.io mythic plus runs for a character and updates the dungeonData store.
 */
export async function fetchRuns(characterName: string, region: string, realm: string): Promise<void> {
	resetRuns();

	const url =
		`/api/raiderio?name=${encodeURIComponent(characterName)}` +
		`&region=${encodeURIComponent(region)}` +
		`&realm=${encodeURIComponent(realm)}`;

	const response = await fetch(url);

	if (response.ok) {
		const data = await response.json();
		if (data.runs?.length) {
			const mappedRuns = data.runs.slice(0, dungeonCount).map((run: RaiderIoRun) => ({
				dungeon: run.dungeon,
				short_name: run.short_name || '',
				mythic_level: run.mythic_level || 0,
				par_time_ms: run.par_time_ms || 0,
				num_keystone_upgrades: run.num_keystone_upgrades || 0,
				score: run.score || 0
			}));
			while (mappedRuns.length < dungeonCount) {
				mappedRuns.push({
					dungeon: '',
					short_name: '',
					mythic_level: 0,
					par_time_ms: 0,
					num_keystone_upgrades: 0,
					score: 0
				});
			}
			dungeonData.set({ runs: mappedRuns });
			toast.success('Runs fetched successfully.');
		} else {
			toast.error('No runs found for this character.');
		}
		apiPopup.set(false);
	} else {
		console.error('Error fetching Raider.io data:', response.status);
		toast.error('Failed to fetch data from Raider.io');
	}
}

/**
 * Fetches Blizzard WoW character summary (including media) for a character and updates the wowSummaryStore.
 */
export async function fetchWowSummary(characterName: string, region: string, realm: string): Promise<void> {
	const url = `/api/blizzard?name=${encodeURIComponent(characterName)}&region=${encodeURIComponent(region)}&realm=${encodeURIComponent(realm)}`;
	const response = await fetch(url);

	if (response.ok) {
		const summaryData = await response.json();
		console.log('Fetched WoW Full Data:', summaryData);
		wowSummaryStore.set(summaryData);
	} else {
		console.error('Error fetching WoW character summary:', response.status);
	}
}
