import { SvelteKitAuth } from '@auth/sveltekit';
import BattleNet from '@auth/core/providers/battlenet';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { getUserDb } from '$lib/db/userDb.js';
import { users, accounts, sessions, verificationTokens } from '$lib/db/userSchema.js';
import { updateUserLastSeen, createOrUpdateUserProfile } from '$lib/db/users.js';
import { env } from '$env/dynamic/private';

// Simple adapter creation - your database connection is working
function createAdapter() {
	console.log('Creating DrizzleAdapter with user database connection...');
	const db = getUserDb();
	console.log('User database instance created successfully');
	
	const adapter = DrizzleAdapter(db, {
		usersTable: users,
		accountsTable: accounts,
		sessionsTable: sessions,
		verificationTokensTable: verificationTokens
	});
	
	console.log('DrizzleAdapter created successfully');
	return adapter;
}

export const { handle, signIn, signOut } = SvelteKitAuth(async (event) => {
	const authRequest = {
		adapter: createAdapter(),
		providers: [
			BattleNet({
				clientId: env.AUTH_BATTLENET_ID,
				clientSecret: env.AUTH_BATTLENET_SECRET,
				issuer: 'https://eu.battle.net/oauth'
			})
		],
		secret: env.AUTH_SECRET,
		trustHost: true,
		debug: true,
		callbacks: {
			async signIn({ user, account, profile }: any) {
				console.log('SignIn callback:', { user, account, profile });
				if (account?.provider === 'battlenet') {
					try {
						// Create or update user profile
						await createOrUpdateUserProfile(user.id || account.providerAccountId, {
							battletag: (profile as any)?.battle_tag || user.name || 'Unknown'
						});
						console.log('User profile created/updated successfully');
						return true;
					} catch (error) {
						console.error('Error creating/updating user profile:', error);
						return false;
					}
				}
				return true;
			},
			async session({ session, user }: any) {
				console.log('Session callback:', { session, user });
				// Update last seen on each session check
				if (user?.id) {
					try {
						await updateUserLastSeen(user.id);
					} catch (error) {
						console.error('Error updating last seen:', error);
					}
				}
				return session;
			}
		}
	};

	return authRequest;
});
