import type { AccessToken } from '../types/apiTypes';
import { requestClientCredentialsToken } from './oauthBase';

/** Warcraft Logs OAuth2 client-credentials grant. */
export function requestBearerToken(clientId: string, clientSecret: string): Promise<AccessToken> {
	return requestClientCredentialsToken(
		'https://www.warcraftlogs.com/oauth/token',
		clientId,
		clientSecret,
		'WarcraftLogs'
	);
}
