import type { SvelteKitAuthConfig } from '@auth/sveltekit';
import { SvelteKitAuth } from '@auth/sveltekit';
import BattleNet from '@auth/core/providers/battlenet';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import type { Account, Session, User } from '@auth/core/types';
import type { AdapterUser } from '@auth/core/adapters';
import { getUserDb } from '$lib/db/userDb.js';
import { users, accounts, sessions, verificationTokens } from '$lib/db/userSchema.js';
import { updateUserLastSeen, createOrUpdateUserProfile } from '$lib/db/users.js';
import { refreshRosterFromBattleNet } from '$lib/data/myWowRoster';
import { logServerError } from '$lib/server/logger';
import { env } from '$env/dynamic/private';
import { and, eq } from 'drizzle-orm';

function createAdapter() {
	const db = getUserDb();

	const adapter = DrizzleAdapter(db, {
		usersTable: users,
		accountsTable: accounts,
		sessionsTable: sessions,
		verificationTokensTable: verificationTokens
	});

	return adapter;
}

export const { handle, signIn, signOut } = SvelteKitAuth(async () => {
	const authRequest: SvelteKitAuthConfig = {
		adapter: createAdapter(),
		providers: [
			BattleNet({
				clientId: env.AUTH_BATTLENET_ID,
				clientSecret: env.AUTH_BATTLENET_SECRET,
				issuer: 'https://eu.battle.net/oauth',
				checks: ['pkce', 'nonce', 'state'],
				authorization: {
					params: {
						// `wow.profile` is required to read the signed-in user's WoW
						// character roster via `/profile/user/wow`. Existing users
						// need to sign in again after this change to re-consent.
						scope: 'openid wow.profile'
					}
				}
			})
		],
		secret: env.AUTH_SECRET,
		trustHost: true,
		debug: process.env.NODE_ENV !== 'production',
		session: {
			strategy: 'database' as const,
			maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
			updateAge: 24 * 60 * 60 // 24 hours - how often to update the session
		},
		cookies: {
			sessionToken: {
				name: 'authjs.session-token',
				options: {
					httpOnly: true,
					sameSite: 'lax' as const,
					path: '/',
					secure: process.env.NODE_ENV === 'production',
					maxAge: 30 * 24 * 60 * 60 // 30 days in seconds
				}
			}
		},
		callbacks: {
			async signIn({ user, account }: { user: User | AdapterUser; account?: Account | null }) {
				// DrizzleAdapter's `linkAccount` only runs on the very first sign-in, so
				// subsequent logins (e.g. after we changed scopes) never update the
				// stored tokens / scope. Persist the fresh values here so the roster
				// endpoint sees the newly-granted `wow.profile` scope.
				if (account?.provider === 'battlenet' && user?.id) {
					try {
						const db = getUserDb();
						await db
							.update(accounts)
							.set({
								access_token: account.access_token ?? null,
								refresh_token: account.refresh_token ?? null,
								expires_at: account.expires_at ?? null,
								token_type: account.token_type ?? 'bearer',
								scope: account.scope ?? null,
								id_token: typeof account.id_token === 'string' ? account.id_token : null,
								session_state:
									typeof account.session_state === 'string' ? account.session_state : null
							})
							.where(and(eq(accounts.userId, user.id), eq(accounts.provider, 'battlenet')));
					} catch (error) {
						// Token-update best-effort: a failure here just means the cached
						// access_token is stale, which the next API call will refresh.
						// Log it so we can spot persistent failures, but don't block sign-in.
						logServerError('auth/signIn', 'failed to update battlenet account tokens', error);
					}

					// Kick off a roster sync in the background. Don't await - we don't
					// want the login flow to hang on Blizzard latency. The DB read path
					// will pick up the new rows once it completes.
					const userId = user.id;
					(async () => {
						try {
							await refreshRosterFromBattleNet(userId);
						} catch (error) {
							logServerError('auth/signIn', 'background roster sync failed', error);
						}
					})();
				}
				return true;
			},
			async session({ session, user }: { session: Session; user: AdapterUser }) {
				if (user?.id && session) {
					try {
						await createOrUpdateUserProfile(user.id, {
							battletag: session.user?.name || 'Unknown'
						});
					} catch (error) {
						logServerError('auth/session', 'failed to upsert user profile', error);
					}

					try {
						await updateUserLastSeen(user.id);
					} catch (error) {
						logServerError('auth/session', 'failed to update last_seen', error);
					}
				}
				return session;
			}
		}
	};

	return authRequest;
});
