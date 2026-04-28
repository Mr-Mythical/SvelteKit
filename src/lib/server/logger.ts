/**
 * Server-side error logger.
 *
 * One line, one shape, one prefix format. Call sites previously drifted
 * between `'Error in /api/x:'`, `'x: failed'`, `'Database error in /api/y:'`,
 * and `'Error details:', { name, message, stack }` — making it impossible to
 * grep for "every error from a given route" or to reason about the log shape.
 *
 * All server error/warn logs flow through here so that:
 * - The first argument is always a stable `[scope]` tag that identifies the
 *   route or module (e.g. `'api/damage-average'`, `'db/users'`).
 * - The second is a human-readable summary of the failure.
 * - The third is the error/detail object, untouched, so log aggregators can
 *   still pull out stack traces.
 */
import { apiError } from './apiResponses';

export function logServerError(scope: string, message: string, error: unknown): void {
	console.error(`[${scope}] ${message}`, error);
}

export function logServerWarn(scope: string, message: string, detail?: unknown): void {
	if (detail === undefined) {
		console.warn(`[${scope}] ${message}`);
	} else {
		console.warn(`[${scope}] ${message}`, detail);
	}
}

/**
 * Catch-block helper for API handlers. Logs the full error server-side
 * (including stack via the underlying error object) and returns a sanitized
 * `{ error: string }` 500 response — so server logs keep full context but
 * clients never see internal details.
 *
 * Use at every top-level `} catch (error) {` in a route handler:
 *
 *     } catch (error) {
 *         return handleApiError('api/foo', error);
 *     }
 */
export function handleApiError(
	scope: string,
	error: unknown,
	clientMessage: string = 'Internal Server Error.',
	status: number = 500
): Response {
	logServerError(scope, 'request failed', error);
	return apiError(clientMessage, status);
}
