import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/lib/db/userSchema.ts',
	out: './drizzle/user',
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.DATABASE_USER_URL || process.env.DATABASE_URL!
	}
});
