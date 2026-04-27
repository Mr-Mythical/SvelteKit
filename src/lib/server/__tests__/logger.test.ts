import { describe, expect, it, vi, afterEach } from 'vitest';
import { logServerError, logServerWarn, handleApiError } from '$lib/server/logger';

afterEach(() => {
	vi.restoreAllMocks();
});

describe('logServerError', () => {
	it('prefixes the message with [scope] and forwards the error object', () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const err = new Error('boom');
		logServerError('api/foo', 'request failed', err);
		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy.mock.calls[0][0]).toBe('[api/foo] request failed');
		expect(spy.mock.calls[0][1]).toBe(err);
	});
});

describe('logServerWarn', () => {
	it('logs a [scope] warning without detail when detail is omitted', () => {
		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		logServerWarn('cache', 'stale read');
		expect(spy).toHaveBeenCalledTimes(1);
		expect(spy.mock.calls[0]).toEqual(['[cache] stale read']);
	});

	it('forwards the detail when provided', () => {
		const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		logServerWarn('cache', 'evicted', { key: 'k' });
		expect(spy).toHaveBeenCalledWith('[cache] evicted', { key: 'k' });
	});
});

describe('handleApiError', () => {
	it('logs the error and returns a 500 with the default client message', async () => {
		const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
		const r = handleApiError('api/foo', new Error('upstream'));
		expect(r.status).toBe(500);
		expect(await r.json()).toEqual({ error: 'Internal Server Error.' });
		expect(spy.mock.calls[0][0]).toBe('[api/foo] request failed');
	});

	it('honors a custom client message and status', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const r = handleApiError('api/foo', new Error('x'), 'Upstream timed out', 502);
		expect(r.status).toBe(502);
		expect(await r.json()).toEqual({ error: 'Upstream timed out' });
	});

	it('does not leak the original error message to the client body', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const r = handleApiError('api/foo', new Error('SECRET internal trace'));
		const body = (await r.json()) as { error: string };
		expect(body.error).not.toContain('SECRET');
	});
});
