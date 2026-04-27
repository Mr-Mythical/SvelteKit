import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { isTokenExpired, requestClientCredentialsToken } from '../oauthBase';
import type { AccessToken } from '$lib/types/apiTypes';

describe('isTokenExpired', () => {
	it('returns true for tokens whose lifetime is exhausted', () => {
		const token: AccessToken = {
			token: 't',
			expiresIn: 60,
			obtainedAt: Date.now() - 120_000
		};
		expect(isTokenExpired(token)).toBe(true);
	});

	it('returns false for fresh tokens', () => {
		const token: AccessToken = {
			token: 't',
			expiresIn: 3600,
			obtainedAt: Date.now()
		};
		expect(isTokenExpired(token)).toBe(false);
	});

	it('treats the exact expiry instant as expired', () => {
		const now = Date.now();
		vi.useFakeTimers();
		vi.setSystemTime(now);
		try {
			const token: AccessToken = { token: 't', expiresIn: 10, obtainedAt: now - 10_000 };
			expect(isTokenExpired(token)).toBe(true);
		} finally {
			vi.useRealTimers();
		}
	});
});

describe('requestClientCredentialsToken', () => {
	const url = 'https://example.com/oauth/token';

	beforeEach(() => {
		(global.fetch as ReturnType<typeof vi.fn>).mockReset();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('POSTs basic-auth client credentials and returns a normalized token', async () => {
		(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ access_token: 'abc123', expires_in: 3600 })
		});

		const result = await requestClientCredentialsToken(url, 'cid', 'csecret', 'TestProvider');

		expect(global.fetch).toHaveBeenCalledTimes(1);
		const [calledUrl, init] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
		expect(calledUrl).toBe(url);
		expect(init.method).toBe('POST');
		expect(init.headers['Authorization']).toBe(`Basic ${btoa('cid:csecret')}`);
		expect(init.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
		expect(init.body).toContain('grant_type=client_credentials');

		expect(result.token).toBe('abc123');
		expect(result.expiresIn).toBe(3600);
		expect(typeof result.obtainedAt).toBe('number');
	});

	it('throws an error including the provider label and HTTP status on failure', async () => {
		(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: false,
			status: 503,
			json: async () => ({})
		});

		await expect(
			requestClientCredentialsToken(url, 'cid', 'csecret', 'Blizzard')
		).rejects.toThrow(/Blizzard.*503/);
	});
});
