import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export interface CurrentState {
	urlParams: string; // The complete query string (e.g., "runs=ARAK152EDA121" or "char=Player&region=us&realm=stormrage")
	timestamp: number;
}

function createCurrentStateStore() {
	const { subscribe, set } = writable<CurrentState | null>(null);
	const { subscribe: subscribeLoading, set: setLoading } = writable<boolean>(false);

	// Load current state from API
	async function loadFromAPI(): Promise<CurrentState | null> {
		if (!browser) return null;

		setLoading(true);
		try {
			const response = await fetch('/api/current-state');

			if (response.ok) {
				const state = await response.json();
				if (state) {
					set(state);
					return state;
				}
			} else {
				console.error('Failed to load state:', response.status, response.statusText);
			}
		} catch (error) {
			console.error('Error loading current state from API:', error);
		} finally {
			setLoading(false);
		}
		return null;
	}

	// Save current state to API
	function saveToAPI(urlParams: string) {
		if (!browser) return;

		const doSave = async () => {
			try {
				const response = await fetch('/api/current-state', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ urlParams })
				});

				if (!response.ok) {
					const errorText = await response.text();
					console.error('Failed to save current state:', {
						status: response.status,
						statusText: response.statusText,
						error: errorText
					});
				}
			} catch (error) {
				console.error('Error saving current state:', error);
			}
		};

		doSave();
	}

	return {
		subscribe,
		loading: { subscribe: subscribeLoading },
		load: loadFromAPI,
		save: saveToAPI,
		clear: () => set(null)
	};
}

export const currentState = createCurrentStateStore();
