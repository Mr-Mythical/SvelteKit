import { json, type RequestHandler } from '@sveltejs/kit';
import { getRaidDb } from '$lib/db';
import { specStatistics } from '$lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { apiError } from '$lib/server/apiResponses';
import { handleApiError } from '$lib/server/logger';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const encounterId = url.searchParams.get('encounterId');
		const difficulty = url.searchParams.get('difficulty');
		const fightFilter = url.searchParams.get('fightFilter');

		if (!encounterId) {
			return apiError('No encounterId provided', 400);
		}

		const database = getRaidDb();

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

		return json(data);
	} catch (error) {
		return handleApiError(
			'api/spec-statistics',
			error,
			error instanceof Error ? error.message : 'Database connection failed'
		);
	}
};
