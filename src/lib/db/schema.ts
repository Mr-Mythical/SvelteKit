import { pgTable, serial, integer, text, bigint, real, timestamp, jsonb, json, primaryKey, index, uniqueIndex } from 'drizzle-orm/pg-core';

// =============================================================================
// ENCOUNTERS TABLE
// =============================================================================
// Stores encounter information for different raid bosses
export const encounters = pgTable('encounters', {
	encounterId: integer('encounter_id').primaryKey(),
	encounterName: text('encounter_name').notNull(),
});

// =============================================================================
// UNIFIED_REPORTS TABLE
// =============================================================================
// Main table storing fight report data from WarcraftLogs API
// Combines ranking data with fight details
export const unifiedReports = pgTable('unified_reports', {
	id: serial('id').primaryKey(),
	reportCode: text('report_code').notNull(),
	fightId: integer('fight_id').notNull(),
	encounterId: integer('encounter_id').notNull().references(() => encounters.encounterId),
	region: text('region').notNull(),
	guildName: text('guild_name'),
	rankingStartTime: bigint('ranking_start_time', { mode: 'number' }),
	rankingDuration: integer('ranking_duration'),
	fightStartTime: integer('fight_start_time'),
	fightEndTime: integer('fight_end_time'),
	createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
	uniqueReport: uniqueIndex('idx_unified_reports_unique').on(table.reportCode, table.fightId, table.encounterId, table.region),
	encounterIdx: index('idx_unified_reports_encounter').on(table.encounterId),
	regionIdx: index('idx_unified_reports_region').on(table.region),
}));

// =============================================================================
// HEALER_COMPOSITIONS TABLE
// =============================================================================
// Stores healer specialization compositions for each fight report
// Uses JSON array to handle multiple healers of the same spec
export const healerCompositions = pgTable('healer_compositions', {
	id: serial('id').primaryKey(),
	reportId: integer('report_id').notNull().unique().references(() => unifiedReports.id, { onDelete: 'cascade' }),
	specIcons: json('spec_icons').$type<string[]>().notNull(), // JSON array of healer spec icons
	fightDuration: integer('fight_duration'), // Calculated fight duration in milliseconds
}, (table) => ({
	reportIdx: index('idx_healer_compositions_report').on(table.reportId),
}));

// =============================================================================
// DAMAGE_DATA TABLE
// =============================================================================
// Stores damage-over-time data points for analysis
export const damageData = pgTable('damage_data', {
	id: serial('id').primaryKey(),
	reportId: integer('report_id').notNull().references(() => unifiedReports.id, { onDelete: 'cascade' }),
	timestampMs: bigint('timestamp_ms', { mode: 'number' }).notNull(),
	damageValue: real('damage_value').notNull(),
}, (table) => ({
	reportIdx: index('idx_damage_data_report').on(table.reportId),
	uniqueReportTimestamp: uniqueIndex().on(table.reportId, table.timestampMs),
}));

// =============================================================================
// DAMAGE_AVERAGES TABLE
// =============================================================================
// Stores calculated damage averages and statistics per encounter
export const damageAverages = pgTable('damage_averages', {
	id: serial('id').primaryKey(),
	encounterId: integer('encounter_id').notNull().references(() => encounters.encounterId),
	timeSeconds: integer('time_seconds').notNull(),
	avgDamage: integer('avg_damage'),
	stdDev: integer('std_dev'),
	count: integer('count'),
	confidenceInterval: integer('confidence_interval'),
	createdAt: timestamp('created_at').defaultNow(),
});

// =============================================================================
// COLLECTION_PROGRESS TABLE
// =============================================================================
// Tracks data collection progress for each encounter/region combination
export const collectionProgress = pgTable('collection_progress', {
	encounterId: integer('encounter_id').notNull().references(() => encounters.encounterId),
	region: text('region').notNull(),
	collectionType: text('collection_type').notNull(), // 'rankings', 'healers', 'damage'
	lastPage: integer('last_page').default(0),
	reportsCollected: integer('reports_collected').default(0),
	lastUpdated: timestamp('last_updated').defaultNow(),
}, (table) => ({
	pk: primaryKey({ columns: [table.encounterId, table.region, table.collectionType] }),
}));

// =============================================================================
// APPLICATION_LOCKS TABLE
// =============================================================================
// Prevents concurrent execution of data collection processes
export const applicationLocks = pgTable('application_locks', {
	lockName: text('lock_name').primaryKey(),
	lockedBy: text('locked_by').notNull(),
	lockedAt: timestamp('locked_at').defaultNow(),
	expiresAt: timestamp('expires_at').notNull(),
	processInfo: jsonb('process_info'), // Additional process information
});

// =============================================================================
// PROGRESS_VALIDATION TABLE
// =============================================================================
// Tracks validation of collection progress and detects inconsistencies
export const progressValidation = pgTable('progress_validation', {
	encounterId: integer('encounter_id').notNull().references(() => encounters.encounterId),
	region: text('region').notNull(),
	collectionType: text('collection_type').notNull(),
	expectedReports: integer('expected_reports').default(0),
	actualReports: integer('actual_reports').default(0),
	lastValidated: timestamp('last_validated').defaultNow(),
	inconsistenciesDetected: integer('inconsistencies_detected').default(0),
}, (table) => ({
	pk: primaryKey({ columns: [table.encounterId, table.region, table.collectionType] }),
}));