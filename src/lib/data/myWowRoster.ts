import { getValidBattleNetUserToken } from '$lib/data/myWow/bnetAccount';
import {
	getStoredCharacters,
	replaceStoredCharacters,
	type CharacterUpsertInput
} from '$lib/data/myWow/userCharacters';
import { logServerError } from '$lib/server/logger';
import { fetchWithRateLimit, raiderIoScoreSource } from '$lib/server/scoreSources';

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
	guildName?: string | null;
	guildRealm?: string | null;
	guildRegion?: string | null;
	score?: number | null;
	scoreColor?: string | null;
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

type RaiderScoreTier = {
	score: number;
	rgbHex: string;
};

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

// Guild info comes from the individual character profile endpoint, not the roster endpoint.
type BlizzCharacterResponse = {
	guild?: { name?: string; realm?: { slug?: string; name?: string } };
};

const ROSTER_MIN_LEVEL = 90;
const GUILD_FETCH_MIN_LEVEL = 90;
const GUILD_FETCH_CONCURRENCY = 5;
const SCORE_FETCH_CONCURRENCY = 5;
const SCORE_TIERS_TTL_MS = 6 * 60 * 60 * 1000;
const SCORE_CACHE_TTL_MS = 30 * 60 * 1000;
const SCORE_NULL_CACHE_TTL_MS = 10 * 60 * 1000;

type ScoreCacheEntry = {
	score: number | null;
	scoreColor: string | null;
	fetchedAt: number;
};

let scoreTierCache: { tiers: RaiderScoreTier[]; fetchedAt: number } | null = null;
const scoreCache = new Map<string, ScoreCacheEntry>();

function scoreCacheKey(character: RosterCharacter): string {
	return `${character.region}-${character.realm}-${character.characterName.toLowerCase()}`;
}

async function getScoreTiers(): Promise<RaiderScoreTier[]> {
	if (scoreTierCache && Date.now() - scoreTierCache.fetchedAt < SCORE_TIERS_TTL_MS) {
		return scoreTierCache.tiers;
	}

	try {
		const response = await fetchWithRateLimit(
			'https://raider.io/api/v1/mythic-plus/score-tiers?season=season-mn-1',
			undefined
		);
		if (!response.ok) {
			return scoreTierCache?.tiers ?? [];
		}

		const payload = (await response.json()) as RaiderScoreTier[];
		const tiers = Array.isArray(payload)
			? payload
					.filter((tier) => typeof tier?.score === 'number' && typeof tier?.rgbHex === 'string')
					.sort((a, b) => b.score - a.score)
			: [];

		scoreTierCache = { tiers, fetchedAt: Date.now() };
		return tiers;
	} catch {
		return scoreTierCache?.tiers ?? [];
	}
}

function getScoreColor(score: number, tiers: RaiderScoreTier[]): string | null {
	for (const tier of tiers) {
		if (score >= tier.score) return tier.rgbHex;
	}
	return tiers.length > 0 ? (tiers[tiers.length - 1]?.rgbHex ?? null) : null;
}

async function enrichScores(characters: RosterCharacter[]): Promise<void> {
	if (characters.length === 0) return;

	const tiers = await getScoreTiers();
	const toLookup: RosterCharacter[] = [];

	for (const character of characters) {
		const key = scoreCacheKey(character);
		const cached = scoreCache.get(key);
		if (!cached) {
			toLookup.push(character);
			continue;
		}

		const ttl = cached.score === null ? SCORE_NULL_CACHE_TTL_MS : SCORE_CACHE_TTL_MS;
		if (Date.now() - cached.fetchedAt <= ttl) {
			character.score = cached.score;
			character.scoreColor = cached.scoreColor;
		} else {
			toLookup.push(character);
		}
	}

	if (toLookup.length === 0) return;

	for (let i = 0; i < toLookup.length; i += SCORE_FETCH_CONCURRENCY) {
		const batch = toLookup.slice(i, i + SCORE_FETCH_CONCURRENCY);
		await Promise.all(
			batch.map(async (character) => {
				try {
					const lookup = await raiderIoScoreSource.lookup(
						character.region,
						character.realm,
						character.characterName
					);
					const score = lookup.result?.score ?? null;
					const scoreColor = typeof score === 'number' ? getScoreColor(score, tiers) : null;
					character.score = score;
					character.scoreColor = scoreColor;
					scoreCache.set(scoreCacheKey(character), {
						score,
						scoreColor,
						fetchedAt: Date.now()
					});
				} catch {
					character.score = null;
					character.scoreColor = null;
					scoreCache.set(scoreCacheKey(character), {
						score: null,
						scoreColor: null,
						fetchedAt: Date.now()
					});
				}
			})
		);
	}
}

async function fetchGuildInfo(
	token: string,
	region: RosterCharacter['region'],
	characters: RosterCharacter[]
): Promise<Map<string, { guildName: string | null; guildRealm: string | null }>> {
	const eligible = characters.filter((c) => c.level >= GUILD_FETCH_MIN_LEVEL);
	const result = new Map<string, { guildName: string | null; guildRealm: string | null }>();

	// Process in batches to avoid rate limiting.
	for (let i = 0; i < eligible.length; i += GUILD_FETCH_CONCURRENCY) {
		const batch = eligible.slice(i, i + GUILD_FETCH_CONCURRENCY);
		await Promise.all(
			batch.map(async (char) => {
				const key = `${char.realm}-${char.characterName.toLowerCase()}`;
				try {
					const res = await fetchWithRateLimit(
						`https://${region}.api.blizzard.com/profile/wow/character/${encodeURIComponent(char.realm)}/${encodeURIComponent(char.characterName.toLowerCase())}?namespace=profile-${region}&locale=en_US`,
						{
							headers: { Authorization: `Bearer ${token}` }
						},
						{ timeoutMs: 4500 }
					);
					if (!res.ok) {
						result.set(key, { guildName: null, guildRealm: null });
						return;
					}
					const data = (await res.json()) as BlizzCharacterResponse;
					result.set(key, {
						guildName: data.guild?.name ?? null,
						guildRealm: data.guild?.realm?.slug ?? null
					});
				} catch {
					result.set(key, { guildName: null, guildRealm: null });
				}
			})
		);
	}
	return result;
}

async function fetchRegion(
	token: string,
	region: RosterCharacter['region']
): Promise<RosterCharacter[]> {
	try {
		const response = await fetchWithRateLimit(
			`https://${region}.api.blizzard.com/profile/user/wow?namespace=profile-${region}&locale=en_US`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
					'Battlenet-Namespace': `profile-${region}`
				}
			},
			{ timeoutMs: 4500 }
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
					faction: character.faction?.type ?? null,
					guildName: null,
					guildRealm: null,
					guildRegion: null
				});
			}
		}
		// Fetch guild info for high-level characters via individual profile calls
		const guildMap = await fetchGuildInfo(token, region, characters);
		for (const char of characters) {
			const key = `${char.realm}-${char.characterName.toLowerCase()}`;
			const guild = guildMap.get(key);
			if (guild) {
				char.guildName = guild.guildName;
				char.guildRealm = guild.guildRealm;
				char.guildRegion = guild.guildName ? region : null;
			}
		}
		return characters;
	} catch (error) {
		logServerError('myWowRoster', `region ${region} failed`, error);
		return [];
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

	const perRegion = await Promise.all(
		REGIONS.map((region) => fetchRegion(tokenInfo.token, region))
	);
	const merged = sortRoster(dedupe(perRegion.flat()));
	const level90Only = merged.filter((character) => character.level >= ROSTER_MIN_LEVEL);

	if (level90Only.length === 0) return null;

	await enrichScores(level90Only);

	try {
		await replaceStoredCharacters(
			userId,
			level90Only.map<CharacterUpsertInput>((character) => ({
				region: character.region,
				realmSlug: character.realm,
				realmName: character.realmName,
				characterName: character.characterName,
				level: character.level,
				className: character.className,
				raceName: character.raceName,
				faction: character.faction,
				guildName: character.guildName ?? null,
				guildRealm: character.guildRealm ?? null,
				guildRegion: character.guildRegion ?? null
			}))
		);
	} catch (error) {
		logServerError('myWowRoster', 'failed to persist roster', error);
	}

	rosterCache.set(userId, { value: level90Only, fetchedAt: Date.now() });
	return level90Only;
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
				faction: row.faction,
				guildName: row.guildName ?? null,
				guildRealm: row.guildRealm ?? null,
				guildRegion: row.guildRegion ?? null,
				score: null,
				scoreColor: null
			}))
		);
		await enrichScores(stored);
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
