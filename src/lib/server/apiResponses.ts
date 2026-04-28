import { json } from '@sveltejs/kit';

/**
 * Standardized error response. All API endpoints should use this so clients
 * see a single shape: `{ error: string }` with the appropriate HTTP status.
 */
export function apiError(message: string, status: number = 500): Response {
	return json({ error: message }, { status });
}

/**
 * Standardized success response. Equivalent to SvelteKit's `json()` but kept
 * symmetrical with `apiError` so endpoints read consistently.
 */
export function apiOk<T>(body: T, status: number = 200): Response {
	return json(body, { status });
}
