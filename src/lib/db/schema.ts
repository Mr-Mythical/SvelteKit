import {
	pgTable,
	serial,
	integer,
	text,
	bigint,
	real,
	timestamp,
	jsonb,
	json,
	primaryKey,
	index,
	uniqueIndex,
	boolean,
	varchar
} from 'drizzle-orm/pg-core';

// =============================================================================
// USER MANAGEMENT TABLES
// =============================================================================

// Users table for authentication and profile management
export const users = pgTable(
	'users',
	{
		id: text('id').primaryKey(), // Auth.js user ID (Battle.net sub)
		battletag: varchar('battletag', { length: 50 }).notNull(),
		email: text('email'), // May be null for Battle.net users
		name: text('name'), // Display name
		image: text('image'), // Avatar URL
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
		lastSeenAt: timestamp('last_seen_at').defaultNow().notNull(),
		isActive: boolean('is_active').default(true).notNull(),
		preferences: jsonb('preferences').default('{}'), // User settings/preferences
		// Battle.net specific data
		battlenetAccessToken: text('battlenet_access_token'),
		battlenetRefreshToken: text('battlenet_refresh_token'),
		battlenetExpiresAt: timestamp('battlenet_expires_at')
	},
	(table) => ({
		battletagIdx: index('idx_users_battletag').on(table.battletag),
		emailIdx: index('idx_users_email').on(table.email),
		activeIdx: index('idx_users_active').on(table.isActive),
		lastSeenIdx: index('idx_users_last_seen').on(table.lastSeenAt)
	})
);

// Sessions table for Auth.js session management
export const accounts = pgTable(
	'accounts',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		type: text('type').notNull(), // oauth, email, etc.
		provider: text('provider').notNull(), // battlenet, etc.
		providerAccountId: text('provider_account_id').notNull(),
		refresh_token: text('refresh_token'),
		access_token: text('access_token'),
		expires_at: integer('expires_at'),
		token_type: text('token_type'),
		scope: text('scope'),
		id_token: text('id_token'),
		session_state: text('session_state'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => ({
		userIdx: index('idx_accounts_user').on(table.userId),
		providerIdx: index('idx_accounts_provider').on(table.provider, table.providerAccountId)
	})
);

// Sessions table for active user sessions
export const sessions = pgTable(
	'sessions',
	{
		id: text('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		expires: timestamp('expires').notNull(),
		sessionToken: text('session_token').notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => ({
		userIdx: index('idx_sessions_user').on(table.userId),
		tokenIdx: uniqueIndex('idx_sessions_token').on(table.sessionToken),
		expiresIdx: index('idx_sessions_expires').on(table.expires)
	})
);

// =============================================================================
// RECENTS TABLES
// =============================================================================

// Recent reports/characters viewed by users
export const userRecents = pgTable(
	'user_recents',
	{
		id: serial('id').primaryKey(),
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		type: text('type').notNull(), // 'character', 'report', 'guild', 'dungeon_run'
		// Flexible data storage for different types of recents
		entityId: text('entity_id').notNull(), // Character name, report code, guild name, etc.
		entityData: jsonb('entity_data').notNull(), // Full entity details for quick access
		// Additional metadata
		title: text('title').notNull(), // Display title for the recent item
		subtitle: text('subtitle'), // Additional context (server, guild, etc.)
		metadata: jsonb('metadata').default('{}'), // Additional flexible data
		// Timestamps
		lastAccessedAt: timestamp('last_accessed_at').defaultNow().notNull(),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(table) => ({
		userIdx: index('idx_user_recents_user').on(table.userId),
		typeIdx: index('idx_user_recents_type').on(table.type),
		userTypeIdx: index('idx_user_recents_user_type').on(table.userId, table.type),
		lastAccessedIdx: index('idx_user_recents_last_accessed').on(table.lastAccessedAt),
		// Unique constraint to prevent duplicate recents per user
		uniqueUserEntity: uniqueIndex('idx_user_recents_unique').on(
			table.userId,
			table.type,
			table.entityId
		)
	})
);

// =============================================================================
// ENCOUNTERS TABLE
// =============================================================================
// Stores encounter information for different raid bosses
export const encounters = pgTable('encounters', {
	encounterId: integer('encounter_id').primaryKey(),
	encounterName: text('encounter_name').notNull()
});

// =============================================================================
// UNIFIED_REPORTS TABLE
// =============================================================================
// Main table storing fight report data from WarcraftLogs API
// Combines ranking data with fight details
export const unifiedReports = pgTable(
	'unified_reports',
	{
		id: serial('id').primaryKey(),
		reportCode: text('report_code').notNull(),
		fightId: integer('fight_id').notNull(),
		encounterId: integer('encounter_id')
			.notNull()
			.references(() => encounters.encounterId),
		region: text('region').notNull(),
		guildName: text('guild_name'),
		rankingStartTime: bigint('ranking_start_time', { mode: 'number' }),
		rankingDuration: integer('ranking_duration'),
		fightStartTime: integer('fight_start_time'),
		fightEndTime: integer('fight_end_time'),
		createdAt: timestamp('created_at').defaultNow()
	},
	(table) => ({
		uniqueReport: uniqueIndex('idx_unified_reports_unique').on(
			table.reportCode,
			table.fightId,
			table.encounterId,
			table.region
		),
		encounterIdx: index('idx_unified_reports_encounter').on(table.encounterId),
		regionIdx: index('idx_unified_reports_region').on(table.region)
	})
);

// =============================================================================
// HEALER_COMPOSITIONS TABLE
// =============================================================================
// Stores healer specialization compositions for each fight report
// Uses JSON array to handle multiple healers of the same spec
export const healerCompositions = pgTable(
	'healer_compositions',
	{
		id: serial('id').primaryKey(),
		reportId: integer('report_id')
			.notNull()
			.unique()
			.references(() => unifiedReports.id, { onDelete: 'cascade' }),
		specIcons: json('spec_icons').$type<string[]>().notNull(), // JSON array of healer spec icons
		fightDuration: integer('fight_duration') // Calculated fight duration in milliseconds
	},
	(table) => ({
		reportIdx: index('idx_healer_compositions_report').on(table.reportId)
	})
);

// =============================================================================
// DAMAGE_DATA TABLE
// =============================================================================
// Stores damage-over-time data points for analysis
export const damageData = pgTable(
	'damage_data',
	{
		id: serial('id').primaryKey(),
		reportId: integer('report_id')
			.notNull()
			.references(() => unifiedReports.id, { onDelete: 'cascade' }),
		timestampMs: bigint('timestamp_ms', { mode: 'number' }).notNull(),
		damageValue: real('damage_value').notNull()
	},
	(table) => ({
		reportIdx: index('idx_damage_data_report').on(table.reportId),
		uniqueReportTimestamp: uniqueIndex().on(table.reportId, table.timestampMs)
	})
);

// =============================================================================
// DAMAGE_AVERAGES TABLE
// =============================================================================
// Stores calculated damage averages and statistics per encounter
export const damageAverages = pgTable('damage_averages', {
	id: serial('id').primaryKey(),
	encounterId: integer('encounter_id')
		.notNull()
		.references(() => encounters.encounterId),
	timeSeconds: integer('time_seconds').notNull(),
	avgDamage: integer('avg_damage'),
	stdDev: integer('std_dev'),
	count: integer('count'),
	confidenceInterval: integer('confidence_interval'),
	createdAt: timestamp('created_at').defaultNow()
});

// =============================================================================
// COLLECTION_PROGRESS TABLE
// =============================================================================
// Tracks data collection progress for each encounter/region combination
export const collectionProgress = pgTable(
	'collection_progress',
	{
		encounterId: integer('encounter_id')
			.notNull()
			.references(() => encounters.encounterId),
		region: text('region').notNull(),
		collectionType: text('collection_type').notNull(), // 'rankings', 'healers', 'damage'
		lastPage: integer('last_page').default(0),
		reportsCollected: integer('reports_collected').default(0),
		lastUpdated: timestamp('last_updated').defaultNow()
	},
	(table) => ({
		pk: primaryKey({ columns: [table.encounterId, table.region, table.collectionType] })
	})
);

// =============================================================================
// APPLICATION_LOCKS TABLE
// =============================================================================
// Prevents concurrent execution of data collection processes
export const applicationLocks = pgTable('application_locks', {
	lockName: text('lock_name').primaryKey(),
	lockedBy: text('locked_by').notNull(),
	lockedAt: timestamp('locked_at').defaultNow(),
	expiresAt: timestamp('expires_at').notNull(),
	processInfo: jsonb('process_info') // Additional process information
});

// =============================================================================
// PROGRESS_VALIDATION TABLE
// =============================================================================
// Tracks validation of collection progress and detects inconsistencies
export const progressValidation = pgTable(
	'progress_validation',
	{
		encounterId: integer('encounter_id')
			.notNull()
			.references(() => encounters.encounterId),
		region: text('region').notNull(),
		collectionType: text('collection_type').notNull(),
		expectedReports: integer('expected_reports').default(0),
		actualReports: integer('actual_reports').default(0),
		lastValidated: timestamp('last_validated').defaultNow(),
		inconsistenciesDetected: integer('inconsistencies_detected').default(0)
	},
	(table) => ({
		pk: primaryKey({ columns: [table.encounterId, table.region, table.collectionType] })
	})
);

// =============================================================================
// SPEC_PERFORMANCE TABLE
// =============================================================================
// Stores individual spec performance data from beta/PTR raid tests
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
// Stores aggregated spec performance statistics
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
		uniqueStatistic: uniqueIndex('idx_spec_statistics_unique').on(
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
