import { sequence } from '@sveltejs/kit/hooks';
import { handle as authHandle } from './auth';
import type { Handle } from '@sveltejs/kit';

const isProd = process.env.NODE_ENV === 'production';

/** Battle.net OAuth authorize/token hosts (form POSTs + redirects). Wildcards alone are unreliable in form-action. */
const BATTLE_NET_FORM_ACTIONS = [
	'https://battle.net',
	'https://www.battle.net',
	'https://oauth.battle.net',
	'https://account.battle.net',
	'https://eu.battle.net',
	'https://us.battle.net',
	'https://kr.battle.net',
	'https://tw.battle.net',
	'https://*.battle.net'
].join(' ');

const CSP_HEADER = [
	"default-src 'self'",
	"script-src 'self' 'unsafe-inline' 'unsafe-eval' https: https://pagead2.googlesyndication.com https://googlesyndication.com",
	"worker-src 'self' blob:",
	"style-src 'self' 'unsafe-inline' https:",
	"img-src 'self' data: https:",
	"font-src 'self' data: https:",
	"connect-src 'self' https:",
	"frame-src 'self' https: https://pagead2.googlesyndication.com https://ep2.adtrafficquality.google https://googleads.g.doubleclick.net https://tpc.googlesyndication.com",
	"frame-ancestors 'self'",
	"object-src 'none'",
	"base-uri 'self'",
	// Auth.js posts/redirects to Battle.net during OAuth; 'self' alone blocks sign-in.
	`form-action 'self' ${BATTLE_NET_FORM_ACTIONS}`
].join('; ');

const handleSecurity: Handle = async ({ event, resolve }) => {
	const response = await resolve(event, {
		filterSerializedResponseHeaders(name) {
			// ensure these headers are not stripped during SSR streaming
			return ['content-security-policy'].includes(name.toLowerCase());
		}
	});

	// Never send HSTS on localhost — browsers can pin https://localhost and break OAuth.
	if (isProd) {
		response.headers.set(
			'Strict-Transport-Security',
			'max-age=63072000; includeSubDomains; preload'
		);
	}
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'SAMEORIGIN');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Content-Security-Policy', CSP_HEADER);

	// Gearing model + item DB: short CDN cache with must-revalidate; clients also bust via ?v=
	const path = event.url.pathname;
	if (path.startsWith('/gearing/') && path.endsWith('.json')) {
		response.headers.set(
			'Cache-Control',
			'public, max-age=300, stale-while-revalidate=86400, must-revalidate'
		);
	}

	return response;
};

/**
 * Live binding wrapper. `sequence()` snapshots handlers at module init and
 * reads `handle.name`; during Vite HMR the Auth.js export can be briefly
 * undefined, which 500s every request (`Cannot read properties of undefined
 * (reading 'name')`).
 *
 * Auth.js already sets `event.locals.auth` / `getSession` — do not replace
 * that with a nested fetch to `/auth/session` (deadlocks the Vite SSR runner).
 */
async function handleAuth({ event, resolve }: Parameters<Handle>[0]) {
	if (typeof authHandle !== 'function') {
		return resolve(event);
	}
	return authHandle({ event, resolve });
}

// Exported for tests so the response-header contract can be exercised
// without booting Auth.js. Production wiring still uses `handle` below.
export const handle = sequence(handleAuth, handleSecurity);

export const __securityHandlerForTests: Handle = handleSecurity;
export const __cspHeaderForTests = CSP_HEADER;
