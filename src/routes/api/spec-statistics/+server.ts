import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { specStatistics } from '$lib/db/schema';
import { eq, and, desc, or, isNull } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const encounterId = url.searchParams.get('encounterId');
		const difficulty = url.searchParams.get('difficulty');
		const fightFilter = url.searchParams.get('fightFilter');

		if (!encounterId) {
			return json({ error: 'No encounterId provided' }, { status: 400 });
		}

		console.log('[spec-statistics] Query params:', { encounterId, difficulty, fightFilter });

		const database = db();

		// Build where conditions
		const conditions = [eq(specStatistics.encounterId, parseInt(encounterId))];

		if (difficulty) {
			conditions.push(eq(specStatistics.difficulty, parseInt(difficulty)));
		}

		// Only apply fight filtering if fightFilter is provided
		if (fightFilter) {
			let fightCondition;
			if (fightFilter === 'kills_wipes') {
				// kills_only = FALSE (kills and wipes without death consideration)
				fightCondition = eq(specStatistics.killsOnly, false);
			} else if (fightFilter === 'kills_no_deaths') {
				// kills_only = TRUE AND death_filter = 'no_deaths' (kills where spec didn't die)
				fightCondition = and(
					eq(specStatistics.killsOnly, true),
					eq(specStatistics.deathFilter, 'no_deaths')
				);
			} else if (fightFilter === 'kills_all') {
				// kills_only = TRUE AND death_filter = 'all' (kills regardless of deaths)
				fightCondition = and(
					eq(specStatistics.killsOnly, true),
					eq(specStatistics.deathFilter, 'all')
				);
			}

			if (fightCondition) {
				conditions.push(fightCondition);
			}
		}

		const data = await database
			.select({
				id: specStatistics.id,
				encounter_id: specStatistics.encounterId,
				region: specStatistics.region,
				spec_icon: specStatistics.specIcon,
				difficulty: specStatistics.difficulty,
				kills_only: specStatistics.killsOnly,
				death_filter: specStatistics.deathFilter,
				avg_damage_done: specStatistics.avgDamageDone,
				avg_healing_done: specStatistics.avgHealingDone,
				avg_dps: specStatistics.avgDps,
				avg_hps: specStatistics.avgHps,
				max_damage_done: specStatistics.maxDamageDone,
				max_healing_done: specStatistics.maxHealingDone,
				max_dps: specStatistics.maxDps,
				max_hps: specStatistics.maxHps,
				min_damage_done: specStatistics.minDamageDone,
				min_healing_done: specStatistics.minHealingDone,
				min_dps: specStatistics.minDps,
				min_hps: specStatistics.minHps,
				avg_death_time: specStatistics.avgDeathTime,
				death_rate: specStatistics.deathRate,
				sample_count: specStatistics.sampleCount,
				last_updated: specStatistics.lastUpdated
			})
			.from(specStatistics)
			.where(and(...conditions))
			.orderBy(desc(specStatistics.avgDps), desc(specStatistics.avgHps));

		console.log('[spec-statistics] Found', data.length, 'records');

		return json(data);
	} catch (error) {
		console.error('Database error in /api/spec-statistics:', error);
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
