/**
 * Drizzle schema for **raid analytics** tables on the unified Postgres database.
 *
 * All app data (raid aggregates + user/auth) lives in one database behind
 * `DATABASE_USER_URL`. Domain modules stay split for clarity:
 *
 * - This file → raid aggregates (read-mostly; written by WebsiteDataCollection).
 * - `userSchema.ts` → Auth.js accounts/sessions, profiles, recents, characters.
 *
 * Connection factories: `getRaidDb()` / `getUserDb()` both use `DATABASE_USER_URL`
 * (see `connection.ts`). Soft refs (e.g. report codes in `user_recents`) are
 * joined in app code — there are no cross-domain FKs.
 */
import {
	pgTable,
	serial,
	integer,
	text,
	bigint,
	real,
	timestamp,
	index,
	uniqueIndex,
	boolean,
	jsonb
} from 'drizzle-orm/pg-core';

// =============================================================================
// ENCOUNTERS TABLE
// =============================================================================
export const encounters = pgTable('encounters', {
	encounterId: integer('encounter_id').primaryKey(),
	encounterName: text('encounter_name').notNull()
});

// =============================================================================
// HEALER_COMPOSITIONS TABLE
// =============================================================================
// Denormalised per-fight healer specs (live cloud schema from the collector).
export const healerCompositions = pgTable(
	'healer_compositions',
	{
		id: serial('id').primaryKey(),
		reportCode: text('report_code').notNull(),
		fightId: integer('fight_id').notNull(),
		encounterId: integer('encounter_id')
			.notNull()
			.references(() => encounters.encounterId),
		region: text('region').notNull(),
		specIcons: jsonb('spec_icons').$type<string[]>().notNull(),
		fightDuration: integer('fight_duration'),
		lastUpdated: timestamp('last_updated').defaultNow()
	},
	(table) => ({
		uniqueFight: uniqueIndex('healer_compositions_report_code_fight_id_encounter_id_regio_key').on(
			table.reportCode,
			table.fightId,
			table.encounterId,
			table.region
		),
		encounterIdx: index('idx_healer_comp_encounter').on(table.encounterId)
	})
);

// =============================================================================
// DEATH_HOTSPOTS TABLE
// =============================================================================
export const deathHotspots = pgTable(
	'death_hotspots',
	{
		id: serial('id').primaryKey(),
		encounterId: integer('encounter_id')
			.notNull()
			.references(() => encounters.encounterId),
		timeSeconds: integer('time_seconds').notNull(),
		deathCount: integer('death_count').notNull(),
		sampleCount: integer('sample_count').notNull(),
		difficulty: integer('difficulty').notNull().default(5),
		lastUpdated: timestamp('last_updated').defaultNow()
	},
	(table) => ({
		encounterIdx: index('idx_death_hotspots_encounter').on(table.encounterId, table.difficulty),
		encounterDiffTime: uniqueIndex('death_hotspots_encounter_diff_time_uidx').on(
			table.encounterId,
			table.difficulty,
			table.timeSeconds
		)
	})
);

// =============================================================================
// DEATH_RATE TABLE
// =============================================================================
// Optional app-read table (not populated by the current collector).
export const deathRate = pgTable(
	'death_rate',
	{
		id: serial('id').primaryKey(),
		encounterId: integer('encounter_id')
			.notNull()
			.references(() => encounters.encounterId),
		timeSeconds: integer('time_seconds').notNull(),
		deathCount: integer('death_count').notNull(),
		sampleCount: integer('sample_count').notNull()
	},
	(table) => ({
		encounterIdx: index('idx_death_rate_encounter').on(table.encounterId)
	})
);

// =============================================================================
// DAMAGE_AVERAGES TABLE
// =============================================================================
export const damageAverages = pgTable(
	'damage_averages',
	{
		id: serial('id').primaryKey(),
		encounterId: integer('encounter_id')
			.notNull()
			.references(() => encounters.encounterId),
		difficulty: integer('difficulty').notNull().default(5),
		timeSeconds: integer('time_seconds').notNull(),
		avgDamage: integer('avg_damage'),
		stdDev: integer('std_dev'),
		sampleCount: integer('sample_count'),
		confidenceInterval: integer('confidence_interval'),
		lastUpdated: timestamp('last_updated').defaultNow()
	},
	(table) => ({
		encounterIdx: index('idx_damage_averages_encounter').on(table.encounterId, table.difficulty),
		encounterDiffTime: uniqueIndex('damage_averages_encounter_diff_time_uidx').on(
			table.encounterId,
			table.difficulty,
			table.timeSeconds
		)
	})
);

// =============================================================================
// SPEC_PERFORMANCE TABLE
// =============================================================================
// Optional app-read table (local SQLite in the collector; cloud may be empty).
export const specPerformance = pgTable(
	'spec_performance',
	{
		id: serial('id').primaryKey(),
		reportCode: text('report_code').notNull(),
		fightId: integer('fight_id').notNull(),
		encounterId: integer('encounter_id')
			.notNull()
			.references(() => encounters.encounterId),
		region: text('region').notNull(),
		specIcon: text('spec_icon').notNull(),
		playerName: text('player_name'),
		damageDone: bigint('damage_done', { mode: 'number' }).default(0),
		healingDone: bigint('healing_done', { mode: 'number' }).default(0),
		dps: integer('dps').default(0),
		hps: integer('hps').default(0),
		fightDuration: integer('fight_duration'),
		fightStartTime: integer('fight_start_time'),
		fightEndTime: integer('fight_end_time'),
		difficulty: integer('difficulty'),
		isKill: boolean('is_kill').default(false),
		deathCount: integer('death_count').default(0),
		deathTime: integer('death_time'),
		timeDeadMs: integer('time_dead_ms').default(0),
		timeAlivePercentage: real('time_alive_percentage').default(100),
		createdAt: timestamp('created_at').defaultNow()
	},
	(table) => ({
		uniquePerformance: uniqueIndex('idx_spec_performance_unique').on(
			table.reportCode,
			table.fightId,
			table.encounterId,
			table.region,
			table.playerName
		),
		encounterIdx: index('idx_spec_performance_encounter').on(table.encounterId),
		specIdx: index('idx_spec_performance_spec').on(table.specIcon)
	})
);

// =============================================================================
// SPEC_STATISTICS TABLE
// =============================================================================
export const specStatistics = pgTable(
	'spec_statistics',
	{
		id: serial('id').primaryKey(),
		encounterId: integer('encounter_id')
			.notNull()
			.references(() => encounters.encounterId),
		region: text('region').notNull(),
		specIcon: text('spec_icon').notNull(),
		difficulty: integer('difficulty'),
		killsOnly: boolean('kills_only').default(false),
		deathFilter: text('death_filter').default('all'),
		avgDamageDone: bigint('avg_damage_done', { mode: 'number' }),
		avgHealingDone: bigint('avg_healing_done', { mode: 'number' }),
		avgDps: integer('avg_dps'),
		avgHps: integer('avg_hps'),
		maxDamageDone: bigint('max_damage_done', { mode: 'number' }),
		maxHealingDone: bigint('max_healing_done', { mode: 'number' }),
		maxDps: integer('max_dps'),
		maxHps: integer('max_hps'),
		minDamageDone: bigint('min_damage_done', { mode: 'number' }),
		minHealingDone: bigint('min_healing_done', { mode: 'number' }),
		minDps: integer('min_dps'),
		minHps: integer('min_hps'),
		avgDeathTime: integer('avg_death_time'),
		deathRate: real('death_rate').default(0.0),
		sampleCount: integer('sample_count'),
		lastUpdated: timestamp('last_updated').defaultNow()
	},
	(table) => ({
		uniqueStatistic: uniqueIndex(
			'spec_statistics_encounter_id_region_spec_icon_difficulty_ki_key'
		).on(
			table.encounterId,
			table.region,
			table.specIcon,
			table.difficulty,
			table.killsOnly,
			table.deathFilter
		),
		encounterRegionSpecIdx: index('idx_spec_statistics_encounter').on(
			table.encounterId,
			table.region,
			table.specIcon
		)
	})
);
