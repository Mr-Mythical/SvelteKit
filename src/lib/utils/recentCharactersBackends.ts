/**
 * Recent characters: persistence backends.
 *
 * The store in `recentCharacters.ts` is a composition layer — it doesn't know
 * how the data is stored. Each backend here owns one persistence medium and
 * exposes the same minimal interface so the composition layer can swap or
 * fall back between them without leaking storage details.
 *
 * `add()` returns a discriminated status so the composition layer can react:
 * a 401 from the API backend is "user not signed in, don't fall back to
 * localStorage", but a network/5xx is "API is down, fall back".
 */

export interface RecentCharacter {
	region: string;
	realm: string;
	characterName: string;
}

export type AddOutcome =
	| { status: 'ok'; characters?: RecentCharacter[] }
	| { status: 'unauthorized' }
	| { status: 'unavailable' };

export interface RecentCharactersBackend {
	readonly name: 'api' | 'local-storage';
	load(): Promise<RecentCharacter[] | null>;
	add(character: RecentCharacter): Promise<AddOutcome>;
}

const LOCAL_STORAGE_KEY = 'recentCharacters';
const MAX_RECENT = 5;

export const apiRecentCharactersBackend: RecentCharactersBackend = {
	name: 'api',
	async load() {
		try {
			const response = await fetch('/api/recent-characters');
			if (!response.ok) return null;
			return (await response.json()) as RecentCharacter[];
		} catch (error) {
			console.error('Error loading recent characters from API:', error);
			return null;
		}
	},
	async add(character) {
		try {
			const response = await fetch('/api/recent-characters', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(character)
			});
			if (response.ok) return { status: 'ok' };
			if (response.status === 401) return { status: 'unauthorized' };
			console.error('Failed to add character to API (status', response.status, ')');
			return { status: 'unavailable' };
		} catch (error) {
			console.error('Error adding character to API:', error);
			return { status: 'unavailable' };
		}
	}
};

function readLocalStorage(): RecentCharacter[] {
	const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
	if (!stored) return [];
	try {
		const parsed = JSON.parse(stored);
		return Array.isArray(parsed) ? (parsed as RecentCharacter[]) : [];
	} catch (error) {
		console.error('Error parsing recent characters from localStorage', error);
		return [];
	}
}

function sameCharacter(a: RecentCharacter, b: RecentCharacter): boolean {
	return (
		a.region === b.region &&
		a.realm === b.realm &&
		a.characterName.toLowerCase() === b.characterName.toLowerCase()
	);
}

export const localStorageRecentCharactersBackend: RecentCharactersBackend = {
	name: 'local-storage',
	async load() {
		if (typeof localStorage === 'undefined') return null;
		return readLocalStorage();
	},
	async add(character) {
		if (typeof localStorage === 'undefined') return { status: 'unavailable' };
		try {
			const existing = readLocalStorage().filter((c) => !sameCharacter(c, character));
			const next = [character, ...existing].slice(0, MAX_RECENT);
			localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
			return { status: 'ok', characters: next };
		} catch (error) {
			console.error('Error saving to localStorage:', error);
			return { status: 'unavailable' };
		}
	}
};
