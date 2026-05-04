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

import { logClientError } from '$lib/clientLog';

export interface RecentCharacter {
	region: string;
	realm: string;
	characterName: string;
	className?: string | null;
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

function normalizeIdentityPart(value: string): string {
	return value.trim().toLowerCase();
}

function characterIdentity(character: RecentCharacter): string {
	return `${normalizeIdentityPart(character.region)}::${normalizeIdentityPart(character.realm)}::${normalizeIdentityPart(character.characterName)}`;
}

function dedupeCharacters(characters: RecentCharacter[]): RecentCharacter[] {
	const seen = new Set<string>();
	const deduped: RecentCharacter[] = [];

	for (const character of characters) {
		const identity = characterIdentity(character);
		if (seen.has(identity)) continue;
		seen.add(identity);
		deduped.push(character);
	}

	return deduped;
}

export const apiRecentCharactersBackend: RecentCharactersBackend = {
	name: 'api',
	async load() {
		try {
			const response = await fetch('/api/recent-characters');
			if (!response.ok) return null;
			return (await response.json()) as RecentCharacter[];
		} catch (error) {
			logClientError('recentCharacters/api', 'load failed', error);
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
			logClientError(
				'recentCharacters/api',
				`add rejected status=${response.status}`,
				new Error(`status ${response.status}`)
			);
			return { status: 'unavailable' };
		} catch (error) {
			logClientError('recentCharacters/api', 'add failed', error);
			return { status: 'unavailable' };
		}
	}
};

function readLocalStorage(): RecentCharacter[] {
	const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
	if (!stored) return [];
	try {
		const parsed = JSON.parse(stored);
		return Array.isArray(parsed) ? dedupeCharacters(parsed as RecentCharacter[]) : [];
	} catch (error) {
		logClientError('recentCharacters/localStorage', 'parse failed', error);
		return [];
	}
}

function sameCharacter(a: RecentCharacter, b: RecentCharacter): boolean {
	return characterIdentity(a) === characterIdentity(b);
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
			const existing = dedupeCharacters(readLocalStorage()).filter((c) => !sameCharacter(c, character));
			const next = [character, ...existing].slice(0, MAX_RECENT);
			localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
			return { status: 'ok', characters: next };
		} catch (error) {
			logClientError('recentCharacters/localStorage', 'save failed', error);
			return { status: 'unavailable' };
		}
	}
};
