import { env } from '$env/dynamic/private';
import { createDrizzlePostgres } from './connection';

// User database connection for user management, recents, favorites, etc.
function getUserDb() {
	return createDrizzlePostgres({
		label: 'user',
		connectionString: env.DATABASE_USER_URL || env.DATABASE_URL,
		connectionStringSource: 'DATABASE_USER_URL or DATABASE_URL'
	});
}

export { getUserDb };
