import type { AccessToken } from '$lib/types/apiTypes';

/**
 * Generic OAuth2 client-credentials token request.
 * Used by both Warcraft Logs and Battle.net OAuth wrappers.
 */
export async function requestClientCredentialsToken(
	tokenUrl: string,
	clientId: string,
	clientSecret: string,
	providerLabel: string
): Promise<AccessToken> {
	const params = new URLSearchParams();
	params.append('grant_type', 'client_credentials');

	const encodedCredentials = btoa(`${clientId}:${clientSecret}`);

	const response = await fetch(tokenUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Authorization: `Basic ${encodedCredentials}`
		},
		body: params.toString()
	});

	if (!response.ok) {
		throw new Error(`Failed to acquire ${providerLabel} Bearer Token (status ${response.status}).`);
	}

	const data = await response.json();

	return {
		token: data.access_token,
		expiresIn: data.expires_in,
		obtainedAt: Date.now()
	};
}

export function isTokenExpired(accessToken: AccessToken): boolean {
	const expiryTime = accessToken.obtainedAt + accessToken.expiresIn * 1000;
	return Date.now() >= expiryTime;
}
