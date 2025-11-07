import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface RecentReport {
	code: string;
	timestamp: number;
	title: string;
	guild?: { name: string };
	owner: { name: string };
}

const STORAGE_KEY = 'recentReports';
const MAX_REPORTS = 6;

function createRecentReportsStore() {
	const { subscribe, set } = writable<RecentReport[]>([]);
	const { subscribe: subscribeLoading, set: setLoading } = writable<boolean>(false);

	// Load from API if in browser
	async function loadFromAPI() {
		if (!browser) return;

		setLoading(true);
		try {
			const response = await fetch('/api/recent-reports');
			if (response.ok) {
				const reports = await response.json();
				set(reports);
			}
		} catch (error) {
			console.error('Error loading recent reports from API:', error);
			// Fallback to localStorage on error
			loadFromLocalStorage();
		} finally {
			setLoading(false);
		}
	}

	// Fallback: Load from localStorage (for migration period)
	function loadFromLocalStorage() {
		if (!browser) return;

		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			try {
				const reports = JSON.parse(stored);
				set(reports);
			} catch (error) {
				console.error('Error parsing recent reports from localStorage', error);
			}
		}
	}

	return {
		subscribe,
		loading: { subscribe: subscribeLoading },
		init: loadFromAPI,
		addReport: async (
			code: string,
			title: string,
			guild: { name: string } | undefined,
			owner: { name: string }
		) => {
			setLoading(true);
			try {
				// Send to API
				const response = await fetch('/api/recent-reports', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ code, title, guild, owner })
				});

				if (response.ok) {
					// Reload from API to get updated list
					await loadFromAPI();
				} else {
					console.error('Failed to add report to API');
					// Fallback to localStorage
					addToLocalStorage(code, title, guild, owner);
				}
			} catch (error) {
				console.error('Error adding report to API:', error);
				// Fallback to localStorage
				addToLocalStorage(code, title, guild, owner);
			} finally {
				setLoading(false);
			}
		},
		clear: () => set([])
	};

	// Fallback: Add to localStorage
	function addToLocalStorage(
		code: string,
		title: string,
		guild: { name: string } | undefined,
		owner: { name: string }
	) {
		if (!browser) return;

		const stored = localStorage.getItem(STORAGE_KEY) || '[]';
		try {
			const reports = JSON.parse(stored);
			const newReports = reports.filter((r: RecentReport) => r.code !== code);
			newReports.unshift({
				code,
				timestamp: Date.now(),
				title,
				guild,
				owner
			});

			if (newReports.length > MAX_REPORTS) {
				newReports.pop();
			}

			localStorage.setItem(STORAGE_KEY, JSON.stringify(newReports));
			set(newReports);
		} catch (error) {
			console.error('Error saving to localStorage:', error);
		} finally {
			setLoading(false);
		}
	}
}

export const recentReports = createRecentReportsStore();
