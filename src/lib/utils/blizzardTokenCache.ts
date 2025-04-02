import { env } from '$env/dynamic/private';
import type { AccessToken } from '$lib/types/apiTypes';
import { requestBlizzardBearerToken, isTokenExpired } from './blizzardOauth';

let cachedToken: AccessToken | null = null;

/**
 * Retrieves a valid Access Token, refreshing it if necessary.
 * @returns A promise that resolves to a valid Access Token.
 */
export async function getBlizzardValidAccessToken(): Promise<string> {
	if (cachedToken && !isTokenExpired(cachedToken)) {
		return cachedToken.token;
	}

	const clientId = env.BLIZZARD_CLIENT_ID;
	const clientSecret = env.BLIZZARD_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		throw new Error('Blizzard Client ID or Client Secret is not configured.');
	}

	cachedToken = await requestBlizzardBearerToken(clientId, clientSecret);
	return cachedToken.token;
}
