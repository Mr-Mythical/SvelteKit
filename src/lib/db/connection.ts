/**
 * Shared Postgres + Drizzle connection factory.
 *
 * Raid analytics and user/auth share one Postgres instance (`DATABASE_USER_URL`).
 * Fresh client per request, no pooling, short timeouts — intentional for
 * Cloudflare Workers (avoids a prior "every other request" connection-state
 * bug). Don't pool here without a test that proves the underlying issue is gone.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { building } from '$app/environment';
import { env } from '$env/dynamic/private';
import { logServerError } from '../server/logger';

interface CreateDbOptions {
	/** e.g. 'raid' or 'user' — used in error messages and log scope. */
	label: string;
}

export function createDrizzlePostgres({ label }: CreateDbOptions) {
	if (building) {
		throw new Error(`${label} database not available during build time`);
	}

	const connectionString = env.DATABASE_USER_URL;
	if (!connectionString) {
		throw new Error('DATABASE_USER_URL is not defined in environment variables.');
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
