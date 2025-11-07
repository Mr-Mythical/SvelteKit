import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export interface RecentCharacter {
	region: string;
	realm: string;
	characterName: string;
}

function createRecentCharacters() {
	const { subscribe, set } = writable<RecentCharacter[]>([]);
	const { subscribe: subscribeLoading, set: setLoading } = writable<boolean>(false);

	// Load from API if in browser
	async function loadFromAPI() {
		if (!browser) return;
		
		setLoading(true);
		try {
			const response = await fetch('/api/recent-characters');
			if (response.ok) {
				const characters = await response.json();
				set(characters);
			}
		} catch (error) {
			console.error('Error loading recent characters from API:', error);
			// Fallback to localStorage on error
			loadFromLocalStorage();
		} finally {
			setLoading(false);
		}
	}

	// Fallback: Load from localStorage (for migration period)
	function loadFromLocalStorage() {
		if (!browser) return;
		
		const stored = localStorage.getItem('recentCharacters');
		if (stored) {
			try {
				const characters = JSON.parse(stored);
				set(characters);
			} catch (error) {
				console.error('Error parsing recent characters from localStorage', error);
			}
		}
	}

	return {
		subscribe,
		loading: { subscribe: subscribeLoading },
		init: loadFromAPI,
		add: async (character: RecentCharacter) => {
			setLoading(true);
			try {
				// Send to API
				const response = await fetch('/api/recent-characters', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify(character)
				});

				if (response.ok) {
					// Reload from API to get updated list
					await loadFromAPI();
				} else {
					console.error('Failed to add character to API');
					// Fallback to localStorage
					addToLocalStorage(character);
				}
			} catch (error) {
				console.error('Error adding character to API:', error);
				// Fallback to localStorage
				addToLocalStorage(character);
			} finally {
				setLoading(false);
			}
		},
		clear: () => set([])
	};

	// Fallback: Add to localStorage
	function addToLocalStorage(character: RecentCharacter) {
		if (!browser) return;
		
		const stored = localStorage.getItem('recentCharacters') || '[]';
		try {
			const characters = JSON.parse(stored);
			const existing = characters.findIndex(
				(c: RecentCharacter) =>
					c.region === character.region &&
					c.realm === character.realm &&
					c.characterName.toLowerCase() === character.characterName.toLowerCase()
			);

			if (existing !== -1) {
				characters.splice(existing, 1);
			}

			characters.unshift(character);
			const trimmed = characters.slice(0, 5);
			
			localStorage.setItem('recentCharacters', JSON.stringify(trimmed));
			set(trimmed);
		} catch (error) {
			console.error('Error saving to localStorage:', error);
		} finally {
			setLoading(false);
		}
	}
}

export const recentCharacters = createRecentCharacters();
