/**
 * Composition layer for the recent-characters store.
 *
 * This file owns the Svelte stores (list + loading flag + source flag) and
 * the fallback policy: try the API backend first, and only fall back to
 * localStorage when the API is *unavailable* (network error / 5xx). A 401
 * means the user isn't signed in and we deliberately do *not* mirror to
 * localStorage.
 *
 * The `source` store signals which backend supplied the current data so the
 * UI can flag a degraded state (e.g. "(offline)" indicator) instead of
 * silently swapping data sources.
 *
 * Persistence implementations live in `recentCharactersBackends.ts`. This
 * module never reaches into `fetch` or `localStorage` directly.
 */
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import {
	apiRecentCharactersBackend,
	localStorageRecentCharactersBackend,
	type RecentCharacter
} from './recentCharactersBackends';

export type { RecentCharacter };

export type RecentCharactersSource = 'api' | 'local-storage' | null;

function createRecentCharacters() {
	const { subscribe, set } = writable<RecentCharacter[]>([]);
	const { subscribe: subscribeLoading, set: setLoading } = writable<boolean>(false);
	const { subscribe: subscribeSource, set: setSource } = writable<RecentCharactersSource>(null);

	async function loadFromApiOrFallback() {
		const apiCharacters = await apiRecentCharactersBackend.load();
		if (apiCharacters) {
			set(apiCharacters);
			setSource('api');
			return;
		}
		const localCharacters = await localStorageRecentCharactersBackend.load();
		if (localCharacters) {
			set(localCharacters);
			setSource('local-storage');
		}
	}

	async function init() {
		if (!browser) return;
		setLoading(true);
		try {
			await loadFromApiOrFallback();
		} finally {
			setLoading(false);
		}
	}

	async function add(character: RecentCharacter) {
		if (!browser) return;
		setLoading(true);
		try {
			const apiResult = await apiRecentCharactersBackend.add(character);

			if (apiResult.status === 'ok') {
				await loadFromApiOrFallback();
				return;
			}

			if (apiResult.status === 'unauthorized') {
				// Anonymous user: don't mirror to localStorage.
				return;
			}

			// API unavailable — fall back to localStorage so the user still has
			// their recents next page load.
			const localResult = await localStorageRecentCharactersBackend.add(character);
			if (localResult.status === 'ok' && localResult.characters) {
				set(localResult.characters);
				setSource('local-storage');
			}
		} finally {
			setLoading(false);
		}
	}

	return {
		subscribe,
		loading: { subscribe: subscribeLoading },
		source: { subscribe: subscribeSource },
		init,
		add,
		clear: () => {
			set([]);
			setSource(null);
		}
	};
}

export const recentCharacters = createRecentCharacters();
