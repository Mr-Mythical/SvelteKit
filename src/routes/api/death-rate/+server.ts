import type { RequestHandler } from '@sveltejs/kit';
import { getRaidDb } from '$lib/db';
import { deathRate } from '$lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { apiError, apiOk } from '$lib/server/apiResponses';
import { handleApiError } from '$lib/server/logger';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const bossId = url.searchParams.get('bossId');
		if (!bossId) {
			return apiError('No bossId provided', 400);
		}

		const data = await getRaidDb()
			.select({
				time_seconds: deathRate.timeSeconds,
				death_count: deathRate.deathCount,
				sample_count: deathRate.sampleCount
			})
			.from(deathRate)
			.where(eq(deathRate.encounterId, parseInt(bossId)))
			.orderBy(asc(deathRate.timeSeconds));

		return apiOk(data);
	} catch (error) {
		return handleApiError(
			'api/death-rate',
			error,
			error instanceof Error ? error.message : 'Database connection failed'
		);
	}
};
