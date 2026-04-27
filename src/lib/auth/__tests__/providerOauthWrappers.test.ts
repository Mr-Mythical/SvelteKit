import { describe, expect, it, vi, beforeEach } from 'vitest';
import { requestBlizzardBearerToken } from '../blizzardOauth';
import { requestBearerToken } from '../oauth';

beforeEach(() => {
	(global.fetch as ReturnType<typeof vi.fn>).mockReset();
});

describe('requestBlizzardBearerToken', () => {
	it('targets battle.net token endpoint with the Blizzard provider label', async () => {
		(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: false,
			status: 401,
			json: async () => ({})
		});
		await expect(requestBlizzardBearerToken('id', 'sec')).rejects.toThrow(/Blizzard.*401/);
		const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
		expect(url).toBe('https://oauth.battle.net/token');
	});

	it('returns the parsed token on success', async () => {
		(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ access_token: 'BNT', expires_in: 3600 })
		});
		const t = await requestBlizzardBearerToken('id', 'sec');
		expect(t.token).toBe('BNT');
	});
});

describe('requestBearerToken (WarcraftLogs)', () => {
	it('targets the warcraftlogs token endpoint with the WarcraftLogs label', async () => {
		(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: false,
			status: 502,
			json: async () => ({})
		});
		await expect(requestBearerToken('id', 'sec')).rejects.toThrow(/WarcraftLogs.*502/);
		const [url] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
		expect(url).toBe('https://www.warcraftlogs.com/oauth/token');
	});

	it('returns the parsed token on success', async () => {
		(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ access_token: 'WCL', expires_in: 7200 })
		});
		const t = await requestBearerToken('id', 'sec');
		expect(t.token).toBe('WCL');
		expect(t.expiresIn).toBe(7200);
	});
});
