/**
 * Tiny TTL cache for per-isolate (per-worker) in-memory deduplication of
 * expensive upstream calls. Not a persistent or cross-isolate cache — its
 * purpose is to absorb bursts (e.g. a user mounting a component on every
 * navigation) without re-querying a points-rate-limited upstream like
 * Warcraft Logs.
 *
 * The same key may resolve concurrently — `getOrSet` deduplicates in-flight
 * promises so N concurrent requests trigger 1 upstream call.
 */

interface CacheEntry<T> {
	value: T;
	expires: number;
}

interface PendingEntry<T> {
	promise: Promise<T>;
	expires: number;
}

const store = new Map<string, CacheEntry<unknown>>();
const pending = new Map<string, PendingEntry<unknown>>();

function now(): number {
	return Date.now();
}

export function memoryCacheGet<T>(key: string): T | undefined {
	const entry = store.get(key);
	if (!entry) return undefined;
	if (entry.expires <= now()) {
		store.delete(key);
		return undefined;
	}
	return entry.value as T;
}

export function memoryCacheSet<T>(key: string, value: T, ttlMs: number): void {
	store.set(key, { value, expires: now() + ttlMs });
}

export function memoryCacheDelete(key: string): void {
	store.delete(key);
}

/**
 * Return a cached value or compute it via `fetcher`. Concurrent callers with
 * the same key share a single in-flight promise. On error, the failure is
 * not cached.
 */
export async function memoryCacheGetOrSet<T>(
	key: string,
	ttlMs: number,
	fetcher: () => Promise<T>
): Promise<T> {
	const cached = memoryCacheGet<T>(key);
	if (cached !== undefined) return cached;

	const inflight = pending.get(key) as PendingEntry<T> | undefined;
	if (inflight && inflight.expires > now()) {
		return inflight.promise;
	}

	const promise = (async () => {
		try {
			const value = await fetcher();
			memoryCacheSet(key, value, ttlMs);
			return value;
		} finally {
			pending.delete(key);
		}
	})();

	pending.set(key, { promise, expires: now() + 30_000 });
	return promise;
}
