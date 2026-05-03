import type { RequestHandler } from './$types';
import { apiOk } from '$lib/server/apiResponses';
import { getUserRecents, type CharacterRecentData } from '$lib/db/userRecents.js';
import { getMyWowRoster } from '$lib/data/myWowRoster';
import { requireSession } from '$lib/server/requireSession';
import { executeWclQuery, WclQueryError } from '$lib/server/wclGraphQL';
import { logServerError, logServerWarn, handleApiError } from '$lib/server/logger';
import { memoryCacheGetOrSet } from '$lib/server/memoryCache';

// Returns a flat list of recent WarcraftLogs reports aggregated across the
// signed-in user's characters, plus a deduplicated list of the
// guilds those reports belong to so the UI can offer a guild filter.
//
// Characters are sourced from the user's Battle.net roster when the account
// is linked and `wow.profile` scope was granted, with the user's recent
// manually-imported characters as a fallback / supplement.

type WarcraftLogsReport = {
	code: string;
	title: string | null;
	startTime: number | null;
	endTime: number | null;
	guild: { id?: number; name?: string } | null;
	owner: { name?: string } | null;
};

type CharacterReport = {
	code: string;
	title: string;
	timestamp: number;
	guild: { name: string } | null;
	owner: { name: string };
	sourceCharacter: {
		name: string;
		realm: string;
		region: string;
	};
};

type CharacterReportsResponse = {
	reports: CharacterReport[];
	guilds: { name: string; count: number }[];
};

const MAX_PERSONAL_GUILD_REPORTS_SHOWN = 6;
const MAX_GUILD_FILTERS_SHOWN = 8;
const MIN_CHARACTER_LEVEL = 90;
const MAX_CHARACTERS_QUERIED = 15;
const MAX_GUILDS_QUERIED = 10;

function characterKey(region: string, realm: string, name: string): string {
	return `${region.toLowerCase()}-${realm.toLowerCase()}-${name.toLowerCase()}`;
}

function guildKey(region: string, realm: string, name: string): string {
	return `${region.toLowerCase()}-${realm.toLowerCase()}-${name.toLowerCase()}`;
}

const CHARACTER_REPORT_QUERY = /* GraphQL */ `
	query CharacterReports($name: String!, $server: String!, $region: String!) {
		characterData {
			character(name: $name, serverSlug: $server, serverRegion: $region) {
				recentReports(limit: 5) {
					data {
						code
						title
						startTime
						endTime
						guild {
							id
							name
						}
						owner {
							name
						}
					}
				}
			}
		}
	}
`;

const GUILD_RECENT_REPORTS_QUERY = /* GraphQL */ `
	query GuildRecentReports($name: String!, $server: String!, $region: String!) {
		reportData {
			reports(guildName: $name, guildServerSlug: $server, guildServerRegion: $region, limit: 8) {
				data {
					code
					title
					startTime
					endTime
					guild {
						id
						name
					}
					owner {
						name
					}
				}
			}
		}
	}
`;

async function fetchReportsForCharacter(character: {
	characterName: string;
	realm: string;
	region: string;
}): Promise<WarcraftLogsReport[]> {
	try {
		const data = await executeWclQuery<{
			characterData?: {
				character?: { recentReports?: { data?: WarcraftLogsReport[] } } | null;
			};
		}>(CHARACTER_REPORT_QUERY, {
			name: character.characterName,
			server: character.realm,
			region: character.region.toUpperCase()
		});

		return data.characterData?.character?.recentReports?.data ?? [];
	} catch (error) {
		logWclFailure('character', character, error);
		return [];
	}
}

async function fetchReportsForGuild(guild: {
	name: string;
	realm: string;
	region: string;
}): Promise<WarcraftLogsReport[]> {
	try {
		const data = await executeWclQuery<{
			reportData?: { reports?: { data?: WarcraftLogsReport[] } };
		}>(GUILD_RECENT_REPORTS_QUERY, {
			name: guild.name,
			server: guild.realm,
			region: guild.region.toUpperCase()
		});

		return data.reportData?.reports?.data ?? [];
	} catch (error) {
		logWclFailure('guild', guild, error);
		return [];
	}
}

function logWclFailure(kind: 'character' | 'guild', target: unknown, error: unknown): void {
	if (error instanceof WclQueryError && error.kind === 'graphql') {
		logServerWarn('api/character-reports', `WCL GraphQL errors for ${kind}`, {
			target,
			detail: error.detail
		});
		return;
	}
	logServerError('api/character-reports', `WCL fetch failed for ${kind}`, { target, error });
}

const CHARACTER_REPORTS_TTL_MS = 5 * 60 * 1000;
const CHARACTER_REPORTS_BROWSER_TTL_S = 180;

export const GET: RequestHandler = async ({ locals, setHeaders }) => {
	const auth = await requireSession(locals);
	if ('response' in auth) return auth.response;
	const userId = auth.session.user.id;

	try {
		const payload = await memoryCacheGetOrSet(
			`character-reports:${userId}`,
			CHARACTER_REPORTS_TTL_MS,
			() => buildCharacterReports(userId)
		);
		// Browser cache as well so back/forward navigation and component
		// remounts within a few minutes don't re-hit the worker at all.
		setHeaders({
			'cache-control': `private, max-age=${CHARACTER_REPORTS_BROWSER_TTL_S}`
		});
		return apiOk(payload);
	} catch (error) {
		return handleApiError('api/character-reports', error);
	}
};

async function buildCharacterReports(userId: string): Promise<CharacterReportsResponse> {
	// Only fetch guild logs for all unique guilds that user's high-level characters are in
	let bnetCharacters: Array<{ characterName: string; realm: string; region: string; guild?: string }> = [];
	try {
		const roster = await getMyWowRoster(userId);
		for (const character of roster.characters) {
			if (character.level >= MIN_CHARACTER_LEVEL && character.guildName) {
				bnetCharacters.push({
					characterName: character.characterName,
					realm: character.guildRealm ?? character.realm,
					region: character.guildRegion ?? character.region,
					guild: character.guildName
				});
			}
		}
	} catch (error) {
		logServerError('api/character-reports', 'battlenet roster fetch failed', error);
	}

	// Dedupe guilds by region+realm+guild name
	const guildTargets = new Map<string, { name: string; realm: string; region: string }>();
	for (const character of bnetCharacters) {
		if (!character.guild) continue;
		const key = guildKey(character.region, character.realm, character.guild);
		if (!guildTargets.has(key)) {
			guildTargets.set(key, {
				name: character.guild,
				realm: character.realm,
				region: character.region
			});
		}
	}

	if (guildTargets.size === 0) {
		return { reports: [], guilds: [] };
	}

	const guildReports = await Promise.all(
		Array.from(guildTargets.values())
			.slice(0, MAX_GUILDS_QUERIED)
			.map(async (guild) => {
				const reports = await fetchReportsForGuild({
					name: guild.name,
					realm: guild.realm,
					region: guild.region
				});
				return reports.map<CharacterReport>((report) => ({
					code: report.code,
					title: report.title || 'Untitled report',
					timestamp: report.startTime ?? 0,
					guild: report.guild?.name ? { name: report.guild.name } : { name: guild.name },
					owner: { name: report.owner?.name || 'Unknown' },
					sourceCharacter: {
						name: '',
						realm: guild.realm,
						region: guild.region
					}
				}));
			})
	);

	// Dedupe by report code, keep the entry with the most recent timestamp.
	const byCode = new Map<string, CharacterReport>();
	for (const report of guildReports.flat()) {
		const existing = byCode.get(report.code);
		if (!existing || report.timestamp > existing.timestamp) {
			byCode.set(report.code, report);
		}
	}

	const reports = Array.from(byCode.values())
		.sort((a, b) => b.timestamp - a.timestamp)
		.slice(0, MAX_PERSONAL_GUILD_REPORTS_SHOWN);

	const guildCounts = new Map<string, number>();
	for (const report of reports) {
		if (report.guild?.name) {
			guildCounts.set(report.guild.name, (guildCounts.get(report.guild.name) ?? 0) + 1);
		}
	}
	const guilds = Array.from(guildCounts.entries())
		.map(([name, count]) => ({ name, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, MAX_GUILD_FILTERS_SHOWN);

	return { reports, guilds };
}
