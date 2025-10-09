import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';
import { building } from '$app/environment';

// Lazy initialization to avoid SSR issues
let db: ReturnType<typeof drizzle> | null = null;
let isInitializing = false;

function getDb() {
	if (!db && !building && !isInitializing) {
		isInitializing = true;
		// Get the database connection string from environment variables
		const connectionString = env.DATABASE_URL;

		if (!connectionString) {
			throw new Error('DATABASE_URL is not defined in environment variables.');
		}

		try {
			// Create the postgres client with Cloudflare Workers compatible configuration
			const client = postgres(connectionString, {
				prepare: false,
				// Single connection for Workers
				max: 1,
				// Reasonable timeouts for Workers environment  
				idle_timeout: 20,
				connect_timeout: 10,
				// Keep transform for proper camelCase conversion (required for Drizzle schema)
				transform: postgres.camel,
				// Minimal connection options - let connection string handle SSL
				connection: {
					application_name: 'cloudflare-worker'
				},
				// Disable notices to reduce noise
				onnotice: () => {},
				debug: false
			});

			// Create the Drizzle database instance
			db = drizzle(client);
			isInitializing = false;
		} catch (error) {
			isInitializing = false;
			console.error('Database initialization error:', error);
			throw new Error(
				`Failed to initialize database connection: ${error instanceof Error ? error.message : 'Unknown error'}`
			);
		}
	}

	if (!db) {
		throw new Error('Database not available during build time');
	}

	return db;
}

export { getDb as db };
