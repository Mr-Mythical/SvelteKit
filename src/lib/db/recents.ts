import { eq, desc, and } from 'drizzle-orm';
import { getUserDb } from './userDb.js';
import { userRecents } from './userSchema.js';
import { dbOperation } from './_helpers';

export type RecentType = 'character' | 'report' | 'guild' | 'dungeon_run';

export interface RecentItem {
	type: RecentType;
	entityId: string;
	title: string;
	subtitle?: string;
	entityData: Record<string, unknown>;
	metadata?: Record<string, unknown>;
}

export interface UserRecentWithDetails {
	id: number;
	type: RecentType;
	entityId: string;
	title: string;
	subtitle?: string;
	entityData: Record<string, unknown>;
	metadata?: Record<string, unknown>;
	lastAccessedAt: Date;
	createdAt: Date;
}

/** Upsert a recent item. Updates lastAccessedAt + payload if it already exists. */
export function addUserRecent(userId: string, item: RecentItem): Promise<void> {
	return dbOperation('addUserRecent', async () => {
		const db = getUserDb();
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
	});
}

export function getUserRecents(
	userId: string,
	type?: RecentType,
	limit: number = 10
): Promise<UserRecentWithDetails[]> {
	return dbOperation('getUserRecents', async () => {
		const whereCondition = type
			? and(eq(userRecents.userId, userId), eq(userRecents.type, type))
			: eq(userRecents.userId, userId);

		const results = await getUserDb()
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
			entityData: r.entityData as Record<string, unknown>,
			metadata: (r.metadata as Record<string, unknown>) || {},
			lastAccessedAt: new Date(r.lastAccessedAt),
			createdAt: new Date(r.createdAt)
		}));
	});
}

export function removeUserRecent(
	userId: string,
	type: RecentType,
	entityId: string
): Promise<void> {
	return dbOperation('removeUserRecent', async () => {
		await getUserDb()
			.delete(userRecents)
			.where(
				and(
					eq(userRecents.userId, userId),
					eq(userRecents.type, type),
					eq(userRecents.entityId, entityId)
				)
			);
	});
}

export function clearUserRecents(userId: string, type?: RecentType): Promise<void> {
	return dbOperation('clearUserRecents', async () => {
		const whereCondition = type
			? and(eq(userRecents.userId, userId), eq(userRecents.type, type))
			: eq(userRecents.userId, userId);
		await getUserDb().delete(userRecents).where(whereCondition);
	});
}

export function createCharacterRecent(
	characterName: string,
	realm: string,
	region: string,
	additionalData: Record<string, unknown> = {}
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

export function createReportRecent(
	reportCode: string,
	reportTitle: string,
	guildName?: string,
	additionalData: Record<string, unknown> = {}
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

export function createGuildRecent(
	guildName: string,
	realm: string,
	region: string,
	additionalData: Record<string, unknown> = {}
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

export function createDungeonRunRecent(
	dungeonName: string,
	keystoneLevel: number,
	reportCode: string,
	additionalData: Record<string, unknown> = {}
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
