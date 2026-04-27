import type { RequestHandler } from '@sveltejs/kit';
import { apiError, apiOk } from '$lib/server/apiResponses';
import { handleApiError } from '$lib/server/logger';
import {
	getTopPlayers,
	type FightFilter,
	type Metric,
	type Role
} from '$lib/server/topPlayers';

const VALID_ROLES = new Set<Role>(['dps', 'tank', 'healer']);
const VALID_METRICS = new Set<Metric>(['dps', 'hps']);
const VALID_FIGHT_FILTERS = new Set<NonNullable<FightFilter>>([
	'kills_wipes',
	'kills_no_deaths',
	'kills_all'
]);

export const GET: RequestHandler = async ({ url }) => {
	try {
		const encounterIdParam = url.searchParams.get('encounterId');
		const difficultyParam = url.searchParams.get('difficulty');
		const fightFilterParam = url.searchParams.get('fightFilter');
		const roleParam = url.searchParams.get('role');
		const metricParam = url.searchParams.get('metric');

		if (!encounterIdParam) {
			return apiError('encounterId is required', 400);
		}
		if (!roleParam || !metricParam) {
			return apiError('role and metric are required', 400);
		}
		if (!VALID_ROLES.has(roleParam as Role)) {
			return apiError('Invalid role', 400);
		}
		if (!VALID_METRICS.has(metricParam as Metric)) {
			return apiError('Invalid metric', 400);
		}

		const encounterId = Number.parseInt(encounterIdParam, 10);
		if (!Number.isFinite(encounterId)) {
			return apiError('encounterId must be an integer', 400);
		}

		const difficulty =
			difficultyParam !== null ? Number.parseInt(difficultyParam, 10) : null;
		if (difficulty !== null && !Number.isFinite(difficulty)) {
			return apiError('difficulty must be an integer', 400);
		}

		const fightFilter: FightFilter =
			fightFilterParam && VALID_FIGHT_FILTERS.has(fightFilterParam as NonNullable<FightFilter>)
				? (fightFilterParam as NonNullable<FightFilter>)
				: null;

		const result = await getTopPlayers({
			encounterId,
			difficulty,
			fightFilter,
			role: roleParam as Role,
			metric: metricParam as Metric
		});

		return apiOk(result);
	} catch (error) {
		return handleApiError('api/top-players', error, 'Failed to fetch top players');
	}
};
