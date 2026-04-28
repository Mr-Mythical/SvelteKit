/**
 * Composition layer for the recent-reports store.
 *
 * Mirrors `recentCharacters.ts`: API backend first, fall back to localStorage
 * only when the API is *unavailable* (network/5xx). 401 means anonymous and
 * we deliberately don't mirror so the user doesn't accidentally persist.
 *
 * The `source` store signals which backend supplied the current data so the
 * UI can flag a degraded state (e.g. "(offline)" indicator) instead of
 * silently swapping data sources.
 */
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import {
	apiRecentReportsBackend,
	localStorageRecentReportsBackend,
	type RecentReport
} from './recentReportsBackends';

export type { RecentReport };

export type RecentReportsSource = 'api' | 'local-storage' | null;

function createRecentReportsStore() {
	const { subscribe, set } = writable<RecentReport[]>([]);
	const { subscribe: subscribeLoading, set: setLoading } = writable<boolean>(false);
	const { subscribe: subscribeSource, set: setSource } = writable<RecentReportsSource>(null);

	async function loadFromApiOrFallback() {
		const apiReports = await apiRecentReportsBackend.load();
		if (apiReports) {
			set(apiReports);
			setSource('api');
			return;
		}
		const localReports = await localStorageRecentReportsBackend.load();
		if (localReports) {
			set(localReports);
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

	async function addReport(
		code: string,
		title: string,
		guild: { name: string } | undefined,
		owner: { name: string }
	) {
		if (!browser) return;
		const report: RecentReport = { code, timestamp: Date.now(), title, guild, owner };
		setLoading(true);
		try {
			const apiResult = await apiRecentReportsBackend.add(report);

			if (apiResult.status === 'ok') {
				await loadFromApiOrFallback();
				return;
			}

			if (apiResult.status === 'unauthorized') {
				// Anonymous user: don't mirror to localStorage.
				return;
			}

			const localResult = await localStorageRecentReportsBackend.add(report);
			if (localResult.status === 'ok' && localResult.reports) {
				set(localResult.reports);
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
		addReport,
		clear: () => {
			set([]);
			setSource(null);
		}
	};
}

export const recentReports = createRecentReportsStore();
