import { createDrizzlePostgres } from './connection';

/** Raid analytics queries against the unified database. */
function getRaidDb() {
	return createDrizzlePostgres({ label: 'raid' });
}

export { getRaidDb };
