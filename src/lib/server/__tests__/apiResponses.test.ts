import { describe, expect, it } from 'vitest';
import { apiError, apiOk } from '../apiResponses';

describe('apiError', () => {
	it('returns a JSON Response with default 500 status', async () => {
		const r = apiError('boom');
		expect(r).toBeInstanceOf(Response);
		expect(r.status).toBe(500);
		expect(r.headers.get('content-type')).toContain('application/json');
		expect(await r.json()).toEqual({ error: 'boom' });
	});

	it('honors a custom status code', async () => {
		const r = apiError('not found', 404);
		expect(r.status).toBe(404);
		expect(await r.json()).toEqual({ error: 'not found' });
	});

	it('uses the consistent error envelope shape', async () => {
		const body = (await apiError('x', 502).json()) as Record<string, unknown>;
		expect(Object.keys(body)).toEqual(['error']);
	});
});

describe('apiOk', () => {
	it('serializes the body and defaults to 200', async () => {
		const r = apiOk({ data: [1, 2, 3] });
		expect(r.status).toBe(200);
		expect(await r.json()).toEqual({ data: [1, 2, 3] });
	});

	it('honors a custom status code', async () => {
		const r = apiOk({ ok: true }, 201);
		expect(r.status).toBe(201);
	});

	it('preserves null and primitive bodies', async () => {
		expect(await apiOk(null).json()).toBeNull();
		expect(await apiOk('hi').json()).toBe('hi');
		expect(await apiOk(42).json()).toBe(42);
	});
});
