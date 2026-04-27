import type { RequestHandler } from '@sveltejs/kit';
import { getRaidDb } from '$lib/db';
import { specPerformance } from '$lib/db/schema';
import { eq, desc, and, type SQL } from 'drizzle-orm';
import { apiError, apiOk } from '$lib/server/apiResponses';
import { handleApiError } from '$lib/server/logger';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const encounterId = url.searchParams.get('encounterId');
		const difficulty = url.searchParams.get('difficulty');
		const fightFilter = url.searchParams.get('fightFilter');
		const role = url.searchParams.get('role'); // Single role: 'dps', 'tank', or 'healer'
		const metric = url.searchParams.get('metric'); // 'dps' or 'hps'

		if (!encounterId) {
			return apiError('encounterId is required', 400);
		}

		if (!role || !metric) {
			return apiError('role and metric are required', 400);
		}

		const database = getRaidDb();

		const whereConditions: (SQL | undefined)[] = [
			eq(specPerformance.encounterId, parseInt(encounterId))
		];

		if (difficulty) {
			whereConditions.push(eq(specPerformance.difficulty, parseInt(difficulty)));
		}

		// Handle fight filtering
		if (fightFilter === 'kills_wipes') {
			whereConditions.push(eq(specPerformance.isKill, false));
		} else if (fightFilter === 'kills_no_deaths') {
			whereConditions.push(
				and(eq(specPerformance.isKill, true), eq(specPerformance.deathCount, 0))
			);
		} else if (fightFilter === 'kills_all') {
			whereConditions.push(eq(specPerformance.isKill, true));
		}

		const HEALER_SPECS = ['Restoration', 'Holy', 'Mistweaver', 'Discipline', 'Preservation'];
		const TANK_SPECS = ['Blood', 'Protection', 'Brewmaster', 'Guardian', 'Vengeance'];

		let roleSpecs: string[] = [];
		const orderByColumn = metric === 'hps' ? specPerformance.hps : specPerformance.dps;

		switch (role) {
			case 'healer':
				roleSpecs = HEALER_SPECS;
				break;
			case 'tank':
				roleSpecs = TANK_SPECS;
				break;
			case 'dps':
				break;
			default:
				return apiError('Invalid role', 400);
		}

		// DPS leaderboard is high-volume; cap at 2000 rows for the dedup pass.
		// Tank/healer pools are small enough that we can scan the full set.
		const baseQuery = database
			.select({
				id: specPerformance.id,
				player_name: specPerformance.playerName,
				spec_icon: specPerformance.specIcon,
				dps: specPerformance.dps,
				hps: specPerformance.hps,
				damage_done: specPerformance.damageDone,
				healing_done: specPerformance.healingDone,
				report_code: specPerformance.reportCode,
				fight_id: specPerformance.fightId,
				is_kill: specPerformance.isKill,
				death_count: specPerformance.deathCount
			})
			.from(specPerformance)
			.where(and(...whereConditions))
			.orderBy(desc(orderByColumn));

		const results = role === 'dps' ? await baseQuery.limit(2000) : await baseQuery;

		// Deduplicate by player_name + spec_icon, keeping the best performance for each unique player
		type TopPlayerRow = (typeof results)[number];
		const playerMap = new Map<string, TopPlayerRow>();
		const metricKey = metric === 'hps' ? 'hps' : 'dps';

		for (const row of results) {
			const key = `${row.player_name}-${row.spec_icon}`;
			const existing = playerMap.get(key);
			if (!existing || (row[metricKey] ?? 0) > (existing[metricKey] ?? 0)) {
				playerMap.set(key, row);
			}
		}

		const deduplicatedResults = Array.from(playerMap.values());

		// Filter results based on role
		let filteredResults;
		if (role === 'dps') {
			filteredResults = deduplicatedResults.filter((result) => {
				const specName = result.spec_icon.split('-')[1];
				return (
					specName &&
					!HEALER_SPECS.some((spec) => specName.toLowerCase() === spec.toLowerCase()) &&
					!TANK_SPECS.some((spec) => specName.toLowerCase() === spec.toLowerCase())
				);
			});
		} else {
			filteredResults = deduplicatedResults.filter((result) => {
				const specName = result.spec_icon.split('-')[1];
				return specName && roleSpecs.some((spec) => specName.toLowerCase() === spec.toLowerCase());
			});
		}

		// Take top 50
		const topResults = filteredResults.slice(0, 50);

		// Return results
		const result = topResults.map((r) => ({
			id: r.id,
			player_name: r.player_name,
			spec_icon: r.spec_icon,
			dps: r.dps ?? 0,
			hps: r.hps ?? 0,
			damage_done: r.damage_done ?? 0,
			healing_done: r.healing_done ?? 0,
			report_url: `https://www.warcraftlogs.com/reports/${r.report_code}#fight=${r.fight_id}`,
			is_kill: r.is_kill,
			death_count: r.death_count
		}));

		return apiOk(result);
	} catch (error) {
		return handleApiError('api/top-players', error, 'Failed to fetch top players');
	}
};
