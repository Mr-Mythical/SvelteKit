import { eq, desc, and, sql } from 'drizzle-orm';
import { getUserDb } from './userDb';
import { userRecents } from './userSchema';

export interface RecentItem {
	id: number;
	userId: string;
	type: string;
	entityId: string;
	entityData: any;
	title: string;
	subtitle?: string | null;
	metadata: any;
	lastAccessedAt: Date;
	createdAt: Date;
}

/**
 * Add or update a recent item for a user
 */
export async function addUserRecent(
	userId: string,
	type: string,
	entityId: string,
	entityData: any,
	title: string,
	subtitle?: string,
	metadata: any = {}
): Promise<void> {
	try {
		const db = getUserDb();
		
		await db
			.insert(userRecents)
			.values({
				userId,
				type,
				entityId,
				entityData,
				title,
				subtitle,
				metadata,
				lastAccessedAt: new Date(),
				createdAt: new Date()
			})
			.onConflictDoUpdate({
				target: [userRecents.userId, userRecents.type, userRecents.entityId],
				set: {
					lastAccessedAt: new Date(),
					entityData,
					title,
					subtitle,
					metadata
				}
			});
			
		console.log(`Added recent ${type} for user:`, userId);
	} catch (error) {
		console.error('Error adding user recent:', error);
		throw error;
	}
}

/**
 * Get recent items for a user
 */
export async function getUserRecents(
	userId: string,
	type?: string,
	limit: number = 10
): Promise<RecentItem[]> {
	try {
		const db = getUserDb();
		
		const whereConditions = type 
			? and(eq(userRecents.userId, userId), eq(userRecents.type, type))
			: eq(userRecents.userId, userId);
		
		const recents = await db
			.select()
			.from(userRecents)
			.where(whereConditions)
			.orderBy(desc(userRecents.lastAccessedAt))
			.limit(limit);
			
		return recents;
	} catch (error) {
		console.error('Error getting user recents:', error);
		return [];
	}
}

/**
 * Delete a recent item
 */
export async function deleteUserRecent(userId: string, recentId: number): Promise<void> {
	try {
		const db = getUserDb();
		
		await db
			.delete(userRecents)
			.where(and(
				eq(userRecents.id, recentId),
				eq(userRecents.userId, userId)
			));
			
		console.log('Deleted recent item:', recentId);
	} catch (error) {
		console.error('Error deleting user recent:', error);
		throw error;
	}
}

/**
 * Clear all recents for a user
 */
export async function clearUserRecents(userId: string, type?: string): Promise<void> {
	try {
		const db = getUserDb();
		
		const whereConditions = type 
			? and(eq(userRecents.userId, userId), eq(userRecents.type, type))
			: eq(userRecents.userId, userId);
		
		await db
			.delete(userRecents)
			.where(whereConditions);
		
		console.log(`Cleared ${type ? type : 'all'} recents for user:`, userId);
	} catch (error) {
		console.error('Error clearing user recents:', error);
		throw error;
	}
}