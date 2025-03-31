import { env } from '$env/dynamic/private';
import type { AccessToken } from '$lib/types/apiTypes';
import { requestBlizzardBearerToken } from './blizzardOauth';

/**
 * Checks if the current Access Token is expired.
 * @param accessToken - The Access Token object.
 * @returns Boolean indicating if the token is expired.
 */
function isTokenExpired(accessToken: AccessToken): boolean {
	const currentTime = Date.now();
	const expiryTime = accessToken.obtainedAt + accessToken.expiresIn * 1000;
	return currentTime >= expiryTime;
}

let cachedToken: AccessToken | null = null;

/**
 * Retrieves a valid Blizzard Access Token, refreshing it if necessary.
 * @param region - The region to request the token for.
 * @returns A promise that resolves to a valid Access Token string.
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
