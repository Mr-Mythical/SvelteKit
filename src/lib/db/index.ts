import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';
import { building } from '$app/environment';

// Lazy initialization to avoid SSR issues
let db: ReturnType<typeof drizzle> | null = null;

function getDb() {
	if (!db && !building) {
		// Get the Supabase connection string from environment variables
		const connectionString = env.DATABASE_URL;

		if (!connectionString) {
			throw new Error('DATABASE_URL is not defined in environment variables.');
		}

		// Create the postgres client
		// Disable prefetch as it is not supported for "Transaction" pool mode
		const client = postgres(connectionString, { prepare: false });

		// Create the Drizzle database instance
		db = drizzle(client);
	}

	if (!db) {
		throw new Error('Database not available during build time');
	}

	return db;
}

export { getDb as db };