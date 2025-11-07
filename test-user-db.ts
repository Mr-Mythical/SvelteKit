/**
 * Test script to verify user database connection
 * Run this with: node --loader tsx/esm test-user-db.ts
 */

import { getUserDb } from './src/lib/db/userDb.js';
import { users } from './src/lib/db/userSchema.js';

async function testConnection() {
	try {
		console.log('Testing user database connection...');
		
		const db = getUserDb();
		
		// Try a simple query to verify connection
		const result = await db.select().from(users).limit(1);
		
		console.log('✅ User database connection successful!');
		console.log(`Found ${result.length} users in the database`);
		
		return true;
	} catch (error) {
		console.error('❌ User database connection failed:', error);
		return false;
	}
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
	testConnection().then(success => {
		process.exit(success ? 0 : 1);
	});
}

export { testConnection };