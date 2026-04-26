import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getOrRefreshBlizzardAccessToken } from '$lib/utils/blizzardTokenCache';

type ScoreSource = 'blizzard' | 'raiderio';

type ScoreResponse = {
	score: number | null;
	color: string | null;
	source: ScoreSource | null;
};

type DebugInfo = {
	blizzardStatus: number | null;
	raiderIoAttempts: Array<{ realm: string; name: string; status: number | null }>;
};

const VALID_REGIONS = new Set(['us', 'eu', 'kr', 'tw']);

type BlizzardMythicKeystoneProfile = {
	current_mythic_rating?: {
		rating?: number;
		color?: { r: number; g: number; b: number; a: number };
	};
};

type BlizzardRatingColor = NonNullable<
	BlizzardMythicKeystoneProfile['current_mythic_rating']
>['color'];

async function fetchWithTimeout(
	input: string,
	init?: RequestInit,
	timeoutMs = 7000
): Promise<Response> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), timeoutMs);
	try {
		return await fetch(input, { ...init, signal: controller.signal });
	} finally {
		clearTimeout(timeout);
	}
}

function colorToHex(color: BlizzardRatingColor): string | null {
	if (!color) return null;
	const r = Math.round(color.r).toString(16).padStart(2, '0');
	const g = Math.round(color.g).toString(16).padStart(2, '0');
	const b = Math.round(color.b).toString(16).padStart(2, '0');
	return `#${r}${g}${b}`;
}

async function fromBlizzard(
	region: string,
	realm: string,
	name: string
): Promise<{ result: ScoreResponse | null; status: number | null }> {
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
		if (!res.ok) return { result: null, status: res.status };
		const data = (await res.json()) as BlizzardMythicKeystoneProfile;
		const rating = data?.current_mythic_rating?.rating;
		if (typeof rating !== 'number') return { result: null, status: 200 };
		return {
			result: {
				score: Math.round(rating * 10) / 10,
				color: colorToHex(data.current_mythic_rating?.color),
				source: 'blizzard'
			},
			status: 200
		};
	} catch {
		return { result: null, status: null };
	}
}

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

async function fromRaiderIo(
	region: string,
	realm: string,
	name: string
): Promise<{
	result: ScoreResponse | null;
	attempts: Array<{ realm: string; name: string; status: number | null }>;
}> {
	const attempts: Array<{ realm: string; name: string; status: number | null }> = [];
	try {
		for (const realmVariant of raiderIoRealmCandidates(realm)) {
			for (const nameVariant of raiderIoNameCandidates(name)) {
				const url =
					`https://raider.io/api/v1/characters/profile?region=${encodeURIComponent(region)}` +
					`&realm=${encodeURIComponent(realmVariant)}` +
					`&name=${encodeURIComponent(nameVariant)}` +
					`&fields=mythic_plus_scores_by_season:current`;
				const res = await fetchWithTimeout(url, undefined, 5000);
				attempts.push({ realm: realmVariant, name: nameVariant, status: res.ok ? 200 : res.status });
				if (!res.ok) continue;
				const data = (await res.json()) as RaiderIoProfileResponse;
				const current = data?.mythic_plus_scores_by_season?.[0];
				const rating = current?.scores?.all;
				if (typeof rating !== 'number') continue;
				return {
					result: {
						score: Math.round(rating * 10) / 10,
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

/**
 * GET /api/character-score
 *
 * Resolves a character's Mythic+ score by trying Blizzard first, then falling
 * back to Raider.IO. Both providers are wrapped in their own retry/realm-slug
 * loops above and never throw out — they return `{ result: null, attempts }`
 * on failure.
 *
 * Query: `name`, `region` (us|eu|kr|tw), `realm` (display name or slug),
 *        optional `debug=1` to include the per-attempt log.
 *
 * Returns:
 * - 200 `ScoreResponse` (`source` is `'blizzard'`, `'raiderio'`, or `null` if
 *   neither provider returned a score).
 * - 400 `ScoreResponse` with all fields null when params are missing or
 *   `region` is not in {@link VALID_REGIONS}.
 *
 * @throws Never — provider/network errors are swallowed and surfaced as a null
 *         score so the UI can render a fallback.
 */
export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const name = url.searchParams.get('name')?.trim();
	const region = url.searchParams.get('region')?.toLowerCase().trim();
	const realm = url.searchParams.get('realm')?.trim();
	const debug = url.searchParams.get('debug') === '1';

	if (!name || !region || !realm || !VALID_REGIONS.has(region)) {
		return json({ score: null, color: null, source: null } satisfies ScoreResponse, {
			status: 400
		});
	}

	// Prefer Blizzard (authoritative, includes tier color). Fall back to Raider.io.
	const blizz = await fromBlizzard(region, realm, name);
	const rio = blizz.result ? { result: null, attempts: [] } : await fromRaiderIo(region, realm, name);
	const result: ScoreResponse = blizz.result ?? rio.result ?? {
		score: null,
		color: null,
		source: null
	};

	// Short CDN cache: scores change with every completed key, but we don't need second-level freshness.
	setHeaders({ 'cache-control': 'public, max-age=300, s-maxage=300' });

	if (debug) {
		const debugInfo: DebugInfo = {
			blizzardStatus: blizz.status,
			raiderIoAttempts: rio.attempts
		};
		return json({ ...result, debug: debugInfo });
	}

	return json(result);
};
