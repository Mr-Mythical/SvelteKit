import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { specPerformance } from '$lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const encounterId = url.searchParams.get('encounterId');
		const specIcon = url.searchParams.get('specIcon');
		const difficulty = url.searchParams.get('difficulty');
		const fightFilter = url.searchParams.get('fightFilter') || 'kills';
		const metric = url.searchParams.get('metric') || 'dps';

		if (!encounterId || !specIcon) {
			return json({ error: 'encounterId and specIcon are required' }, { status: 400 });
		}

		const database = db();

		let whereConditions: any[] = [
			eq(specPerformance.encounterId, parseInt(encounterId)),
			eq(specPerformance.specIcon, specIcon)
		];

		if (difficulty) {
			whereConditions.push(eq(specPerformance.difficulty, parseInt(difficulty)));
		}

		// Handle fight filtering
		if (fightFilter === 'kills_wipes') {
			whereConditions.push(eq(specPerformance.isKill, false));
		} else if (fightFilter === 'kills_no_deaths') {
			whereConditions.push(eq(specPerformance.isKill, true));
		} else if (fightFilter === 'kills_all') {
			whereConditions.push(eq(specPerformance.isKill, true));
		} else if (fightFilter === 'all') {
			// No filter for all fights
		}

		const orderColumn = metric === 'hps' ? specPerformance.hps : specPerformance.dps;

		const query = database
			.select({
				id: specPerformance.id,
				player_name: specPerformance.playerName,
				dps: specPerformance.dps,
				hps: specPerformance.hps,
				damage_done: specPerformance.damageDone,
				healing_done: specPerformance.healingDone,
				report_code: specPerformance.reportCode,
				fight_id: specPerformance.fightId
			})
			.from(specPerformance)
			.where(and(...whereConditions))
			.orderBy(desc(orderColumn))
			.limit(5);

		const data = await query;

		const result = data.map((r) => ({
			player_name: r.player_name,
			value: metric === 'hps' ? (r.hps ?? 0) : (r.dps ?? 0),
			damage_done: r.damage_done ?? 0,
			healing_done: r.healing_done ?? 0,
			report_url: `https://www.warcraftlogs.com/reports/${r.report_code}#fight=${r.fight_id}`
		}));

		return json(result);
	} catch (error) {
		console.error('Error in /api/spec-top-players:', error);
		return json({ error: 'Failed to fetch top players' }, { status: 500 });
	}
};
