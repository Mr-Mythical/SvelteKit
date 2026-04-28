import { describe, expect, it, vi } from 'vitest';
import { createTokenCache } from '../tokenCacheBase';

const baseToken = (
	overrides: Partial<{ token: string; expiresIn: number; obtainedAt: number }> = {}
) => ({
	token: 'tok',
	expiresIn: 3600,
	obtainedAt: Date.now(),
	...overrides
});

describe('createTokenCache', () => {
	it('throws when readCredentials returns null', async () => {
		const get = createTokenCache({
			providerLabel: 'TestProv',
			readCredentials: () => null,
			requestToken: vi.fn()
		});
		await expect(get()).rejects.toThrow(/TestProv.*Client ID or Client Secret/);
	});

	it('caches the token across calls until it expires', async () => {
		const requestToken = vi.fn().mockResolvedValue(baseToken({ token: 'fresh' }));
		const get = createTokenCache({
			providerLabel: 'P',
			readCredentials: () => ({ clientId: 'a', clientSecret: 'b' }),
			requestToken
		});

		expect(await get()).toBe('fresh');
		expect(await get()).toBe('fresh');
		expect(await get()).toBe('fresh');
		expect(requestToken).toHaveBeenCalledTimes(1);
	});

	it('refreshes the token after expiry', async () => {
		const requestToken = vi
			.fn()
			.mockResolvedValueOnce(
				baseToken({ token: 'first', expiresIn: 1, obtainedAt: Date.now() - 5000 })
			)
			.mockResolvedValueOnce(baseToken({ token: 'second' }));
		const get = createTokenCache({
			providerLabel: 'P',
			readCredentials: () => ({ clientId: 'a', clientSecret: 'b' }),
			requestToken
		});

		expect(await get()).toBe('first');
		expect(await get()).toBe('second');
		expect(requestToken).toHaveBeenCalledTimes(2);
	});

	it('shares one in-flight refresh between concurrent callers', async () => {
		let resolveToken!: (value: ReturnType<typeof baseToken>) => void;
		const requestToken = vi.fn().mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					resolveToken = resolve;
				})
		);
		const get = createTokenCache({
			providerLabel: 'P',
			readCredentials: () => ({ clientId: 'a', clientSecret: 'b' }),
			requestToken
		});

		const p1 = get();
		const p2 = get();
		const p3 = get();
		resolveToken(baseToken({ token: 'shared' }));
		expect(await p1).toBe('shared');
		expect(await p2).toBe('shared');
		expect(await p3).toBe('shared');
		expect(requestToken).toHaveBeenCalledTimes(1);
	});

	it('does not pin a failed refresh — the next caller retries', async () => {
		const requestToken = vi
			.fn()
			.mockRejectedValueOnce(new Error('boom'))
			.mockResolvedValueOnce(baseToken({ token: 'recovered' }));
		const get = createTokenCache({
			providerLabel: 'P',
			readCredentials: () => ({ clientId: 'a', clientSecret: 'b' }),
			requestToken
		});

		await expect(get()).rejects.toThrow('boom');
		expect(await get()).toBe('recovered');
		expect(requestToken).toHaveBeenCalledTimes(2);
	});
});
