import { eq, desc, and, notInArray } from 'drizzle-orm';
import { getUserDb } from './userDb';
import { userRecents } from './userSchema';
import { dbOperation } from './_helpers';

const RECENT_RETENTION_BY_TYPE: Record<string, number> = {
	report: 6,
	character: 6,
	guild: 6,
	dungeon_run: 6,
	current_state: 1
};

const DEFAULT_RECENT_RETENTION = 6;

function getRetentionLimit(type: string): number {
	return RECENT_RETENTION_BY_TYPE[type] ?? DEFAULT_RECENT_RETENTION;
}

async function trimUserRecentsByType(userId: string, type: string): Promise<void> {
	const db = getUserDb();
	const keepLimit = getRetentionLimit(type);

	const newestIds = await db
		.select({ id: userRecents.id })
		.from(userRecents)
		.where(and(eq(userRecents.userId, userId), eq(userRecents.type, type)))
		.orderBy(desc(userRecents.lastAccessedAt), desc(userRecents.id))
		.limit(keepLimit);

	if (newestIds.length === 0) return;

	const idsToKeep = newestIds.map((row) => row.id);

	await db
		.delete(userRecents)
		.where(
			and(
				eq(userRecents.userId, userId),
				eq(userRecents.type, type),
				notInArray(userRecents.id, idsToKeep)
			)
		);
}

// =============================================================================
// Discriminated union for entityData payloads. Each `type` carries a known shape
// so callers don't have to cast through `any` at the boundary.
// =============================================================================

export interface CharacterRecentData {
	characterName: string;
	realm: string;
	region: string;
}

export interface ReportRecentData {
	code: string;
	title?: string;
	guild?: string;
	owner?: string;
}

export interface GuildRecentData {
	name: string;
	realm: string;
	region: string;
}

export interface DungeonRunRecentData {
	reportCode: string;
	dungeonName: string;
	keystoneLevel: number;
}

export interface CurrentStateRecentData {
	urlParams: string;
	timestamp: number;
}

export type RecentEntityData =
	| { type: 'character'; data: CharacterRecentData }
	| { type: 'report'; data: ReportRecentData }
	| { type: 'guild'; data: GuildRecentData }
	| { type: 'dungeon_run'; data: DungeonRunRecentData }
	| { type: 'current_state'; data: CurrentStateRecentData };

export type RecentEntityType = RecentEntityData['type'];

export interface RecentItem<T = unknown> {
	id: number;
	userId: string;
	type: string;
	entityId: string;
	entityData: T;
	title: string;
	subtitle?: string | null;
	metadata: Record<string, unknown>;
	lastAccessedAt: Date;
	createdAt: Date;
}

export function addUserRecent(
	userId: string,
	type: string,
	entityId: string,
	entityData: unknown,
	title: string,
	subtitle?: string,
	metadata: Record<string, unknown> = {}
): Promise<void> {
	return dbOperation('addUserRecent', async () => {
		const db = getUserDb();
		const insertData = {
			userId,
			type,
			entityId,
			entityData,
			title,
			subtitle,
			metadata,
			lastAccessedAt: new Date(),
			createdAt: new Date()
		};

		await db
			.insert(userRecents)
			.values(insertData)
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

		// Keep recents bounded per type so the table does not grow unbounded.
		await trimUserRecentsByType(userId, type);
	});
}

export function getUserRecents<T = unknown>(
	userId: string,
	type?: string,
	limit: number = 6
): Promise<RecentItem<T>[]> {
	return dbOperation('getUserRecents', async () => {
		const whereConditions = type
			? and(eq(userRecents.userId, userId), eq(userRecents.type, type))
			: eq(userRecents.userId, userId);

		const recents = await getUserDb()
			.select()
			.from(userRecents)
			.where(whereConditions)
			.orderBy(desc(userRecents.lastAccessedAt))
			.limit(limit);

		return recents as unknown as RecentItem<T>[];
	});
}

export function deleteUserRecent(userId: string, recentId: number): Promise<void> {
	return dbOperation('deleteUserRecent', async () => {
		await getUserDb()
			.delete(userRecents)
			.where(and(eq(userRecents.id, recentId), eq(userRecents.userId, userId)));
	});
}

export function clearUserRecents(userId: string, type?: string): Promise<void> {
	return dbOperation('clearUserRecents', async () => {
		const whereConditions = type
			? and(eq(userRecents.userId, userId), eq(userRecents.type, type))
			: eq(userRecents.userId, userId);
		await getUserDb().delete(userRecents).where(whereConditions);
	});
}
