import { and, eq } from 'drizzle-orm';
import { getUserDb } from '../../db/userDb';
import { userCharacters } from '../../db/userSchema';
import { dbOperation } from '../../db/_helpers';

export interface StoredCharacter {
	region: 'us' | 'eu' | 'kr' | 'tw';
	realmSlug: string;
	realmName: string;
	characterName: string;
	level: number;
	className: string | null;
	raceName: string | null;
	faction: 'ALLIANCE' | 'HORDE' | null;
	fetchedAt: Date;
}

export function getStoredCharacters(userId: string): Promise<StoredCharacter[]> {
	return dbOperation('getStoredCharacters', async () => {
		const db = getUserDb();
		const rows = await db.select().from(userCharacters).where(eq(userCharacters.userId, userId));

		return rows.map((row) => ({
			region: row.region as StoredCharacter['region'],
			realmSlug: row.realmSlug,
			realmName: row.realmName,
			characterName: row.characterName,
			level: row.level,
			className: row.className,
			raceName: row.raceName,
			faction: row.faction as StoredCharacter['faction'],
			fetchedAt: row.fetchedAt
		}));
	});
}

export interface CharacterUpsertInput {
	region: 'us' | 'eu' | 'kr' | 'tw';
	realmSlug: string;
	realmName: string;
	characterName: string;
	level: number;
	className: string | null;
	raceName: string | null;
	faction: 'ALLIANCE' | 'HORDE' | null;
}

/**
 * Replace the stored roster for a user with the supplied list. Called after
 * a successful Battle.net fetch so the DB mirrors the live roster (characters
 * deleted on bnet side also disappear here).
 */
export function replaceStoredCharacters(
	userId: string,
	characters: CharacterUpsertInput[]
): Promise<void> {
	return dbOperation('replaceStoredCharacters', async () => {
		const db = getUserDb();
		const now = new Date();

		await db.transaction(async (tx) => {
			await tx.delete(userCharacters).where(eq(userCharacters.userId, userId));

			if (characters.length === 0) return;

			await tx.insert(userCharacters).values(
				characters.map((character) => ({
					userId,
					region: character.region,
					realmSlug: character.realmSlug,
					realmName: character.realmName,
					characterName: character.characterName,
					level: character.level,
					className: character.className,
					raceName: character.raceName,
					faction: character.faction,
					fetchedAt: now
				}))
			);
		});
	});
}

export function deleteStoredCharacters(userId: string): Promise<void> {
	return dbOperation('deleteStoredCharacters', async () => {
		const db = getUserDb();
		await db.delete(userCharacters).where(eq(userCharacters.userId, userId));
	});
}

export function getLastRosterFetch(userId: string): Promise<Date | null> {
	return dbOperation('getLastRosterFetch', async () => {
		const db = getUserDb();
		const rows = await db
			.select({ fetchedAt: userCharacters.fetchedAt })
			.from(userCharacters)
			.where(eq(userCharacters.userId, userId))
			.limit(1);
		return rows[0]?.fetchedAt ?? null;
	});
}

// exported for diagnostics / admin tooling
export { userCharacters };
void and; // keep import if future filtered queries are needed
