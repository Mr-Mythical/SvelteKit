import type { RequestHandler } from '@sveltejs/kit';
import { getRaidDb } from '$lib/db';
import { deathHotspots } from '$lib/db/schema';
import { and, eq, asc } from 'drizzle-orm';
import { apiError, apiOk } from '$lib/server/apiResponses';
import { handleApiError } from '$lib/server/logger';
import { parseWclDifficultyParam } from '$lib/raidDifficulty';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const bossId = url.searchParams.get('bossId');
		if (!bossId) {
			return apiError('No bossId provided', 400);
		}

		const difficulty = parseWclDifficultyParam(url.searchParams.get('difficulty'));
		const data = await getRaidDb()
			.select({
				time_seconds: deathHotspots.timeSeconds,
				death_count: deathHotspots.deathCount,
				sample_count: deathHotspots.sampleCount
			})
			.from(deathHotspots)
			.where(
				and(
					eq(deathHotspots.encounterId, parseInt(bossId)),
					eq(deathHotspots.difficulty, difficulty)
				)
			)
			.orderBy(asc(deathHotspots.timeSeconds));

		return apiOk(data);
	} catch (error) {
		return handleApiError(
			'api/death-hotspots',
			error,
			error instanceof Error ? error.message : 'Database connection failed'
		);
	}
};
