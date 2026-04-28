import type { AccessToken } from '$lib/types/apiTypes';
import { isTokenExpired } from './oauthBase';

/**
 * Provider config for an in-memory client-credentials token cache.
 *
 * Both the Warcraft Logs and Battle.net token caches follow the same shape:
 * read two env vars, exchange them for a bearer token, cache it until it
 * expires, and hand the string back to API routes. The duplication used to
 * live as two near-identical files; this factory is the single source.
 *
 * **Why a module-level singleton, not a request-scoped cache?**
 * The cached value is an *application* credential issued by an OAuth2
 * client-credentials grant — there is no per-user state and the same token
 * is valid for every request the server handles. Refreshing on a per-request
 * cadence would burn provider rate limits and add latency for no benefit.
 * SvelteKit/Cloudflare Workers may run multiple isolates, so each isolate
 * keeps its own cache; that is acceptable (token endpoints are designed for
 * exactly this fan-out).
 *
 * **Concurrency safety:** while a refresh is in flight, additional callers
 * receive the same in-flight Promise rather than each kicking off their own
 * exchange. This avoids a small thundering-herd at startup and after
 * expiry.
 */
export interface TokenCacheConfig {
	/** Human-readable provider name used in error messages (e.g. "WCL"). */
	providerLabel: string;
	/**
	 * Reads the OAuth client credentials at call time. Returns `null` when
	 * the env vars are missing — `createTokenCache` will surface a
	 * configuration error in that case.
	 */
	readCredentials: () => { clientId: string; clientSecret: string } | null;
	/** Performs the actual token request once credentials are known. */
	requestToken: (clientId: string, clientSecret: string) => Promise<AccessToken>;
}

/**
 * Build a `getOrRefreshToken()` closure with its own private cache slot.
 * Concurrent callers during a refresh share the same in-flight Promise.
 */
export function createTokenCache(config: TokenCacheConfig): () => Promise<string> {
	let cachedToken: AccessToken | null = null;
	let inFlight: Promise<AccessToken> | null = null;

	async function refresh(): Promise<AccessToken> {
		const credentials = config.readCredentials();
		if (!credentials) {
			throw new Error(`${config.providerLabel} Client ID or Client Secret is not configured.`);
		}
		return config.requestToken(credentials.clientId, credentials.clientSecret);
	}

	return async function getOrRefreshToken(): Promise<string> {
		if (cachedToken && !isTokenExpired(cachedToken)) {
			return cachedToken.token;
		}
		if (!inFlight) {
			inFlight = refresh().finally(() => {
				inFlight = null;
			});
		}
		try {
			cachedToken = await inFlight;
			return cachedToken.token;
		} catch (err) {
			// Don't pin a failed refresh; let the next caller try again.
			cachedToken = null;
			throw err;
		}
	};
}
