import { describe, expect, it } from 'vitest';
import { getRaidDb } from '$lib/db';

describe('db index module', () => {
	it('exports getRaidDb factory function', () => {
		expect(typeof getRaidDb).toBe('function');
	});
});
