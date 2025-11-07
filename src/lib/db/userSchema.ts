import {
	pgTable,
	serial,
	integer,
	text,
	timestamp,
	jsonb,
	index,
	uniqueIndex,
	boolean,
	varchar,
	uuid
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
		emailVerified: timestamp('emailVerified'), // Auth.js expects this column
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

// Auth.js accounts table - matches exact Auth.js expectations
export const accounts = pgTable(
	'accounts',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: text('userId')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		type: text('type').notNull(), // oauth, email, etc.
		provider: text('provider').notNull(), // battlenet, etc.
		providerAccountId: text('providerAccountId').notNull(),
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

// Auth.js sessions table - matches exact Auth.js expectations
export const sessions = pgTable(
	'sessions',
	{
		id: uuid('id').defaultRandom().primaryKey(),
		userId: text('userId')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		expires: timestamp('expires').notNull(),
		sessionToken: text('sessionToken').notNull(),
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
		userId: text('userId')
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
