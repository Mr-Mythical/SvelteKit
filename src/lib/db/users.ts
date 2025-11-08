import { eq, desc, sql } from 'drizzle-orm';
import { getUserDb } from './userDb';
import { userProfiles } from './userSchema';

/**
 * Update user's last seen timestamp
 */
export async function updateUserLastSeen(userId: string): Promise<void> {
	try {
		const db = getUserDb();

		await db
			.update(userProfiles)
			.set({
				lastSeenAt: new Date(),
				updatedAt: new Date()
			})
			.where(eq(userProfiles.id, userId));

		console.log('Updated last seen for user:', userId);
	} catch (error) {
		console.error('Error updating user last seen:', error);
		throw error;
	}
}

/**
 * Create or update user profile
 */
export async function createOrUpdateUserProfile(
	userId: string,
	data: {
		battletag?: string;
		battlenetAccessToken?: string;
		battlenetRefreshToken?: string;
		battlenetExpiresAt?: Date;
	}
): Promise<void> {
	try {
		const db = getUserDb();

		await db
			.insert(userProfiles)
			.values({
				id: userId,
				battletag: data.battletag,
				battlenetAccessToken: data.battlenetAccessToken,
				battlenetRefreshToken: data.battlenetRefreshToken,
				battlenetExpiresAt: data.battlenetExpiresAt,
				lastSeenAt: new Date(),
				updatedAt: new Date()
			})
			.onConflictDoUpdate({
				target: userProfiles.id,
				set: {
					lastSeenAt: new Date(),
					updatedAt: new Date(),
					...(data.battletag && { battletag: data.battletag }),
					...(data.battlenetAccessToken && { battlenetAccessToken: data.battlenetAccessToken }),
					...(data.battlenetRefreshToken && { battlenetRefreshToken: data.battlenetRefreshToken }),
					...(data.battlenetExpiresAt && { battlenetExpiresAt: data.battlenetExpiresAt })
				}
			});

		console.log('Created/updated user profile for:', userId);
	} catch (error) {
		console.error('Error creating/updating user profile:', error);
		throw error;
	}
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string) {
	try {
		const db = getUserDb();

		const profile = await db
			.select()
			.from(userProfiles)
			.where(eq(userProfiles.id, userId))
			.limit(1);

		return profile[0] || null;
	} catch (error) {
		console.error('Error getting user profile:', error);
		return null;
	}
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
	userId: string,
	preferences: Record<string, any>
): Promise<void> {
	try {
		const db = getUserDb();

		await db
			.update(userProfiles)
			.set({
				preferences: preferences,
				updatedAt: new Date()
			})
			.where(eq(userProfiles.id, userId));

		console.log('Updated preferences for user:', userId);
	} catch (error) {
		console.error('Error updating user preferences:', error);
		throw error;
	}
}
