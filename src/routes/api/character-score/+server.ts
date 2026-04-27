import type { RequestHandler } from './$types';
import { apiError, apiOk } from '$lib/server/apiResponses';
import {
	blizzardScoreSource,
	raiderIoScoreSource,
	resolveScore,
	type ScoreResult
} from '$lib/server/scoreSources';

const VALID_REGIONS = new Set(['us', 'eu', 'kr', 'tw']);

const SCORE_SOURCES = [blizzardScoreSource, raiderIoScoreSource] as const;

/**
 * GET /api/character-score
 *
 * Resolves a character's Mythic+ score by walking the {@link SCORE_SOURCES}
 * fallback chain (Blizzard first — authoritative, includes tier color — then
 * Raider.IO). Per-source request shaping (slug variants, timeouts) lives in
 * `$lib/server/scoreSources`.
 *
 * Query: `name`, `region` (us|eu|kr|tw), `realm` (display name or slug),
 *        optional `debug=1` to include the per-attempt log.
 *
 * Returns:
 * - 200 `ScoreResult` (`source` is `'blizzard'`, `'raiderio'`, or `null` if
 *   neither provider returned a score).
 * - 400 standard `{ error }` envelope when params are missing or `region`
 *   is not in {@link VALID_REGIONS}.
 *
 * @throws Never — provider/network errors are swallowed by each source and
 *         surfaced as a null score so the UI can render a fallback.
 */
export const GET: RequestHandler = async ({ url, setHeaders }) => {
	const name = url.searchParams.get('name')?.trim();
	const region = url.searchParams.get('region')?.toLowerCase().trim();
	const realm = url.searchParams.get('realm')?.trim();
	const debug = url.searchParams.get('debug') === '1';

	if (!name || !region || !realm || !VALID_REGIONS.has(region)) {
		return apiError('Missing or invalid name/region/realm', 400);
	}

	const { result, attemptsBySource } = await resolveScore(SCORE_SOURCES, region, realm, name);

	// Short CDN cache: scores change with every completed key, but we don't need second-level freshness.
	setHeaders({ 'cache-control': 'public, max-age=300, s-maxage=300' });

	if (debug) {
		return apiOk({
			...result,
			debug: {
				blizzardStatus: attemptsBySource.blizzard[0]?.status ?? null,
				raiderIoAttempts: attemptsBySource.raiderio
			}
		});
	}

	return apiOk(result);
};
