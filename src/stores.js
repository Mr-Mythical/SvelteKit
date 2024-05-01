import {writable} from 'svelte/store';
import { Dungeons } from '$lib/models/dungeons';

export const apiPopup = writable(false);
export const dungeonData = writable(new Dungeons());
