import { env } from '$env/dynamic/private';
import { requestBearerToken } from './oauth';
import { createTokenCache } from './tokenCacheBase';

/**
 * In-memory cached Warcraft Logs access token. See `tokenCacheBase.ts` for
 * the shared factory; this module just supplies WCL-specific config.
 */
export const getOrRefreshAccessToken = createTokenCache({
	providerLabel: 'WCL',
	readCredentials: () => {
		const clientId = env.WCL_CLIENT_ID;
		const clientSecret = env.WCL_CLIENT_SECRET;
		if (!clientId || !clientSecret) return null;
		return { clientId, clientSecret };
	},
	requestToken: requestBearerToken
});
