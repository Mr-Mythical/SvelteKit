import type { AccessToken } from '$lib/types/apiTypes';
import { requestClientCredentialsToken, isTokenExpired as baseIsTokenExpired } from './oauthBase';

/** Battle.net OAuth2 client-credentials grant. */
export function requestBlizzardBearerToken(
	clientId: string,
	clientSecret: string
): Promise<AccessToken> {
	return requestClientCredentialsToken(
		'https://oauth.battle.net/token',
		clientId,
		clientSecret,
		'Blizzard'
	);
}

export const isTokenExpired = baseIsTokenExpired;
