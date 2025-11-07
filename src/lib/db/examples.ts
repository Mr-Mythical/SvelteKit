/**
 * Example usage of the user management and recents system
 *
 * This file demonstrates how to use the database functions
 * to manage users and their recent activity.
 */

import { createUser, getUserById, updateUserLastSeen, upsertUserFromAuth } from '$lib/db/users.js';

import {
	addUserRecent,
	getUserRecents,
	createCharacterRecent,
	createReportRecent,
	createGuildRecent,
	createDungeonRunRecent
} from '$lib/db/recents.js';

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

// Example 1: Handle user authentication (Auth.js integration)
export async function handleUserLogin(session: any) {
	if (!session?.user) return;

	// Automatically create or update user from Auth.js session
	const user = await upsertUserFromAuth({
		id: session.user.id,
		battletag: session.user.battletag,
		name: session.user.name,
		email: session.user.email,
		image: session.user.image
	});

	console.log('User logged in:', user.battletag);
	return user;
}

// Example 2: Track character visits
export async function trackCharacterVisit(
	userId: string,
	characterName: string,
	realm: string,
	region: string,
	characterData?: any
) {
	// Update user's last seen
	await updateUserLastSeen(userId);

	// Add character to recents
	const characterRecent = createCharacterRecent(characterName, realm, region, {
		class: characterData?.class,
		level: characterData?.level,
		guild: characterData?.guild,
		lastSeen: new Date().toISOString()
	});

	await addUserRecent(userId, characterRecent);

	console.log(`Tracked visit to ${characterName} on ${realm}`);
}

// Example 3: Track report analysis
export async function trackReportAnalysis(
	userId: string,
	reportCode: string,
	reportTitle: string,
	guildName?: string,
	encounter?: string
) {
	await updateUserLastSeen(userId);

	const reportRecent = createReportRecent(reportCode, reportTitle, guildName, {
		encounter,
		analyzedAt: new Date().toISOString(),
		url: `https://www.warcraftlogs.com/reports/${reportCode}`
	});

	await addUserRecent(userId, reportRecent);

	console.log(`Tracked analysis of report ${reportCode}`);
}

// Example 4: Track dungeon run analysis
export async function trackDungeonRun(
	userId: string,
	dungeonName: string,
	keystoneLevel: number,
	reportCode: string,
	runData?: any
) {
	await updateUserLastSeen(userId);

	const dungeonRecent = createDungeonRunRecent(dungeonName, keystoneLevel, reportCode, {
		duration: runData?.duration,
		success: runData?.success,
		score: runData?.score,
		affixes: runData?.affixes,
		players: runData?.players
	});

	await addUserRecent(userId, dungeonRecent);

	console.log(`Tracked ${dungeonName} +${keystoneLevel} analysis`);
}

// Example 5: Get user's recent activity for display
export async function getUserDashboardData(userId: string) {
	const [user, recentCharacters, recentReports] = await Promise.all([
		getUserById(userId),
		getUserRecents(userId, 'character', 5),
		getUserRecents(userId, 'report', 5)
	]);

	return {
		user,
		dashboard: {
			recentCharacters,
			recentReports
		}
	};
}

// Example 6: Track guild analysis
export async function trackGuildAnalysis(
	userId: string,
	guildName: string,
	realm: string,
	region: string,
	guildData?: any
) {
	await updateUserLastSeen(userId);

	const guildRecent = createGuildRecent(guildName, realm, region, {
		memberCount: guildData?.memberCount,
		progression: guildData?.progression,
		lastRaidNight: guildData?.lastRaidNight
	});

	await addUserRecent(userId, guildRecent);

	console.log(`Tracked analysis of guild ${guildName} on ${realm}`);
}

// =============================================================================
// QUICK SETUP FUNCTIONS
// =============================================================================

/**
 * Quick function to add any recent item
 * Usage: await quickAddRecent(userId, 'character', 'Paladin-Stormrage', 'My Main Character', 'Stormrage (US)', { class: 'Paladin' })
 */
export async function quickAddRecent(
	userId: string,
	type: 'character' | 'report' | 'guild' | 'dungeon_run',
	entityId: string,
	title: string,
	subtitle?: string,
	data: Record<string, any> = {}
) {
	await addUserRecent(userId, {
		type,
		entityId,
		title,
		subtitle,
		entityData: data
	});
}

/**
 * Quick function to get all recent activity for a user
 */
export async function getRecentActivity(userId: string, limit: number = 20) {
	return await getUserRecents(userId, undefined, limit);
}

/**
 * Quick function to get recents by type
 */
export async function getRecentsByType(
	userId: string,
	type: 'character' | 'report' | 'guild' | 'dungeon_run',
	limit: number = 10
) {
	return await getUserRecents(userId, type, limit);
}
