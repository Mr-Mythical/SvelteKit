/**
 * Shared error-handling wrapper for Drizzle DB operations.
 *
 * # Contract
 *
 * Every exported DB function in `src/lib/db/*` is expected to wrap its work in
 * `dbOperation`. The contract is:
 *
 *   - Success → resolves with the typed value (the function's normal return).
 *   - Failure → logs once at the DB layer (with the `label`) and **rethrows**.
 *
 * Read functions that "have no result" return a domain-natural empty value
 * (`null`, `[]`, etc.) only when the query *succeeded* and produced no rows.
 * Errors are never silently translated to those empty values — callers are
 * responsible for catching and degrading UX (e.g. returning `apiError(...)`
 * from a route handler) so partial failures stay observable.
 */
export async function dbOperation<T>(label: string, fn: () => Promise<T>): Promise<T> {
	try {
		return await fn();
	} catch (error) {
		console.error(`[db] ${label} failed:`, error);
		throw error;
	}
}
