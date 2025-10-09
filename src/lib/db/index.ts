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
			// Create the postgres client with Cloudflare Workers optimized configuration
			const client = postgres(connectionString, {
				prepare: false,
				// Critical: Single connection and prevent pooling issues
				max: 1,
				// Shorter timeouts for Workers environment
				idle_timeout: 5,
				connect_timeout: 5,
				// DISABLE transform - this causes issues in Workers
				transform: undefined,
				// Minimal types configuration
				types: {},
				// Force SSL for cloud databases (Supabase requires SSL)
				ssl: 'require',
				// Minimal connection options
				connection: {
					application_name: 'cloudflare-worker'
				},
				// Critical: Disable features that cause connection reuse issues
				onnotice: () => {},
				debug: false,
				// Force connection cleanup
				max_lifetime: 60,
				// Prevent connection state issues
				fetch_types: false
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
