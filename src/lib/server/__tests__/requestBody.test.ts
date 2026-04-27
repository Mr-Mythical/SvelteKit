import { describe, expect, it } from 'vitest';
import {
	parseJsonBody,
	parseRecentCharacterBody,
	parseRecentReportBody,
	parseCurrentStateBody
} from '../requestBody';

const makeRequest = (body: unknown, raw = false): Request => {
	const init = raw
		? { method: 'POST', body: body as BodyInit }
		: { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } };
	return new Request('http://localhost/api/test', init);
};

describe('parseJsonBody', () => {
	it('returns the validated value on a well-formed body', async () => {
		const req = makeRequest({ x: 1 });
		const result = await parseJsonBody(req, (body) => body as { x: number });
		expect(result).toEqual({ x: 1 });
	});

	it('returns a 400 Response on invalid JSON', async () => {
		const req = makeRequest('not-json', true);
		const result = await parseJsonBody(req, () => ({}));
		expect(result).toBeInstanceOf(Response);
		expect((result as Response).status).toBe(400);
	});

	it('returns a 400 Response when validation rejects the body', async () => {
		const req = makeRequest({ x: 1 });
		const result = await parseJsonBody(req, () => null);
		expect(result).toBeInstanceOf(Response);
		expect((result as Response).status).toBe(400);
	});
});

describe('parseRecentCharacterBody', () => {
	it('accepts well-formed input', () => {
		expect(parseRecentCharacterBody({ characterName: 'Bob', realm: 'Stormrage', region: 'us' })).toEqual({
			characterName: 'Bob',
			realm: 'Stormrage',
			region: 'us'
		});
	});

	it('rejects missing fields', () => {
		expect(parseRecentCharacterBody({ characterName: 'Bob', realm: 'Stormrage' })).toBeNull();
		expect(parseRecentCharacterBody({})).toBeNull();
		expect(parseRecentCharacterBody(null)).toBeNull();
	});

	it('rejects non-string fields', () => {
		expect(parseRecentCharacterBody({ characterName: 1, realm: 'r', region: 'us' })).toBeNull();
	});

	it('rejects empty strings and overlong strings', () => {
		expect(parseRecentCharacterBody({ characterName: '', realm: 'r', region: 'us' })).toBeNull();
		expect(parseRecentCharacterBody({ characterName: 'a'.repeat(65), realm: 'r', region: 'us' })).toBeNull();
	});
});

describe('parseRecentReportBody', () => {
	it('accepts a minimal report body', () => {
		expect(parseRecentReportBody({ code: 'abc', title: 'Run' })).toEqual({
			code: 'abc',
			title: 'Run',
			guild: undefined,
			owner: undefined
		});
	});

	it('accepts optional guild/owner with name fields', () => {
		expect(
			parseRecentReportBody({ code: 'abc', title: 'Run', guild: { name: 'GuildA' }, owner: { name: 'me' } })
		).toEqual({ code: 'abc', title: 'Run', guild: { name: 'GuildA' }, owner: { name: 'me' } });
	});

	it('rejects missing required fields', () => {
		expect(parseRecentReportBody({ code: '' })).toBeNull();
		expect(parseRecentReportBody({ title: 'T' })).toBeNull();
	});

	it('rejects guild/owner with non-string name', () => {
		expect(parseRecentReportBody({ code: 'abc', title: 't', guild: { name: 1 } })).toBeNull();
		expect(parseRecentReportBody({ code: 'abc', title: 't', owner: 'nope' })).toBeNull();
	});
});

describe('parseCurrentStateBody', () => {
	it('accepts a string urlParams under the cap', () => {
		expect(parseCurrentStateBody({ urlParams: '?a=1&b=2' })).toEqual({ urlParams: '?a=1&b=2' });
	});

	it('accepts empty string', () => {
		expect(parseCurrentStateBody({ urlParams: '' })).toEqual({ urlParams: '' });
	});

	it('rejects non-string urlParams', () => {
		expect(parseCurrentStateBody({ urlParams: 42 })).toBeNull();
	});

	it('rejects overlong urlParams', () => {
		expect(parseCurrentStateBody({ urlParams: 'a'.repeat(4097) })).toBeNull();
	});
});
