/**
 * Shared Postgres + Drizzle connection factory.
 *
 * Both databases (raid analytics + user/auth) connect with identical client
 * settings — fresh client per request, no pooling, short timeouts. This
 * module owns those settings so the two `getXxxDb()` wrappers in
 * `index.ts` and `userDb.ts` differ only by the env var they read and the
 * scope tag used for logging.
 *
 * The aggressive "no reuse, no pooling" client config is intentional: it
 * sidesteps a connection-state bug we've hit before that caused "every other
 * request" failures behind Cloudflare Workers. Don't pool here without a
 * test that proves the underlying issue is gone.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { building } from '$app/environment';
import { logServerError } from '../server/logger';

interface CreateDbOptions {
	/** e.g. 'raid' or 'user' — used in error messages and log scope. */
	label: string;
	/** Connection string. The caller resolves env vars. */
	connectionString: string | undefined;
	/** Friendly description of the env var(s) checked, for the error message. */
	connectionStringSource: string;
}

export function createDrizzlePostgres({
	label,
	connectionString,
	connectionStringSource
}: CreateDbOptions) {
	if (building) {
		throw new Error(`${label} database not available during build time`);
	}

	if (!connectionString) {
		throw new Error(`${connectionStringSource} is not defined in environment variables.`);
	}

	try {
		const client = postgres(connectionString, {
			// Disable all caching and state management — see module doc.
			prepare: false,
			max: 1,
			idle_timeout: 5,
			connect_timeout: 10,
			transform: undefined,
			types: {},
			onnotice: () => {},
			debug: false,
			fetch_types: false,
			max_lifetime: 30
		});

		return drizzle(client);
	} catch (error) {
		logServerError(`db/${label}`, 'database initialization failed', error);
		throw new Error(
			`Failed to initialize ${label} database connection: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}
