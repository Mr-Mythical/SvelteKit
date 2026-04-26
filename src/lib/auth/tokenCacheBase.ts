import type { AccessToken } from '$lib/types/apiTypes';
import { isTokenExpired } from './oauthBase';

/**
 * Provider config for an in-memory client-credentials token cache.
 *
 * Both the Warcraft Logs and Battle.net token caches follow the same shape:
 * read two env vars, exchange them for a bearer token, cache it until it
 * expires, and hand the string back to API routes. The duplication used to
 * live as two near-identical files; this factory is the single source.
 */
export interface TokenCacheConfig {
	/** Human-readable provider name used in error messages (e.g. "WCL"). */
	providerLabel: string;
	/**
	 * Reads the OAuth client credentials at call time. Throws (or returns
	 * `null`) when the env vars are missing — `createTokenCache` will
	 * surface a configuration error in that case.
	 */
	readCredentials: () => { clientId: string; clientSecret: string } | null;
	/** Performs the actual token request once credentials are known. */
	requestToken: (clientId: string, clientSecret: string) => Promise<AccessToken>;
}

/**
 * Build a `getOrRefreshToken()` closure with its own private cache slot.
 * The returned function is safe to share across requests in a single
 * process — concurrent callers may briefly each trigger a refresh before
 * the cache settles, which is acceptable for OAuth2 client-credentials.
 */
export function createTokenCache(config: TokenCacheConfig): () => Promise<string> {
	let cachedToken: AccessToken | null = null;

	return async function getOrRefreshToken(): Promise<string> {
		if (cachedToken && !isTokenExpired(cachedToken)) {
			return cachedToken.token;
		}

		const credentials = config.readCredentials();
		if (!credentials) {
			throw new Error(`${config.providerLabel} Client ID or Client Secret is not configured.`);
		}

		cachedToken = await config.requestToken(credentials.clientId, credentials.clientSecret);
		return cachedToken.token;
	};
}
