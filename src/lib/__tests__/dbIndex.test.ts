import { describe, expect, it } from 'vitest';
import { getRaidDb } from '$lib/db';
import { getUserDb } from '$lib/db/userDb';

describe('db connection modules', () => {
	it('exports getRaidDb and getUserDb factory functions', () => {
		expect(typeof getRaidDb).toBe('function');
		expect(typeof getUserDb).toBe('function');
	});
});
