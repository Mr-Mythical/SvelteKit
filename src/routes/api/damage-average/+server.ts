import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { damageAverages } from '$lib/db/schema';
import { eq, asc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const bossId = url.searchParams.get('bossId');

		if (!bossId) {
			return json({ error: 'No bossId provided' }, { status: 400 });
		}

		const database = db();

		const data = await database
			.select({
				time_seconds: damageAverages.timeSeconds,
				avg_damage: damageAverages.avgDamage,
				std_dev: damageAverages.stdDev,
				count: damageAverages.count,
				confidence_interval: damageAverages.confidenceInterval,
				encounter_id: damageAverages.encounterId
			})
			.from(damageAverages)
			.where(eq(damageAverages.encounterId, parseInt(bossId)))
			.orderBy(asc(damageAverages.timeSeconds));

		const processedData = data.map((row) => ({
			time_seconds: row.time_seconds,
			avg: row.avg_damage,
			std: row.std_dev,
			n: row.count,
			ci: row.confidence_interval,
			encounter_id: row.encounter_id
		}));

		return json(processedData);
	} catch (error) {
		console.error('Database error in /api/damage-average:', error);
		console.error('Error details:', {
			name: error instanceof Error ? error.name : 'Unknown',
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined
		});

		return json(
			{
				error: error instanceof Error ? error.message : 'Database connection failed',
				debug: process.env.NODE_ENV === 'development' ? String(error) : undefined
			},
			{ status: 500 }
		);
	}
};
