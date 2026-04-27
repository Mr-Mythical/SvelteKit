import { getValidBattleNetUserToken } from '$lib/db/bnetAccount';
import {
	getStoredCharacters,
	replaceStoredCharacters,
	type CharacterUpsertInput
} from '$lib/db/userCharacters';
import { logServerError } from '$lib/server/logger';

// Server-only helper that returns the signed-in user's WoW character roster.
//
// Storage layering:
//   1. Process-local Map cache (fast path, short TTL).
//   2. Postgres `user_characters` table (persisted across cold starts).
//   3. Battle.net profile API (only on explicit refresh).
//
// Auth.ts triggers a refresh on sign-in, so the usual logged-in path just
// reads the cached DB rows.

export interface RosterCharacter {
	characterName: string;
	realm: string; // slug
	realmName: string;
	region: 'us' | 'eu' | 'kr' | 'tw';
	level: number;
	className: string | null;
	raceName: string | null;
	faction: 'ALLIANCE' | 'HORDE' | null;
}

export interface RosterResult {
	characters: RosterCharacter[];
	hasScope: boolean;
	hasAccount: boolean;
	stale: boolean;
}

const REGIONS: RosterCharacter['region'][] = ['us', 'eu', 'kr', 'tw'];
const MEMORY_TTL_MS = 10 * 60 * 1000;

type CacheEntry = { value: RosterCharacter[]; fetchedAt: number };
const rosterCache = new Map<string, CacheEntry>();

type BlizzProfileResponse = {
	wow_accounts?: Array<{
		characters?: Array<{
			name?: string;
			level?: number;
			realm?: { slug?: string; name?: string };
			playable_class?: { name?: string };
			playable_race?: { name?: string };
			faction?: { type?: 'ALLIANCE' | 'HORDE' };
		}>;
	}>;
};

async function fetchRegion(
	token: string,
	region: RosterCharacter['region']
): Promise<RosterCharacter[]> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 4500);
	try {
		const response = await fetch(
			`https://${region}.api.blizzard.com/profile/user/wow?namespace=profile-${region}&locale=en_US`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
					'Battlenet-Namespace': `profile-${region}`
				},
				signal: controller.signal
			}
		);
		if (!response.ok) return [];

		const payload = (await response.json()) as BlizzProfileResponse;
		const characters: RosterCharacter[] = [];
		for (const account of payload.wow_accounts ?? []) {
			for (const character of account.characters ?? []) {
				const name = character.name;
				const realmSlug = character.realm?.slug;
				if (!name || !realmSlug) continue;
				characters.push({
					characterName: name,
					realm: realmSlug,
					realmName: character.realm?.name ?? realmSlug,
					region,
					level: character.level ?? 0,
					className: character.playable_class?.name ?? null,
					raceName: character.playable_race?.name ?? null,
					faction: character.faction?.type ?? null
				});
			}
		}
		return characters;
	} catch (error) {
		logServerError('myWowRoster', `region ${region} failed`, error);
		return [];
	} finally {
		clearTimeout(timeout);
	}
}

function sortRoster(list: RosterCharacter[]): RosterCharacter[] {
	return [...list].sort((a, b) => {
		if (b.level !== a.level) return b.level - a.level;
		return a.characterName.localeCompare(b.characterName);
	});
}

function dedupe(list: RosterCharacter[]): RosterCharacter[] {
	const seen = new Set<string>();
	const out: RosterCharacter[] = [];
	for (const character of list) {
		const key = `${character.region}-${character.realm}-${character.characterName.toLowerCase()}`;
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(character);
	}
	return out;
}

/**
 * Fetch a fresh roster from Battle.net across all regions and write it back to
 * the DB. Returns the new list, or `null` when the Bnet call produced no
 * characters (we keep whatever's in the DB in that case).
 *
 * Persistence failures are logged but never thrown — callers always get the
 * in-memory roster even if the DB write fails.
 *
 * @throws Never — token, network, and DB errors are swallowed and surfaced as
 *         `null` or via `logServerError`.
 */
export async function refreshRosterFromBattleNet(
	userId: string
): Promise<RosterCharacter[] | null> {
	const tokenInfo = await getValidBattleNetUserToken(userId);
	if (!tokenInfo) return null;
	const hasScope = (tokenInfo.scope ?? '').split(/\s+/).includes('wow.profile');
	if (!hasScope) return null;

	const perRegion = await Promise.all(REGIONS.map((region) => fetchRegion(tokenInfo.token, region)));
	const merged = sortRoster(dedupe(perRegion.flat()));

	if (merged.length === 0) return null;

	try {
		await replaceStoredCharacters(
			userId,
			merged.map<CharacterUpsertInput>((character) => ({
				region: character.region,
				realmSlug: character.realm,
				realmName: character.realmName,
				characterName: character.characterName,
				level: character.level,
				className: character.className,
				raceName: character.raceName,
				faction: character.faction
			}))
		);
	} catch (error) {
		logServerError('myWowRoster', 'failed to persist roster', error);
	}

	rosterCache.set(userId, { value: merged, fetchedAt: Date.now() });
	return merged;
}

/**
 * Returns the user's WoW character roster, preferring the in-memory cache,
 * then the DB, and only hitting Battle.net when forced via `options.refresh`
 * or when the cache + DB are empty.
 *
 * `RosterResult.stale` indicates the value came from the DB but a fresh
 * Battle.net fetch failed. `hasScope` / `hasAccount` distinguish missing
 * Bnet OAuth scope vs. no linked account at all.
 *
 * @throws Never — propagates no errors; degraded results carry their state
 *         in the result object instead.
 */
export async function getMyWowRoster(
	userId: string,
	options: { refresh?: boolean } = {}
): Promise<RosterResult> {
	// Fast path: in-memory cache.
	const cached = rosterCache.get(userId);
	if (!options.refresh && cached && Date.now() - cached.fetchedAt < MEMORY_TTL_MS) {
		return { characters: cached.value, hasScope: true, hasAccount: true, stale: false };
	}

	if (options.refresh) {
		const fresh = await refreshRosterFromBattleNet(userId);
		if (fresh) {
			return { characters: fresh, hasScope: true, hasAccount: true, stale: false };
		}
		// Fall through to DB / scope checks if refresh produced nothing usable.
	}

	// Read the persisted roster - the default path for every request.
	let stored: RosterCharacter[] = [];
	try {
		const rows = await getStoredCharacters(userId);
		stored = sortRoster(
			rows.map<RosterCharacter>((row) => ({
				characterName: row.characterName,
				realm: row.realmSlug,
				realmName: row.realmName,
				region: row.region,
				level: row.level,
				className: row.className,
				raceName: row.raceName,
				faction: row.faction
			}))
		);
	} catch (error) {
		logServerError('myWowRoster', 'DB read failed', error);
	}

	if (stored.length > 0) {
		rosterCache.set(userId, { value: stored, fetchedAt: Date.now() });
		return { characters: stored, hasScope: true, hasAccount: true, stale: false };
	}

	// DB empty - figure out the account/scope state so the UI renders the
	// correct empty message. We don't hit the Bnet API on read paths.
	const tokenInfo = await getValidBattleNetUserToken(userId);
	if (!tokenInfo) {
		return { characters: [], hasScope: false, hasAccount: false, stale: false };
	}
	const hasScope = (tokenInfo.scope ?? '').split(/\s+/).includes('wow.profile');
	return { characters: [], hasScope, hasAccount: true, stale: false };
}
