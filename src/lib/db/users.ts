import { eq, desc, and, sql } from 'drizzle-orm';
import { getUserDb } from './userDb';
import { users, accounts, sessions, userRecents } from './userSchema';

// =============================================================================
// TYPES
// =============================================================================

export interface CreateUserData {
	id: string; // Auth.js user ID
	battletag: string;
	email?: string;
	name?: string;
	image?: string;
	preferences?: Record<string, any>;
	battlenetAccessToken?: string;
	battlenetRefreshToken?: string;
	battlenetExpiresAt?: Date;
}

export interface UpdateUserData {
	battletag?: string;
	email?: string;
	name?: string;
	image?: string;
	preferences?: Record<string, any>;
	battlenetAccessToken?: string;
	battlenetRefreshToken?: string;
	battlenetExpiresAt?: Date;
	lastSeenAt?: Date;
	isActive?: boolean;
}

export interface UserWithDetails {
	id: string;
	battletag: string;
	email?: string;
	name?: string;
	image?: string;
	createdAt: Date;
	updatedAt: Date;
	lastSeenAt: Date;
	isActive: boolean;
	preferences: Record<string, any>;
	battlenetAccessToken?: string;
	battlenetRefreshToken?: string;
	battlenetExpiresAt?: Date;
}

// =============================================================================
// USER OPERATIONS
// =============================================================================

/**
 * Create a new user
 */
export async function createUser(userData: CreateUserData): Promise<UserWithDetails> {
	const db = getUserDb();

	try {
		const [user] = await db
			.insert(users)
			.values({
				id: userData.id,
				battletag: userData.battletag,
				email: userData.email || null,
				name: userData.name || null,
				image: userData.image || null,
				preferences: userData.preferences || {},
				battlenetAccessToken: userData.battlenetAccessToken || null,
				battlenetRefreshToken: userData.battlenetRefreshToken || null,
				battlenetExpiresAt: userData.battlenetExpiresAt || null,
				createdAt: new Date(),
				updatedAt: new Date(),
				lastSeenAt: new Date(),
				isActive: true
			})
			.returning();

		return {
			id: user.id,
			battletag: user.battletag,
			email: user.email || undefined,
			name: user.name || undefined,
			image: user.image || undefined,
			createdAt: new Date(user.createdAt),
			updatedAt: new Date(user.updatedAt),
			lastSeenAt: new Date(user.lastSeenAt),
			isActive: user.isActive,
			preferences: (user.preferences as Record<string, any>) || {},
			battlenetAccessToken: user.battlenetAccessToken || undefined,
			battlenetRefreshToken: user.battlenetRefreshToken || undefined,
			battlenetExpiresAt: user.battlenetExpiresAt ? new Date(user.battlenetExpiresAt) : undefined
		};
	} catch (error) {
		console.error('Error creating user:', error);
		throw error;
	}
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<UserWithDetails | null> {
	const db = getUserDb();

	try {
		const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

		if (!user) return null;

		return {
			id: user.id,
			battletag: user.battletag,
			email: user.email || undefined,
			name: user.name || undefined,
			image: user.image || undefined,
			createdAt: new Date(user.createdAt),
			updatedAt: new Date(user.updatedAt),
			lastSeenAt: new Date(user.lastSeenAt),
			isActive: user.isActive,
			preferences: (user.preferences as Record<string, any>) || {},
			battlenetAccessToken: user.battlenetAccessToken || undefined,
			battlenetRefreshToken: user.battlenetRefreshToken || undefined,
			battlenetExpiresAt: user.battlenetExpiresAt ? new Date(user.battlenetExpiresAt) : undefined
		};
	} catch (error) {
		console.error('Error getting user by ID:', error);
		throw error;
	}
}

/**
 * Get user by battletag
 */
export async function getUserByBattletag(battletag: string): Promise<UserWithDetails | null> {
	const db = getUserDb();

	try {
		const [user] = await db.select().from(users).where(eq(users.battletag, battletag)).limit(1);

		if (!user) return null;

		return {
			id: user.id,
			battletag: user.battletag,
			email: user.email || undefined,
			name: user.name || undefined,
			image: user.image || undefined,
			createdAt: new Date(user.createdAt),
			updatedAt: new Date(user.updatedAt),
			lastSeenAt: new Date(user.lastSeenAt),
			isActive: user.isActive,
			preferences: (user.preferences as Record<string, any>) || {},
			battlenetAccessToken: user.battlenetAccessToken || undefined,
			battlenetRefreshToken: user.battlenetRefreshToken || undefined,
			battlenetExpiresAt: user.battlenetExpiresAt ? new Date(user.battlenetExpiresAt) : undefined
		};
	} catch (error) {
		console.error('Error getting user by battletag:', error);
		throw error;
	}
}

/**
 * Update user data
 */
export async function updateUser(
	userId: string,
	updateData: UpdateUserData
): Promise<UserWithDetails | null> {
	const db = getUserDb();

	try {
		const [user] = await db
			.update(users)
			.set({
				...updateData,
				updatedAt: new Date()
			})
			.where(eq(users.id, userId))
			.returning();

		if (!user) return null;

		return {
			id: user.id,
			battletag: user.battletag,
			email: user.email || undefined,
			name: user.name || undefined,
			image: user.image || undefined,
			createdAt: new Date(user.createdAt),
			updatedAt: new Date(user.updatedAt),
			lastSeenAt: new Date(user.lastSeenAt),
			isActive: user.isActive,
			preferences: (user.preferences as Record<string, any>) || {},
			battlenetAccessToken: user.battlenetAccessToken || undefined,
			battlenetRefreshToken: user.battlenetRefreshToken || undefined,
			battlenetExpiresAt: user.battlenetExpiresAt ? new Date(user.battlenetExpiresAt) : undefined
		};
	} catch (error) {
		console.error('Error updating user:', error);
		throw error;
	}
}

/**
 * Update user's last seen timestamp
 */
export async function updateUserLastSeen(userId: string): Promise<void> {
	const db = getUserDb();

	try {
		await db
			.update(users)
			.set({
				lastSeenAt: new Date(),
				updatedAt: new Date()
			})
			.where(eq(users.id, userId));
	} catch (error) {
		console.error('Error updating user last seen:', error);
		// Don't throw - this is not critical
	}
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
	userId: string,
	preferences: Record<string, any>
): Promise<void> {
	const db = getUserDb();

	try {
		await db
			.update(users)
			.set({
				preferences,
				updatedAt: new Date()
			})
			.where(eq(users.id, userId));
	} catch (error) {
		console.error('Error updating user preferences:', error);
		throw error;
	}
}

/**
 * Get user preferences
 */
export async function getUserPreferences(userId: string): Promise<Record<string, any>> {
	const user = await getUserById(userId);
	return user?.preferences || {};
}

/**
 * Update a specific user preference
 */
export async function updateUserPreference(userId: string, key: string, value: any): Promise<void> {
	const currentPrefs = await getUserPreferences(userId);
	const newPrefs = { ...currentPrefs, [key]: value };
	await updateUserPreferences(userId, newPrefs);
}

/**
 * Check if user has completed old data import
 */
export async function hasCompletedOldDataImport(userId: string): Promise<boolean> {
	const preferences = await getUserPreferences(userId);
	return preferences.oldDataImportCompleted === true;
}

/**
 * Mark old data import as completed for user
 */
export async function markOldDataImportCompleted(userId: string): Promise<void> {
	await updateUserPreference(userId, 'oldDataImportCompleted', true);
}

/**
 * Deactivate user account
 */
export async function deactivateUser(userId: string): Promise<void> {
	const db = getUserDb();

	try {
		await db
			.update(users)
			.set({
				isActive: false,
				updatedAt: new Date()
			})
			.where(eq(users.id, userId));
	} catch (error) {
		console.error('Error deactivating user:', error);
		throw error;
	}
}

/**
 * Reactivate user account
 */
export async function reactivateUser(userId: string): Promise<void> {
	const db = getUserDb();

	try {
		await db
			.update(users)
			.set({
				isActive: true,
				lastSeenAt: new Date(),
				updatedAt: new Date()
			})
			.where(eq(users.id, userId));
	} catch (error) {
		console.error('Error reactivating user:', error);
		throw error;
	}
}

/**
 * Delete user and all associated data
 */
export async function deleteUser(userId: string): Promise<void> {
	const db = getUserDb();

	try {
		// The foreign key constraints with CASCADE will handle cleaning up
		// accounts, sessions, and userRecents
		await db.delete(users).where(eq(users.id, userId));
	} catch (error) {
		console.error('Error deleting user:', error);
		throw error;
	}
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create or update user from Auth.js session data
 */
export async function upsertUserFromAuth(authData: {
	id: string;
	battletag?: string;
	name?: string;
	email?: string;
	image?: string;
}): Promise<UserWithDetails> {
	const db = getUserDb();

	try {
		// Try to get existing user
		const existingUser = await getUserById(authData.id);

		if (existingUser) {
			// Update existing user
			const updateData: UpdateUserData = {
				lastSeenAt: new Date()
			};

			// Update fields if they've changed
			if (authData.battletag && authData.battletag !== existingUser.battletag) {
				updateData.battletag = authData.battletag;
			}
			if (authData.name && authData.name !== existingUser.name) {
				updateData.name = authData.name;
			}
			if (authData.email && authData.email !== existingUser.email) {
				updateData.email = authData.email;
			}
			if (authData.image && authData.image !== existingUser.image) {
				updateData.image = authData.image;
			}

			const updatedUser = await updateUser(authData.id, updateData);
			return updatedUser!;
		} else {
			// Create new user
			const newUserData: CreateUserData = {
				id: authData.id,
				battletag: authData.battletag || authData.name || 'Unknown#0000',
				name: authData.name,
				email: authData.email,
				image: authData.image
			};

			return await createUser(newUserData);
		}
	} catch (error) {
		console.error('Error upserting user from auth:', error);
		throw error;
	}
}

/**
 * Get user stats (for admin/analytics)
 */
export async function getUserStats(userId: string): Promise<{
	recentsCount: number;
	accountAge: number; // days
	lastActive: Date;
}> {
	const db = getUserDb();

	try {
		const user = await getUserById(userId);
		if (!user) {
			throw new Error('User not found');
		}

		// Get counts from related tables
		const [recentsResult] = await db
			.select({ count: sql`count(*)`.mapWith(Number) })
			.from(userRecents)
			.where(eq(userRecents.userId, userId));

		const accountAge = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));

		return {
			recentsCount: recentsResult?.count || 0,
			accountAge,
			lastActive: user.lastSeenAt
		};
	} catch (error) {
		console.error('Error getting user stats:', error);
		throw error;
	}
}
