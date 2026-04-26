import { and, eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { getUserDb } from './userDb';
import { accounts } from './userSchema';
import { dbOperation } from './_helpers';

// Safety margin so we refresh slightly before Battle.net actually rejects the
// token. Bnet tokens are typically valid for 24h.
const EXPIRY_BUFFER_SECONDS = 60;

export interface BattleNetAccountRow {
	userId: string;
	accessToken: string | null;
	refreshToken: string | null;
	expiresAt: number | null; // unix seconds
	scope: string | null;
}

export async function getBattleNetAccount(userId: string): Promise<BattleNetAccountRow | null> {
	return dbOperation('getBattleNetAccount', async () => {
		const db = getUserDb();
		const rows = await db
			.select({
				userId: accounts.userId,
				accessToken: accounts.access_token,
				refreshToken: accounts.refresh_token,
				expiresAt: accounts.expires_at,
				scope: accounts.scope
			})
			.from(accounts)
			.where(and(eq(accounts.userId, userId), eq(accounts.provider, 'battlenet')))
			.limit(1);

		return rows[0] ?? null;
	});
}

/**
 * Refresh an expired Battle.net OAuth token using the stored refresh_token and
 * persist the new values on the `accounts` row. Returns the fresh access token,
 * or null when the refresh failed (user must reauthenticate).
 */
async function refreshBattleNetToken(
	userId: string,
	refreshToken: string
): Promise<string | null> {
	const clientId = env.AUTH_BATTLENET_ID;
	const clientSecret = env.AUTH_BATTLENET_SECRET;
	if (!clientId || !clientSecret) return null;

	const basic = btoa(`${clientId}:${clientSecret}`);
	const body = new URLSearchParams({
		grant_type: 'refresh_token',
		refresh_token: refreshToken
	});

	let response: Response;
	try {
		response = await fetch('https://oauth.battle.net/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Authorization: `Basic ${basic}`
			},
			body
		});
	} catch {
		console.error('battlenet: refresh fetch failed');
		return null;
	}

	if (!response.ok) {
		console.error('battlenet: refresh rejected', response.status);
		return null;
	}

	const payload = (await response.json()) as {
		access_token?: string;
		refresh_token?: string;
		expires_in?: number;
		scope?: string;
		token_type?: string;
	};

	if (!payload.access_token || !payload.expires_in) return null;

	const nextExpiresAt = Math.floor(Date.now() / 1000) + payload.expires_in;
	try {
		const db = getUserDb();
		await db
			.update(accounts)
			.set({
				access_token: payload.access_token,
				refresh_token: payload.refresh_token ?? refreshToken,
				expires_at: nextExpiresAt,
				scope: payload.scope ?? null,
				token_type: payload.token_type ?? 'bearer'
			})
			.where(and(eq(accounts.userId, userId), eq(accounts.provider, 'battlenet')));
	} catch {
		// Ignore persistence failures here; callers can still use the fresh token.
	}

	return payload.access_token;
}

/**
 * Return a valid Battle.net user access token for the signed-in user, refreshing
 * transparently if the stored token has expired. Returns null when no account
 * is linked, the scope is missing, or refresh fails.
 */
export async function getValidBattleNetUserToken(userId: string): Promise<{
	token: string;
	scope: string | null;
} | null> {
	const account = await getBattleNetAccount(userId);
	if (!account?.accessToken) return null;

	const now = Math.floor(Date.now() / 1000);
	const stillValid =
		account.expiresAt !== null && account.expiresAt - EXPIRY_BUFFER_SECONDS > now;

	if (stillValid) {
		return { token: account.accessToken, scope: account.scope };
	}

	if (!account.refreshToken) {
		// Token expired and nothing to refresh with - force reauth.
		return null;
	}

	const refreshed = await refreshBattleNetToken(userId, account.refreshToken);
	if (!refreshed) return null;

	// Re-read scope since refresh may have rotated it.
	const reloaded = await getBattleNetAccount(userId);
	return { token: refreshed, scope: reloaded?.scope ?? account.scope };
}
