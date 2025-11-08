// Quick migration to fix email column
import { getUserDb } from './src/lib/db/userDb.js';

async function fixEmailColumn() {
	console.log('Fixing email column to be nullable...');
	
	const db = getUserDb();
	
	try {
		await db.execute('ALTER TABLE users ALTER COLUMN email DROP NOT NULL');
		console.log('✅ Email column is now nullable');
	} catch (error) {
		console.error('Migration failed:', error);
		if (error.message?.includes('column "email" is already nullable')) {
			console.log('✅ Email column was already nullable');
		}
	}
}

fixEmailColumn().catch(console.error);