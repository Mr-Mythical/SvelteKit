import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { specPerformance } from '$lib/db/schema';
import { eq, desc, and, or, max, min } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const encounterId = url.searchParams.get('encounterId');
		const difficulty = url.searchParams.get('difficulty');
		const fightFilter = url.searchParams.get('fightFilter');
		const role = url.searchParams.get('role'); // Single role: 'dps', 'tank', or 'healer'
		const metric = url.searchParams.get('metric'); // 'dps' or 'hps'

		if (!encounterId) {
			return json({ error: 'encounterId is required' }, { status: 400 });
		}

		if (!role || !metric) {
			return json({ error: 'role and metric are required' }, { status: 400 });
		}

		const database = db();

		let whereConditions: any[] = [eq(specPerformance.encounterId, parseInt(encounterId))];

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
		let orderByColumn = metric === 'hps' ? specPerformance.hps : specPerformance.dps;

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
				return json({ error: 'Invalid role' }, { status: 400 });
		}

		let query;

		if (role === 'dps') {
			query = database
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
				.orderBy(desc(orderByColumn))
				.limit(2000);
		} else {
			query = database
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
			// No limit here - get ALL players of this role for the encounter
		}

		const results = await query;
		if (results.length > 0) {
			// Sample record available for debugging if needed
		}

		// Deduplicate by player_name + spec_icon, keeping the best performance for each unique player
		const playerMap = new Map<string, any>();
		const duplicatesFound: string[] = [];

		for (const result of results) {
			const key = `${result.player_name}-${result.spec_icon}`;
			const existing = playerMap.get(key);

			if (!existing) {
				playerMap.set(key, result);
			} else {
				duplicatesFound.push(`${result.player_name} (${result.spec_icon})`);
				// Keep the better performance based on the ordering metric
				const metricKey = metric === 'hps' ? 'hps' : 'dps';
				const currentValue = result[metricKey] || 0;
				const existingValue = existing[metricKey] || 0;

				if (currentValue > existingValue) {
					playerMap.set(key, result);
				}
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

		return json(result);
	} catch (error) {
		console.error('Error in /api/top-players:', error);
		return json({ error: 'Failed to fetch top players' }, { status: 500 });
	}
};
