import { SvelteKitAuth } from '@auth/sveltekit';
import BattleNet from '@auth/core/providers/battlenet';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { getUserDb } from '$lib/db/userDb.js';
import { users, accounts, sessions, verificationTokens } from '$lib/db/userSchema.js';
import { updateUserLastSeen, createOrUpdateUserProfile } from '$lib/db/users.js';
import { env } from '$env/dynamic/private';

// Lazy-load the adapter to avoid build-time database connection issues
function createLazyAdapter() {
	let adapter: any;
	return () => {
		if (!adapter) {
			try {
				console.log('Creating DrizzleAdapter with database connection...');
				const db = getUserDb();
				console.log('Database instance created successfully');
				
				adapter = DrizzleAdapter(db, {
					usersTable: users,
					accountsTable: accounts,
					sessionsTable: sessions,
					verificationTokensTable: verificationTokens
				});
				console.log('DrizzleAdapter created successfully');
			} catch (error) {
				console.error('Failed to create DrizzleAdapter:', error);
				throw error;
			}
		}
		return adapter;
	};
}

const getAdapter = createLazyAdapter();

export const { handle, signIn, signOut } = SvelteKitAuth(async (event) => {
	// Debug environment variables
	console.log('Auth Debug - Environment Variables:', {
		hasClientId: !!env.BLIZZARD_CLIENT_ID,
		hasClientSecret: !!env.BLIZZARD_CLIENT_SECRET,
		hasAuthSecret: !!env.AUTH_SECRET,
		clientIdStart: env.BLIZZARD_CLIENT_ID?.substring(0, 8) + '...',
		domain: event.url.origin,
		pathname: event.url.pathname,
		// Debug database URLs
		hasDatabaseUserUrl: !!env.DATABASE_USER_URL,
		hasDatabaseUrl: !!env.DATABASE_URL,
		databaseUserUrlEnd: env.DATABASE_USER_URL?.slice(-20),
		databaseUrlEnd: env.DATABASE_URL?.slice(-20)
	});

	return {
		get adapter() {
			return getAdapter();
		},
		providers: [
			BattleNet({
				clientId: env.BLIZZARD_CLIENT_ID,
				clientSecret: env.BLIZZARD_CLIENT_SECRET,
				issuer: 'https://eu.battle.net/oauth',
				checks: ['pkce', 'nonce'],
				authorization: { params: { scope: 'openid' } },
				profile(profile: any) {
					console.log('Battle.net profile received:', profile);
					return {
						id: profile.sub,
						name: profile.battle_tag || profile.battletag,
						email: `${profile.battle_tag || profile.battletag}@battlenet.local`, // Required by Auth.js
						image: null,
						battletag: profile.battle_tag || profile.battletag
					};
				}
			})
		],
		secret: env.AUTH_SECRET,
		trustHost: true,
		debug: true, // Enable debug logging
		callbacks: {
			async signIn({ user, account, profile }) {
				// Create user profile when user signs in for the first time
				if (account?.provider === 'battlenet' && user.id) {
					try {
						const battletag = (profile as any)?.battle_tag || (profile as any)?.battletag;

						await createOrUpdateUserProfile(user.id, {
							battletag: battletag,
							battlenetAccessToken: account.access_token || undefined,
							battlenetRefreshToken: account.refresh_token || undefined,
							battlenetExpiresAt: account.expires_at
								? new Date(account.expires_at * 1000)
								: undefined
						});
					} catch (error) {
						console.error('Error creating user profile:', error);
						// Don't block auth flow
					}
				}
				return true;
			},
			async session({ session, token }) {
				if (token?.sub) {
					session.user.id = token.sub;
					(session.user as any).battletag = token.battletag as string;

					// Update last seen timestamp
					try {
						await updateUserLastSeen(token.sub);
						console.log('Session callback completed for user:', token.sub);
					} catch (error) {
						console.error('Error in session callback:', error);
						// Don't break auth flow - continue with session
					}
				}
				return session;
			},
			async jwt({ token, account, profile }) {
				if (account) {
					token.accessToken = account.access_token;
				}
				if (profile) {
					token.battletag = (profile as any).battle_tag || (profile as any).battletag;
				}
				return token;
			}
		}
	};
});
