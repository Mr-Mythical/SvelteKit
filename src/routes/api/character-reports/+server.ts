import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { getUserRecents, type CharacterRecentData } from '$lib/db/userRecents.js';
import { getMyWowRoster } from '$lib/utils/myWowRoster';
import { requireSession } from '$lib/server/requireSession';
import { executeWclQuery, WclQueryError } from '$lib/server/wclGraphQL';

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

const GUILD_REPORTS_QUERY = /* GraphQL */ `
	query GuildReports($name: String!, $server: String!, $region: String!) {
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

async function fetchReportsForCharacter(
	character: { characterName: string; realm: string; region: string }
): Promise<WarcraftLogsReport[]> {
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

async function fetchReportsForGuild(
	guild: { name: string; realm: string; region: string }
): Promise<WarcraftLogsReport[]> {
	const queries = [GUILD_RECENT_REPORTS_QUERY, GUILD_REPORTS_QUERY];

	for (const query of queries) {
		try {
			const data = await executeWclQuery<{
				reportData?: { reports?: { data?: WarcraftLogsReport[] } };
			}>(query, {
				name: guild.name,
				server: guild.realm,
				region: guild.region.toUpperCase()
			});

			const reports = data.reportData?.reports?.data;
			if (reports?.length) return reports;
		} catch (error) {
			logWclFailure('guild', guild, error);
			return [];
		}
	}

	return [];
}

function logWclFailure(
	kind: 'character' | 'guild',
	target: unknown,
	error: unknown
): void {
	if (error instanceof WclQueryError && error.kind === 'graphql') {
		console.warn(`character-reports: WCL graphql errors for ${kind}`, target, error.detail);
		return;
	}
	console.error(`character-reports: WCL fetch failed for ${kind}`, target, error);
}

export const GET: RequestHandler = async ({ locals }) => {
	const auth = await requireSession(locals);
	if ('response' in auth) return auth.response;
	const userId = auth.session.user.id;

	try {
		// Source 1: the user's Battle.net roster (level 90+).
		let bnetCharacters: Array<{ characterName: string; realm: string; region: string }> = [];
		try {
			const roster = await getMyWowRoster(userId);
			bnetCharacters = roster.characters
				.filter((character) => character.level >= 90)
				.map((character) => ({
					characterName: character.characterName,
					realm: character.realm,
					region: character.region
				}));
		} catch (error) {
			console.error('character-reports: battlenet roster fetch failed', error);
		}

		// Source 2: manually-imported recents (covers characters on other accounts
		// or when the bnet scope is missing).
		const recents = await getUserRecents<CharacterRecentData>(userId, 'character', 6);
		const recentCharacters = recents
			.map((recent) => ({
				characterName: recent.entityData?.characterName,
				realm: recent.entityData?.realm,
				region: recent.entityData?.region
			}))
			.filter((character) => character.characterName && character.realm && character.region);

		// Merge and dedupe. Cap at a reasonable number so we don't hammer WCL.
		const seen = new Set<string>();
		const merged: Array<{ characterName: string; realm: string; region: string }> = [];
		for (const character of [...bnetCharacters, ...recentCharacters]) {
			const key = `${character.region}-${character.realm}-${character.characterName.toLowerCase()}`;
			if (seen.has(key)) continue;
			seen.add(key);
			merged.push(character);
			if (merged.length >= 15) break;
		}

		if (merged.length === 0) {
			return json({ reports: [], guilds: [] } satisfies CharacterReportsResponse);
		}

		const perCharacter = await Promise.all(
			merged.map(async (character) => {
				const reports = await fetchReportsForCharacter(character);
				return reports.map<CharacterReport>((report) => ({
					code: report.code,
					title: report.title || 'Untitled report',
					timestamp: (report.startTime ?? 0) || 0,
					guild: report.guild?.name ? { name: report.guild.name } : null,
					owner: { name: report.owner?.name || 'Unknown' },
					sourceCharacter: {
						name: character.characterName,
						realm: character.realm,
						region: character.region
					}
				}));
			})
		);

		const guildTargets = new Map<
			string,
			{ name: string; realm: string; region: string; sourceCharacter: CharacterReport['sourceCharacter'] }
		>();
		for (const report of perCharacter.flat()) {
			if (!report.guild?.name) continue;
			const key = `${report.guild.name.toLowerCase()}-${report.sourceCharacter.region}-${report.sourceCharacter.realm}`;
			if (guildTargets.has(key)) continue;
			guildTargets.set(key, {
				name: report.guild.name,
				realm: report.sourceCharacter.realm,
				region: report.sourceCharacter.region,
				sourceCharacter: report.sourceCharacter
			});
		}

		const guildReports = await Promise.all(
			Array.from(guildTargets.values())
				.slice(0, 10)
				.map(async (guild) => {
					const reports = await fetchReportsForGuild({
						name: guild.name,
						realm: guild.realm,
						region: guild.region
					});
					return reports.map<CharacterReport>((report) => ({
						code: report.code,
						title: report.title || 'Untitled report',
						timestamp: (report.startTime ?? 0) || 0,
						guild: report.guild?.name ? { name: report.guild.name } : { name: guild.name },
						owner: { name: report.owner?.name || 'Unknown' },
						sourceCharacter: guild.sourceCharacter
					}));
				})
		);

		// Dedupe by report code, keep the entry with the most recent timestamp.
		const byCode = new Map<string, CharacterReport>();
		for (const report of [...perCharacter.flat(), ...guildReports.flat()]) {
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

		return json({ reports, guilds } satisfies CharacterReportsResponse);
	} catch (error) {
		console.error('character-reports: failed', error);
		return json({ reports: [], guilds: [] } satisfies CharacterReportsResponse);
	}
};
