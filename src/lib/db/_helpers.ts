/**
 * Shared error-logging wrapper for Drizzle DB operations.
 * All DB modules use this so logging is consistent and route handlers see
 * either the raw value or a re-thrown error (no swallowed failures).
 */
export async function dbOperation<T>(label: string, fn: () => Promise<T>): Promise<T> {
	try {
		return await fn();
	} catch (error) {
		console.error(`[db] ${label} failed:`, error);
		throw error;
	}
}

/** Variant that returns a fallback instead of re-throwing. Use for read paths
 * where a partial UI is acceptable. */
export async function dbOperationOr<T>(
	label: string,
	fallback: T,
	fn: () => Promise<T>
): Promise<T> {
	try {
		return await fn();
	} catch (error) {
		console.error(`[db] ${label} failed:`, error);
		return fallback;
	}
}
