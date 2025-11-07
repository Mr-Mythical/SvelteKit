import { SvelteKitAuth } from '@auth/sveltekit';
import BattleNet from '@auth/core/providers/battlenet';
import { BLIZZARD_CLIENT_ID, BLIZZARD_CLIENT_SECRET, AUTH_SECRET } from '$env/static/private';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { getUserDb } from '$lib/db/userDb.js';
import { users, accounts, sessions } from '$lib/db/userSchema.js';
import { updateUserLastSeen } from '$lib/db/users.js';
import { autoImportOnLogin } from '$lib/db/migration.js';

// Lazy-load the adapter to avoid build-time database connection issues
function createLazyAdapter() {
	let adapter: any;
	return () => {
		if (!adapter) {
			// Cast sessions to any to satisfy DrizzleAdapter's expected table type
			adapter = DrizzleAdapter(getUserDb(), {
				usersTable: users,
				accountsTable: accounts,
				sessionsTable: sessions as any
			});
		}
		return adapter;
	};
}

const getAdapter = createLazyAdapter();

export const { handle, signIn, signOut } = SvelteKitAuth({
	get adapter() {
		return getAdapter();
	},
	providers: [
		BattleNet({
			clientId: BLIZZARD_CLIENT_ID,
			clientSecret: BLIZZARD_CLIENT_SECRET,
			issuer: 'https://eu.battle.net/oauth',
			checks: ['pkce', 'nonce'],
			authorization: { params: { scope: 'openid' } },
			profile(profile) {
				return {
					id: profile.sub,
					name: profile.battle_tag || profile.battletag,
					email: null,
					image: null,
					battletag: profile.battle_tag || profile.battletag
				};
			}
		})
	],
	secret: AUTH_SECRET,
	trustHost: true,
	debug: false,
	callbacks: {
		async session({ session, token }) {
			if (token?.sub) {
				session.user.id = token.sub;
				(session.user as any).battletag = token.battletag as string;

				// Update last seen timestamp and auto-import if needed
				try {
					await updateUserLastSeen(token.sub);
					await autoImportOnLogin(token.sub);

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
				token.battletag = (profile as any).battletag;
			}
			return token;
		}
	}
});
