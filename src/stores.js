import {writable} from 'svelte/store';
import { Dungeons } from '$lib/types/dungeons';

export const apiPopup = writable(false);
export const dungeonData = writable(new Dungeons());
