import { json, type RequestHandler } from '@sveltejs/kit';
import { getRaidDb } from '$lib/db';
import { deathHotspots } from '$lib/db/schema';
import { eq, asc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const bossId = url.searchParams.get('bossId');
		if (!bossId) {
			return json({ error: 'No bossId provided' }, { status: 400 });
		}

		const data = await getRaidDb()
			.select({
				time_seconds: deathHotspots.timeSeconds,
				death_count: deathHotspots.deathCount,
				sample_count: deathHotspots.sampleCount
			})
			.from(deathHotspots)
			.where(eq(deathHotspots.encounterId, parseInt(bossId)))
			.orderBy(asc(deathHotspots.timeSeconds));

		return json(data);
	} catch (error) {
		console.error('Database error in /api/death-hotspots:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Database connection failed' },
			{ status: 500 }
		);
	}
};
