import { env } from '$env/dynamic/private';
import { requestBlizzardBearerToken } from './blizzardOauth';
import { createTokenCache } from './tokenCacheBase';

/**
 * In-memory cached Battle.net access token. See `tokenCacheBase.ts` for the
 * shared factory; this module just supplies Blizzard-specific config.
 */
export const getOrRefreshBlizzardAccessToken = createTokenCache({
	providerLabel: 'Blizzard',
	readCredentials: () => {
		const clientId = env.BLIZZARD_CLIENT_ID;
		const clientSecret = env.BLIZZARD_CLIENT_SECRET;
		if (!clientId || !clientSecret) return null;
		return { clientId, clientSecret };
	},
	requestToken: requestBlizzardBearerToken
});
