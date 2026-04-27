import { describe, expect, it, vi } from 'vitest';
import { __securityHandlerForTests, __cspHeaderForTests } from '../hooks.server';

const baseEvent = () => ({
	url: new URL('http://localhost/'),
	request: new Request('http://localhost/'),
	cookies: { get: vi.fn(), set: vi.fn() } as unknown,
	fetch: vi.fn() as unknown,
	getClientAddress: () => '127.0.0.1',
	locals: {} as App.Locals,
	params: {},
	platform: undefined,
	route: { id: null },
	setHeaders: vi.fn(),
	isDataRequest: false,
	isSubRequest: false
}) as unknown as Parameters<typeof __securityHandlerForTests>[0]['event'];

describe('handleSecurity', () => {
	it('attaches the full set of security headers to every response', async () => {
		const response = await __securityHandlerForTests({
			event: baseEvent(),
			resolve: async () => new Response('hello')
		});

		expect(response.headers.get('Strict-Transport-Security')).toBe(
			'max-age=63072000; includeSubDomains; preload'
		);
		expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
		expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
		expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
		expect(response.headers.get('Content-Security-Policy')).toBe(__cspHeaderForTests);
	});

	it('passes the response body through unchanged', async () => {
		const response = await __securityHandlerForTests({
			event: baseEvent(),
			resolve: async () => new Response('the body')
		});
		expect(await response.text()).toBe('the body');
	});

	it('overrides any pre-existing CSP header set upstream', async () => {
		const response = await __securityHandlerForTests({
			event: baseEvent(),
			resolve: async () => {
				const r = new Response('hi');
				r.headers.set('Content-Security-Policy', "default-src 'none'");
				return r;
			}
		});
		expect(response.headers.get('Content-Security-Policy')).toBe(__cspHeaderForTests);
	});

	it('forwards the filterSerializedResponseHeaders predicate to resolve', async () => {
		let captured: ((name: string, value: string) => boolean) | undefined;
		await __securityHandlerForTests({
			event: baseEvent(),
			resolve: async (_event, opts) => {
				captured = opts?.filterSerializedResponseHeaders as
					| ((name: string, value: string) => boolean)
					| undefined;
				return new Response('hi');
			}
		});
		expect(captured).toBeDefined();
		expect(captured!('Content-Security-Policy', '')).toBe(true);
		expect(captured!('content-security-policy', '')).toBe(true);
		expect(captured!('Set-Cookie', '')).toBe(false);
	});
});

describe('CSP header', () => {
	const csp = __cspHeaderForTests;

	it('locks frame-ancestors to self', () => {
		expect(csp).toMatch(/frame-ancestors 'self'/);
	});

	it('forbids object embeds', () => {
		expect(csp).toMatch(/object-src 'none'/);
	});

	it('limits base-uri and form-action to self', () => {
		expect(csp).toMatch(/base-uri 'self'/);
		expect(csp).toMatch(/form-action 'self'/);
	});

	it('declares all the directives the app relies on', () => {
		for (const directive of [
			'default-src',
			'script-src',
			'style-src',
			'img-src',
			'font-src',
			'connect-src',
			'frame-src'
		]) {
			expect(csp).toContain(directive);
		}
	});
});
