import { eq } from 'drizzle-orm';
import { getUserDb } from './userDb';
import { userProfiles } from './userSchema';
import { dbOperation } from './_helpers';

export interface BattleNetCredentials {
	battletag?: string;
	battlenetAccessToken?: string;
	battlenetRefreshToken?: string;
	battlenetExpiresAt?: Date;
}

export function updateUserLastSeen(userId: string): Promise<void> {
	return dbOperation('updateUserLastSeen', async () => {
		await getUserDb()
			.update(userProfiles)
			.set({ updatedAt: new Date() })
			.where(eq(userProfiles.id, userId));
	});
}

export function createOrUpdateUserProfile(
	userId: string,
	data: BattleNetCredentials
): Promise<void> {
	return dbOperation('createOrUpdateUserProfile', async () => {
		const now = new Date();
		await getUserDb()
			.insert(userProfiles)
			.values({
				id: userId,
				battletag: data.battletag,
				battlenetAccessToken: data.battlenetAccessToken,
				battlenetRefreshToken: data.battlenetRefreshToken,
				battlenetExpiresAt: data.battlenetExpiresAt,
				lastSeenAt: now,
				updatedAt: now
			})
			.onConflictDoUpdate({
				target: userProfiles.id,
				set: {
					lastSeenAt: now,
					updatedAt: now,
					...(data.battletag && { battletag: data.battletag }),
					...(data.battlenetAccessToken && { battlenetAccessToken: data.battlenetAccessToken }),
					...(data.battlenetRefreshToken && { battlenetRefreshToken: data.battlenetRefreshToken }),
					...(data.battlenetExpiresAt && { battlenetExpiresAt: data.battlenetExpiresAt })
				}
			});
	});
}

export type UserProfileRow = typeof userProfiles.$inferSelect;

export function getUserProfile(userId: string): Promise<UserProfileRow | null> {
	return dbOperation('getUserProfile', async () => {
		const profile = await getUserDb()
			.select()
			.from(userProfiles)
			.where(eq(userProfiles.id, userId))
			.limit(1);
		return profile[0] ?? null;
	});
}

export function updateUserPreferences(
	userId: string,
	preferences: Record<string, unknown>
): Promise<void> {
	return dbOperation('updateUserPreferences', async () => {
		await getUserDb()
			.update(userProfiles)
			.set({ preferences, updatedAt: new Date() })
			.where(eq(userProfiles.id, userId));
	});
}
