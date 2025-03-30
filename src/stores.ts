import { writable } from 'svelte/store';
import { Dungeons } from '$lib/types/dungeons';import type { BlizzardCharacterFull } from '$lib/types/blizzardFull';

export const wowSummaryStore = writable<BlizzardCharacterFull | null>(null);
export const apiPopup = writable(false);
export const dungeonData = writable(new Dungeons());
