import { eq, desc, and } from 'drizzle-orm';
import { getUserDb } from './userDb.js';
import { userRecents, users } from './userSchema.js';

// =============================================================================
// TYPES
// =============================================================================

export type RecentType = 'character' | 'report' | 'guild' | 'dungeon_run';

export interface RecentItem {
	type: RecentType;
	entityId: string;
	title: string;
	subtitle?: string;
	entityData: Record<string, any>;
	metadata?: Record<string, any>;
}

export interface UserRecentWithDetails {
	id: number;
	type: RecentType;
	entityId: string;
	title: string;
	subtitle?: string;
	entityData: Record<string, any>;
	metadata?: Record<string, any>;
	lastAccessedAt: Date;
	createdAt: Date;
}

// =============================================================================
// USER RECENTS OPERATIONS
// =============================================================================

/**
 * Add or update a recent item for a user
 * If the item already exists, it updates the lastAccessedAt timestamp
 */
export async function addUserRecent(userId: string, item: RecentItem): Promise<void> {
	const db = getUserDb();

	try {
		// First try to update if exists
		const updated = await db
			.update(userRecents)
			.set({
				lastAccessedAt: new Date(),
				entityData: item.entityData,
				title: item.title,
				subtitle: item.subtitle,
				metadata: item.metadata || {}
			})
			.where(
				and(
					eq(userRecents.userId, userId),
					eq(userRecents.type, item.type),
					eq(userRecents.entityId, item.entityId)
				)
			)
			.returning();

		// If no rows updated, insert new record
		if (updated.length === 0) {
			await db.insert(userRecents).values({
				userId,
				type: item.type,
				entityId: item.entityId,
				title: item.title,
				subtitle: item.subtitle,
				entityData: item.entityData,
				metadata: item.metadata || {}
			});
		}
	} catch (error) {
		console.error('Error adding user recent:', error);
		throw error;
	}
}

/**
 * Get recent items for a user, optionally filtered by type
 */
export async function getUserRecents(
	userId: string,
	type?: RecentType,
	limit: number = 10
): Promise<UserRecentWithDetails[]> {
	const db = getUserDb();

	try {
		const whereCondition = type
			? and(eq(userRecents.userId, userId), eq(userRecents.type, type))
			: eq(userRecents.userId, userId);

		const results = await db
			.select()
			.from(userRecents)
			.where(whereCondition)
			.orderBy(desc(userRecents.lastAccessedAt))
			.limit(limit);

		return results.map((r) => ({
			id: r.id,
			type: r.type as RecentType,
			entityId: r.entityId,
			title: r.title,
			subtitle: r.subtitle || undefined,
			entityData: r.entityData as Record<string, any>,
			metadata: (r.metadata as Record<string, any>) || {},
			lastAccessedAt: new Date(r.lastAccessedAt),
			createdAt: new Date(r.createdAt)
		}));
	} catch (error) {
		console.error('Error getting user recents:', error);
		throw error;
	}
}

/**
 * Remove a recent item for a user
 */
export async function removeUserRecent(
	userId: string,
	type: RecentType,
	entityId: string
): Promise<void> {
	const db = getUserDb();

	try {
		await db
			.delete(userRecents)
			.where(
				and(
					eq(userRecents.userId, userId),
					eq(userRecents.type, type),
					eq(userRecents.entityId, entityId)
				)
			);
	} catch (error) {
		console.error('Error removing user recent:', error);
		throw error;
	}
}

/**
 * Clear all recents for a user, optionally filtered by type
 */
export async function clearUserRecents(userId: string, type?: RecentType): Promise<void> {
	const db = getUserDb();

	try {
		const whereCondition = type
			? and(eq(userRecents.userId, userId), eq(userRecents.type, type))
			: eq(userRecents.userId, userId);

		await db.delete(userRecents).where(whereCondition);
	} catch (error) {
		console.error('Error clearing user recents:', error);
		throw error;
	}
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Helper function to create character recent items
 */
export function createCharacterRecent(
	characterName: string,
	realm: string,
	region: string,
	additionalData: Record<string, any> = {}
): RecentItem {
	return {
		type: 'character',
		entityId: `${characterName}-${realm}-${region}`,
		title: characterName,
		subtitle: `${realm} (${region.toUpperCase()})`,
		entityData: {
			name: characterName,
			realm,
			region,
			...additionalData
		}
	};
}

/**
 * Helper function to create report recent items
 */
export function createReportRecent(
	reportCode: string,
	reportTitle: string,
	guildName?: string,
	additionalData: Record<string, any> = {}
): RecentItem {
	return {
		type: 'report',
		entityId: reportCode,
		title: reportTitle,
		subtitle: guildName,
		entityData: {
			reportCode,
			title: reportTitle,
			guildName,
			...additionalData
		}
	};
}

/**
 * Helper function to create guild recent items
 */
export function createGuildRecent(
	guildName: string,
	realm: string,
	region: string,
	additionalData: Record<string, any> = {}
): RecentItem {
	return {
		type: 'guild',
		entityId: `${guildName}-${realm}-${region}`,
		title: guildName,
		subtitle: `${realm} (${region.toUpperCase()})`,
		entityData: {
			name: guildName,
			realm,
			region,
			...additionalData
		}
	};
}

/**
 * Helper function to create dungeon run recent items
 */
export function createDungeonRunRecent(
	dungeonName: string,
	keystoneLevel: number,
	reportCode: string,
	additionalData: Record<string, any> = {}
): RecentItem {
	return {
		type: 'dungeon_run',
		entityId: `${reportCode}-${dungeonName}-${keystoneLevel}`,
		title: `${dungeonName} +${keystoneLevel}`,
		subtitle: `Report: ${reportCode}`,
		entityData: {
			dungeonName,
			keystoneLevel,
			reportCode,
			...additionalData
		}
	};
}
