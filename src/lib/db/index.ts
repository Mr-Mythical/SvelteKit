import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';
import { building } from '$app/environment';

// Create a completely fresh database connection for each request
// This prevents connection state issues that cause "every other request" failures
function getDb() {
	if (building) {
		throw new Error('Database not available during build time');
	}

	// Get the database connection string from environment variables
	const connectionString = env.DATABASE_URL;

	if (!connectionString) {
		throw new Error('DATABASE_URL is not defined in environment variables.');
	}

	try {
		// Create a fresh client for EVERY request - no reuse, no pooling, no state
		const client = postgres(connectionString, {
			// Disable all caching and state management
			prepare: false,
			// Single connection, but create fresh each time
			max: 1,
			// Short timeouts to ensure cleanup
			idle_timeout: 5,
			connect_timeout: 10,
			// No transform to avoid transform state issues
			transform: undefined,
			// Minimal types to avoid type caching issues
			types: {},
			// Disable all extra features
			onnotice: () => {},
			debug: false,
			fetch_types: false,
			// Force connection to close after a short time
			max_lifetime: 30
		});

		// Create the Drizzle database instance
		return drizzle(client);
	} catch (error) {
		console.error('Database initialization error:', error);
		throw new Error(
			`Failed to initialize database connection: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}
}

export { getDb as db };
