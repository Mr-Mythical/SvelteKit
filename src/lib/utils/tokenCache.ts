import { env } from '$env/dynamic/private';
import type { AccessToken } from '$lib/types/apiTypes';
import { requestBearerToken, isTokenExpired } from './oauth';

let cachedToken: AccessToken | null = null;

/**
 * Retrieves a valid Access Token, refreshing it if necessary.
 * @returns A promise that resolves to a valid Access Token.
 */
export async function getValidAccessToken(): Promise<string> {
	if (cachedToken && !isTokenExpired(cachedToken)) {
		return cachedToken.token;
	}

	const clientId = env.WCL_CLIENT_ID;
	const clientSecret = env.WCL_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		throw new Error('Client ID or Client Secret is not configured.');
	}

	cachedToken = await requestBearerToken(clientId, clientSecret);
	return cachedToken.token;
}
