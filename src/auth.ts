import { SvelteKitAuth } from '@auth/sveltekit';
import BattleNet from '@auth/core/providers/battlenet';
import { BLIZZARD_CLIENT_ID, BLIZZARD_CLIENT_SECRET, AUTH_SECRET } from '$env/static/private';

export const { handle, signIn, signOut } = SvelteKitAuth({
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
				session.user.battletag = token.battletag as string;
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
