import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';
import { building } from '$app/environment';

// Lazy initialization to avoid SSR issues
let db: ReturnType<typeof drizzle> | null = null;

function getDb() {
	if (!db && !building) {
		// Get the database connection string from environment variables
		const connectionString = env.DATABASE_URL;

		if (!connectionString) {
			throw new Error('DATABASE_URL is not defined in environment variables.');
		}

		try {
			// Create the postgres client with minimal configuration for Cloudflare Workers
			const client = postgres(connectionString, {
				prepare: false,
				// Reduce connections for Workers environment
				max: 1,
				idle_timeout: 20,
				// Disable transforms that might cause issues
				transform: undefined,
				types: {},
				// Use minimal connection options
				connection: {
					application_name: 'cloudflare-worker'
				}
			});

			// Create the Drizzle database instance
			db = drizzle(client);
		} catch (error) {
			console.error('Database initialization error:', error);
			throw new Error('Failed to initialize database connection');
		}
	}

	if (!db) {
		throw new Error('Database not available during build time');
	}

	return db;
}

export { getDb as db };
