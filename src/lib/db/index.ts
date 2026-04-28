import { env } from '$env/dynamic/private';
import { createDrizzlePostgres } from './connection';

// Create a completely fresh database connection for each request
// This prevents connection state issues that cause "every other request" failures
function getRaidDb() {
	return createDrizzlePostgres({
		label: 'raid',
		connectionString: env.DATABASE_URL,
		connectionStringSource: 'DATABASE_URL'
	});
}

export { getRaidDb };
