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

		// For Cloudflare Workers, we need to use connection options that don't rely on Node.js features
		// This will work better with the nodejs_compat flag
		const client = postgres(connectionString, { 
			prepare: false,
			// These options help with Cloudflare Workers compatibility
			transform: postgres.camel,
			connection: {
				// Disable features that might cause issues in Workers
				application_name: 'sveltekit-app'
			}
		});

		// Create the Drizzle database instance
		db = drizzle(client);
	}

	if (!db) {
		throw new Error('Database not available during build time');
	}

	return db;
}

export { getDb as db };
