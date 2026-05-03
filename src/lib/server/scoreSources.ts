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
const DEFAULT_MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 400;

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(retryAfterHeader: string | null): number | null {
	if (!retryAfterHeader) return null;
	const seconds = Number(retryAfterHeader);
	if (Number.isFinite(seconds) && seconds >= 0) {
		return Math.round(seconds * 1000);
	}
	const dateMs = Date.parse(retryAfterHeader);
	if (Number.isNaN(dateMs)) return null;
	const delta = dateMs - Date.now();
	return delta > 0 ? delta : 0;
}

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

export async function fetchWithRateLimit(
	input: string,
	init: RequestInit | undefined,
	options: { timeoutMs?: number; maxRetries?: number } = {}
): Promise<Response> {
	const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;

	let lastError: unknown;
	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			const response = await fetchWithTimeout(input, init, timeoutMs);
			if (response.status === 429 || response.status === 503) {
				if (attempt === maxRetries) return response;
				const retryAfterMs = parseRetryAfterMs(response.headers.get('retry-after'));
				const backoffMs = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
				await sleep(Math.max(retryAfterMs ?? 0, backoffMs));
				continue;
			}
			return response;
		} catch (error) {
			lastError = error;
			if (attempt === maxRetries) throw error;
			await sleep(RETRY_BASE_DELAY_MS * Math.pow(2, attempt));
		}
	}

	throw (lastError ?? new Error('fetchWithRateLimit failed unexpectedly')) as Error;
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
			const response = await fetchWithRateLimit(url, {
				headers: {
					Authorization: `Bearer ${token}`,
					'Battlenet-Namespace': `profile-${region}`
				}
			});
			attempts.push({ realm, name, status: response.status });
			if (!response.ok) return { result: null, attempts };
			const data = (await response.json()) as BlizzardMythicKeystoneProfile;
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
					const response = await fetchWithRateLimit(url, undefined, {
						timeoutMs: RAIDERIO_TIMEOUT_MS
					});
					attempts.push({
						realm: realmVariant,
						name: nameVariant,
						status: response.ok ? 200 : response.status
					});
					if (!response.ok) continue;
					const data = (await response.json()) as RaiderIoProfileResponse;
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
