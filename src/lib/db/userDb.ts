import { createDrizzlePostgres } from './connection';

/** User/auth queries against the unified database. */
function getUserDb() {
	return createDrizzlePostgres({ label: 'user' });
}

export { getUserDb };
