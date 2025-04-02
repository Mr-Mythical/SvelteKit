import { writable } from 'svelte/store';

export interface RecentCharacter {
	region: string;
	realm: string;
	characterName: string;
}

function createRecentCharacters() {
	let initial: RecentCharacter[] = [];
	if (typeof localStorage !== 'undefined') {
		const stored = localStorage.getItem('recentCharacters');
		if (stored) {
			try {
				initial = JSON.parse(stored);
			} catch (error) {
				console.error('Error parsing recent characters from localStorage', error);
			}
		}
	}

	const { subscribe, update } = writable<RecentCharacter[]>(initial);

	subscribe((value) => {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('recentCharacters', JSON.stringify(value));
		}
	});

	return {
		subscribe,
		add: (character: RecentCharacter) =>
			update((chars) => {
				const filtered = chars.filter(
					(c) =>
						!(c.region === character.region &&
						  c.realm === character.realm &&
						  c.characterName.toLowerCase() === character.characterName.toLowerCase())
				);
				filtered.unshift(character);
				return filtered.slice(0, 5);
			}),
		clear: () => update(() => [])
	};
}

export const recentCharacters = createRecentCharacters();
