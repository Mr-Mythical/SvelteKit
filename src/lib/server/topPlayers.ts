import { getRaidDb } from '$lib/db';
import { specPerformance } from '$lib/db/schema';
import { eq, desc, and, type SQL } from 'drizzle-orm';

export const HEALER_SPECS = [
	'Restoration',
	'Holy',
	'Mistweaver',
	'Discipline',
	'Preservation'
] as const;
export const TANK_SPECS = ['Blood', 'Protection', 'Brewmaster', 'Guardian', 'Vengeance'] as const;

export type Role = 'dps' | 'tank' | 'healer';
export type Metric = 'dps' | 'hps';
export type FightFilter = 'kills_wipes' | 'kills_no_deaths' | 'kills_all' | null;

export interface TopPlayersQuery {
	encounterId: number;
	difficulty: number | null;
	fightFilter: FightFilter;
	role: Role;
	metric: Metric;
}

export interface TopPlayerRow {
	id: number;
	player_name: string | null;
	spec_icon: string;
	dps: number;
	hps: number;
	damage_done: number;
	healing_done: number;
	report_url: string;
	is_kill: boolean | null;
	death_count: number | null;
}

function buildWhere(query: TopPlayersQuery): SQL[] {
	const conditions: SQL[] = [eq(specPerformance.encounterId, query.encounterId)];

	if (query.difficulty !== null) {
		conditions.push(eq(specPerformance.difficulty, query.difficulty));
	}

	switch (query.fightFilter) {
		case 'kills_wipes':
			conditions.push(eq(specPerformance.isKill, false));
			break;
		case 'kills_no_deaths': {
			const kill = and(eq(specPerformance.isKill, true), eq(specPerformance.deathCount, 0));
			if (kill) conditions.push(kill);
			break;
		}
		case 'kills_all':
			conditions.push(eq(specPerformance.isKill, true));
			break;
		case null:
			break;
	}

	return conditions;
}

function specsForRole(role: Role): readonly string[] {
	switch (role) {
		case 'healer':
			return HEALER_SPECS;
		case 'tank':
			return TANK_SPECS;
		case 'dps':
			return [];
	}
}

export async function getTopPlayers(query: TopPlayersQuery): Promise<TopPlayerRow[]> {
	const database = getRaidDb();
	const orderByColumn = query.metric === 'hps' ? specPerformance.hps : specPerformance.dps;

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
		.where(and(...buildWhere(query)))
		.orderBy(desc(orderByColumn));

	// DPS leaderboard is high-volume; cap at 2000 rows for the dedup pass.
	// Tank/healer pools are small enough that we can scan the full set.
	const results = query.role === 'dps' ? await baseQuery.limit(2000) : await baseQuery;

	// Deduplicate by player_name + spec_icon, keeping the best performance for each unique player.
	type Row = (typeof results)[number];
	const playerMap = new Map<string, Row>();
	const metricKey = query.metric === 'hps' ? 'hps' : 'dps';

	for (const row of results) {
		const key = `${row.player_name}-${row.spec_icon}`;
		const existing = playerMap.get(key);
		if (!existing || (row[metricKey] ?? 0) > (existing[metricKey] ?? 0)) {
			playerMap.set(key, row);
		}
	}

	const deduped = Array.from(playerMap.values());
	const roleSpecs = specsForRole(query.role);

	const filtered =
		query.role === 'dps'
			? deduped.filter((r) => {
					const specName = r.spec_icon.split('-')[1];
					return (
						specName !== undefined &&
						!HEALER_SPECS.some((s) => specName.toLowerCase() === s.toLowerCase()) &&
						!TANK_SPECS.some((s) => specName.toLowerCase() === s.toLowerCase())
					);
				})
			: deduped.filter((r) => {
					const specName = r.spec_icon.split('-')[1];
					return (
						specName !== undefined &&
						roleSpecs.some((s) => specName.toLowerCase() === s.toLowerCase())
					);
				});

	return filtered.slice(0, 50).map((r) => ({
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
}
