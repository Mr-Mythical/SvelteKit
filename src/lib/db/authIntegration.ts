/**
 * Integration example for Auth.js to handle automatic user creation and old data import
 * Add this to your Auth.js callbacks or session handling
 */

import { upsertUserFromAuth, updateUserLastSeen } from '$lib/db/users.js';
import { autoImportOnLogin } from '$lib/db/migration.js';

/**
 * Enhanced Auth.js session callback with database integration
 * Add this to your auth.ts file
 */
export async function enhancedSessionCallback({ session, token }: any) {
	if (!session?.user) return session;

	try {
		// Create or update user in database
		const user = await upsertUserFromAuth({
			id: session.user.id || token.sub,
			battletag: session.user.battletag || token.battletag,
			name: session.user.name,
			email: session.user.email,
			image: session.user.image
		});

		// Update last seen timestamp
		await updateUserLastSeen(user.id);

		// Auto-import old localStorage data if this is first login after migration
		await autoImportOnLogin(user.id);

		// Add user data to session for easy access
		session.user.id = user.id;
		session.user.battletag = user.battletag;
		session.user.preferences = user.preferences;

		return session;
	} catch (error) {
		console.error('Error in enhanced session callback:', error);
		// Return session anyway to not break auth
		return session;
	}
}

/**
 * Enhanced JWT callback for Auth.js
 * Add this to your auth.ts file
 */
export async function enhancedJwtCallback({ token, account, profile }: any) {
	if (account) {
		token.accessToken = account.access_token;
	}
	if (profile) {
		token.battletag = (profile as any).battletag;
	}
	return token;
}

/**
 * Example of how to integrate this into your existing auth.ts file:
 *
 * import { enhancedSessionCallback, enhancedJwtCallback } from '$lib/db/authIntegration.js';
 *
 * export const { handle, signIn, signOut } = SvelteKitAuth({
 *   providers: [BattleNet({...})],
 *   callbacks: {
 *     async session({ session, token }) {
 *       return await enhancedSessionCallback({ session, token });
 *     },
 *     async jwt({ token, account, profile }) {
 *       return await enhancedJwtCallback({ token, account, profile });
 *     }
 *   }
 * });
 */
