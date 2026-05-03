import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface MyWowCharacter {
	characterName: string;
	realm: string;
	realmName: string;
	region: 'us' | 'eu' | 'kr' | 'tw';
	level: number;
	className: string | null;
	raceName: string | null;
	faction: 'ALLIANCE' | 'HORDE' | null;
	score?: number | null;
	scoreColor?: string | null;
}

export type MyWowCharactersState = {
	characters: MyWowCharacter[];
	hasScope: boolean;
	hasAccount: boolean;
	stale: boolean;
	loaded: boolean;
};

const initialState: MyWowCharactersState = {
	characters: [],
	hasScope: false,
	hasAccount: false,
	stale: false,
	loaded: false
};

function createMyWowCharacters() {
	const { subscribe, set, update } = writable<MyWowCharactersState>(initialState);
	const loading = writable<boolean>(false);

	async function load(options: { refresh?: boolean } = {}) {
		if (!browser) return;
		loading.set(true);
		try {
			const query = options.refresh ? '?refresh=1' : '';
			const response = await fetch(`/api/my-wow-characters${query}`);
			if (!response.ok) {
				update((s) => ({ ...s, loaded: true }));
				return;
			}
			const data = (await response.json()) as {
				characters: MyWowCharacter[];
				hasScope: boolean;
				hasAccount: boolean;
				stale: boolean;
			};
			set({ ...data, loaded: true });
		} catch (error) {
			console.error('myWowCharacters: load failed', error);
			update((s) => ({ ...s, loaded: true }));
		} finally {
			loading.set(false);
		}
	}

	return {
		subscribe,
		loading: { subscribe: loading.subscribe },
		init: () => load(),
		refresh: () => load({ refresh: true }),
		reset: () => set(initialState)
	};
}

export const myWowCharacters = createMyWowCharacters();
