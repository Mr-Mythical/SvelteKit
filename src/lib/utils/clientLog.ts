import { toast } from 'svelte-sonner';

/**
 * Centralized client-side error logging.
 *
 * Use this instead of bare `console.error(message, err)` so every component
 * gets the same message shape (scope-prefixed) and we have one seam for
 * future structured logging or remote error reporting.
 *
 * @param scope short identifier of where the failure happened (e.g. component name)
 * @param message human-readable description of the failed operation
 * @param error  the thrown value or unexpected response
 */
export function logClientError(scope: string, message: string, error: unknown): void {
	console.error(`[${scope}] ${message}`, error);
}

/**
 * Same as {@link logClientError} but also surfaces a toast to the user.
 * Use only when the failure is user-visible and recoverable.
 */
export function notifyClientError(scope: string, message: string, error: unknown): void {
	logClientError(scope, message, error);
	toast.error(message);
}
