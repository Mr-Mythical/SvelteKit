import { apiError } from './apiResponses';

interface AuthLocals {
	getSession?: () => Promise<{ user?: { id?: string } } | null | undefined>;
}

export interface AuthenticatedSession {
	user: { id: string };
}

/**
 * Resolves the current session and returns either:
 * - `{ session }` when the user is authenticated, or
 * - `{ response }` carrying a 401 `{ error }` response that the handler should
 *   return immediately.
 *
 * Standardizing on this helper means every protected endpoint surfaces auth
 * failures with the same status (`401`) and shape (`{ error }`), so clients
 * can branch on `response.status === 401` instead of inspecting payloads.
 *
 * Usage:
 * ```ts
 * const auth = await requireSession(locals);
 * if ('response' in auth) return auth.response;
 * const userId = auth.session.user.id;
 * ```
 */
export async function requireSession(
	locals: AuthLocals
): Promise<{ session: AuthenticatedSession } | { response: Response }> {
	const session = await locals.getSession?.();
	if (!session?.user?.id) {
		return { response: apiError('Not authenticated', 401) };
	}
	return { session: { user: { id: session.user.id } } };
}
