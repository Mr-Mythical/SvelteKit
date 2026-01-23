import { sequence } from '@sveltejs/kit/hooks';
import { handle as authHandle } from './auth';
import type { Handle } from '@sveltejs/kit';

const handleAuth: Handle = authHandle;

const handleSecurity: Handle = async ({ event, resolve }) => {
	const response = await resolve(event, {
		filterSerializedResponseHeaders(name) {
			// ensure these headers are not stripped during SSR streaming
			return ['content-security-policy'].includes(name.toLowerCase());
		}
	});

	response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'SAMEORIGIN');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

	const csp = [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline' 'unsafe-eval' https: https://pagead2.googlesyndication.com https://googlesyndication.com",
		"style-src 'self' 'unsafe-inline' https:",
		"img-src 'self' data: https:",
		"font-src 'self' data: https:",
		"connect-src 'self' https:",
		"frame-src 'self' https: https://pagead2.googlesyndication.com https://ep2.adtrafficquality.google https://googleads.g.doubleclick.net https://tpc.googlesyndication.com",
		"frame-ancestors 'self'",
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'"
	].join('; ');

	response.headers.set('Content-Security-Policy', csp);

	return response;
};

const handleSession: Handle = async ({ event, resolve }) => {
	event.locals.getSession = async () => {
		const response = await fetch(`${event.url.origin}/auth/session`, {
			headers: {
				cookie: event.request.headers.get('cookie') || ''
			}
		});
		if (response.ok) {
			return await response.json();
		}
		return null;
	};

	return resolve(event);
};

export const handle = sequence(handleAuth, handleSecurity, handleSession);
