import { describe, it, expect } from 'vitest';

describe('Drizzle configuration modules', () => {
	it('exports a primary drizzle config with expected shape', async () => {
		const mod = await import('../../../drizzle.config');
		const config = mod.default as Record<string, unknown>;

		expect(config).toBeTruthy();
		expect(config.schema).toBe('./src/lib/db/schema.ts');
		expect(config.out).toBe('./drizzle');
		expect(config.dialect).toBe('postgresql');
		expect(config.dbCredentials).toBeTruthy();
	});

	it('exports a user drizzle config with expected shape', async () => {
		const mod = await import('../../../drizzle.user.config');
		const config = mod.default as Record<string, unknown>;

		expect(config).toBeTruthy();
		expect(config.schema).toBe('./src/lib/db/userSchema.ts');
		expect(config.out).toBe('./drizzle/user');
		expect(config.dialect).toBe('postgresql');
		expect(config.dbCredentials).toBeTruthy();
	});
});
