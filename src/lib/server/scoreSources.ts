/**
 * Mythic+ score sources used by `/api/character-score`.
 *
 * Each implementation owns its own request shaping (slug variants, headers,
 * timeout) and reports per-attempt debug info. The route handler is just a
 * fallback chain over these sources.
 */
import { getOrRefreshBlizzardAccessToken } from '$lib/auth/blizzardTokenCache';

export type ScoreSourceName = 'blizzard' | 'raiderio';

export interface ScoreResult {
	score: number | null;
	color: string | null;
	source: ScoreSourceName | null;
}

export interface ScoreAttempt {
	realm: string;
	name: string;
	status: number | null;
}

export interface ScoreLookup {
	result: ScoreResult | null;
	attempts: ScoreAttempt[];
}

export interface ScoreSource {
	readonly name: ScoreSourceName;
	lookup(region: string, realm: string, name: string): Promise<ScoreLookup>;
}

const DEFAULT_TIMEOUT_MS = 7000;

/** Fetch with an AbortController-based timeout. Always cleans up the timer. */
export async function fetchWithTimeout(
	input: string,
	init: RequestInit | undefined,
	timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);
	try {
		return await fetch(input, { ...init, signal: controller.signal });
	} finally {
		clearTimeout(timeout);
	}
}

type BlizzardMythicKeystoneProfile = {
	current_mythic_rating?: {
		rating?: number;
		color?: { r: number; g: number; b: number; a: number };
	};
};

type BlizzardRatingColor = NonNullable<
	BlizzardMythicKeystoneProfile['current_mythic_rating']
>['color'];

function colorToHex(color: BlizzardRatingColor): string | null {
	if (!color) return null;
	const r = Math.round(color.r).toString(16).padStart(2, '0');
	const g = Math.round(color.g).toString(16).padStart(2, '0');
	const b = Math.round(color.b).toString(16).padStart(2, '0');
	return `#${r}${g}${b}`;
}

function roundTenths(rating: number): number {
	return Math.round(rating * 10) / 10;
}

export const blizzardScoreSource: ScoreSource = {
	name: 'blizzard',
	async lookup(region, realm, name) {
		const attempts: ScoreAttempt[] = [];
		try {
			const token = await getOrRefreshBlizzardAccessToken();
			const url =
				`https://${region}.api.blizzard.com/profile/wow/character/` +
				`${encodeURIComponent(realm.toLowerCase())}/${encodeURIComponent(name.toLowerCase())}` +
				`/mythic-keystone-profile?namespace=profile-${region}&locale=en_US`;
			const res = await fetchWithTimeout(url, {
				headers: {
					Authorization: `Bearer ${token}`,
					'Battlenet-Namespace': `profile-${region}`
				}
			});
			attempts.push({ realm, name, status: res.status });
			if (!res.ok) return { result: null, attempts };
			const data = (await res.json()) as BlizzardMythicKeystoneProfile;
			const rating = data?.current_mythic_rating?.rating;
			if (typeof rating !== 'number') return { result: null, attempts };
			return {
				result: {
					score: roundTenths(rating),
					color: colorToHex(data.current_mythic_rating?.color),
					source: 'blizzard'
				},
				attempts
			};
		} catch {
			attempts.push({ realm, name, status: null });
			return { result: null, attempts };
		}
	}
};

type RaiderIoSeasonScore = {
	season: string;
	scores: { all?: number };
};

type RaiderIoProfileResponse = {
	mythic_plus_scores_by_season?: RaiderIoSeasonScore[];
};

function titleCaseWords(input: string): string {
	return input
		.split(' ')
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
		.join(' ');
}

function unique<T>(list: T[]): T[] {
	return Array.from(new Set(list));
}

function raiderIoRealmCandidates(realm: string): string[] {
	const slug = realm.trim().toLowerCase();
	const spaced = slug.replace(/-/g, ' ');
	const dashedTitle = spaced
		.split(' ')
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
		.join('-');
	return unique([slug, spaced, titleCaseWords(spaced), dashedTitle]);
}

function raiderIoNameCandidates(name: string): string[] {
	const trimmed = name.trim();
	const lower = trimmed.toLowerCase();
	const upperFirst = trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
	return unique([trimmed, lower, upperFirst]);
}

const RAIDERIO_TIMEOUT_MS = 5000;

export const raiderIoScoreSource: ScoreSource = {
	name: 'raiderio',
	async lookup(region, realm, name) {
		const attempts: ScoreAttempt[] = [];
		try {
			for (const realmVariant of raiderIoRealmCandidates(realm)) {
				for (const nameVariant of raiderIoNameCandidates(name)) {
					const url =
						`https://raider.io/api/v1/characters/profile?region=${encodeURIComponent(region)}` +
						`&realm=${encodeURIComponent(realmVariant)}` +
						`&name=${encodeURIComponent(nameVariant)}` +
						`&fields=mythic_plus_scores_by_season:current`;
					const res = await fetchWithTimeout(url, undefined, RAIDERIO_TIMEOUT_MS);
					attempts.push({
						realm: realmVariant,
						name: nameVariant,
						status: res.ok ? 200 : res.status
					});
					if (!res.ok) continue;
					const data = (await res.json()) as RaiderIoProfileResponse;
					const current = data?.mythic_plus_scores_by_season?.[0];
					const rating = current?.scores?.all;
					if (typeof rating !== 'number') continue;
					return {
						result: {
							score: roundTenths(rating),
							color: null,
							source: 'raiderio'
						},
						attempts
					};
				}
			}
			return { result: null, attempts };
		} catch {
			attempts.push({ realm, name, status: null });
			return { result: null, attempts };
		}
	}
};

/**
 * Try each source in order and return the first non-null result. The full
 * per-source attempt log is always returned for debug surfaces.
 */
export async function resolveScore(
	sources: readonly ScoreSource[],
	region: string,
	realm: string,
	name: string
): Promise<{
	result: ScoreResult;
	attemptsBySource: Record<ScoreSourceName, ScoreAttempt[]>;
}> {
	const attemptsBySource: Record<ScoreSourceName, ScoreAttempt[]> = {
		blizzard: [],
		raiderio: []
	};

	for (const source of sources) {
		const lookup = await source.lookup(region, realm, name);
		attemptsBySource[source.name] = lookup.attempts;
		if (lookup.result) {
			return { result: lookup.result, attemptsBySource };
		}
	}

	return {
		result: { score: null, color: null, source: null },
		attemptsBySource
	};
}
