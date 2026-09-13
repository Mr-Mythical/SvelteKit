import { describe, it, expect } from 'vitest';

describe('Drizzle configuration modules', () => {
	it('exports a unified drizzle config with both domain schemas', async () => {
		const mod = await import('../../../drizzle.config');
		const config = mod.default as Record<string, unknown>;

		expect(config).toBeTruthy();
		expect(config.schema).toEqual(['./src/lib/db/schema.ts', './src/lib/db/userSchema.ts']);
		expect(config.out).toBe('./drizzle/user');
		expect(config.dialect).toBe('postgresql');
		expect(config.dbCredentials).toBeTruthy();
	});
});
