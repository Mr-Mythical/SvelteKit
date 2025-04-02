import type { AccessToken } from '$lib/types/apiTypes';

/**
 * Requests a Blizzard Bearer Token using Client Credentials.
 * @param clientId - The Blizzard Client ID.
 * @param clientSecret - The Blizzard Client Secret.
 * @returns A promise that resolves to the Access Token.
 */
export async function requestBlizzardBearerToken(
	clientId: string,
	clientSecret: string
): Promise<AccessToken> {
	const tokenUrl = `https://oauth.battle.net/token`;
	const params = new URLSearchParams();
	params.append('grant_type', 'client_credentials');

	const credentials = `${clientId}:${clientSecret}`;
	const encodedCredentials = btoa(credentials);

	const response = await fetch(tokenUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Authorization: `Basic ${encodedCredentials}`
		},
		body: params.toString()
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error('Failed to acquire Blizzard Bearer Token.');
	}

	const data = await response.json();

	const accessToken: AccessToken = {
		token: data.access_token,
		expiresIn: data.expires_in,
		obtainedAt: Date.now()
	};

	return accessToken;
}

/**
 * Checks if the current Access Token is expired.
 * @param accessToken - The Access Token object.
 * @returns Boolean indicating if the token is expired.
 */
export function isTokenExpired(accessToken: AccessToken): boolean {
	const currentTime = Date.now();
	// Convert expiresIn to milliseconds and add to obtainedAt
	const expiryTime = accessToken.obtainedAt + accessToken.expiresIn * 1000;
	return currentTime >= expiryTime;
}
