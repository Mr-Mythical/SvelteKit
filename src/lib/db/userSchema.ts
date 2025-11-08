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
	primaryKey
} from 'drizzle-orm/pg-core';

// =============================================================================
// AUTH.JS REQUIRED TABLES - PRODUCTION READY
// =============================================================================

// Users table - core Auth.js requirements
export const users = pgTable(
	'users',
	{
		id: text('id').notNull().primaryKey(),
		name: text('name'),
		email: text('email').notNull(),
		emailVerified: timestamp('emailVerified', { mode: 'date' }),
		image: text('image')
	},
	(table) => ({
		emailIdx: index('idx_users_email').on(table.email)
	})
);

// Accounts table - OAuth provider connections
export const accounts = pgTable(
	'accounts',
	{
		id: text('id')
			.notNull()
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		userId: text('userId')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		type: text('type').notNull(),
		provider: text('provider').notNull(),
		providerAccountId: text('providerAccountId').notNull(),
		refresh_token: text('refresh_token'),
		access_token: text('access_token'),
		expires_at: integer('expires_at'),
		token_type: text('token_type'),
		scope: text('scope'),
		id_token: text('id_token'),
		session_state: text('session_state')
	},
	(table) => ({
		userIdx: index('idx_accounts_user').on(table.userId),
		providerIdx: uniqueIndex('idx_accounts_provider').on(table.provider, table.providerAccountId)
	})
);

// Sessions table - user sessions
export const sessions = pgTable(
	'sessions',
	{
		sessionToken: text('sessionToken').notNull().primaryKey(),
		userId: text('userId')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		expires: timestamp('expires', { mode: 'date' }).notNull()
	},
	(table) => ({
		userIdx: index('idx_sessions_user').on(table.userId),
		expiresIdx: index('idx_sessions_expires').on(table.expires)
	})
);

// Verification tokens table - for email verification
export const verificationTokens = pgTable(
	'verificationToken',
	{
		identifier: text('identifier').notNull(),
		token: text('token').notNull(),
		expires: timestamp('expires', { mode: 'date' }).notNull()
	},
	(table) => ({
		compoundKey: primaryKey({ columns: [table.identifier, table.token] })
	})
);

// =============================================================================
// EXTENDED USER PROFILE DATA
// =============================================================================

// User profiles - Battle.net specific data and preferences
export const userProfiles = pgTable(
	'user_profiles',
	{
		id: text('id')
			.notNull()
			.primaryKey()
			.references(() => users.id, { onDelete: 'cascade' }),
		battletag: varchar('battletag', { length: 50 }),
		createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
		lastSeenAt: timestamp('last_seen_at', { mode: 'date' }).defaultNow().notNull(),
		isActive: boolean('is_active').default(true).notNull(),
		preferences: jsonb('preferences').default('{}').notNull(),
		// Battle.net OAuth tokens
		battlenetAccessToken: text('battlenet_access_token'),
		battlenetRefreshToken: text('battlenet_refresh_token'),
		battlenetExpiresAt: timestamp('battlenet_expires_at', { mode: 'date' })
	},
	(table) => ({
		battletagIdx: index('idx_profiles_battletag').on(table.battletag),
		activeIdx: index('idx_profiles_active').on(table.isActive),
		lastSeenIdx: index('idx_profiles_last_seen').on(table.lastSeenAt)
	})
);

// =============================================================================
// USER ACTIVITY TRACKING
// =============================================================================

// User recents - track recently viewed items per user
export const userRecents = pgTable(
	'user_recents',
	{
		id: serial('id').primaryKey(),
		userId: text('userId')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		type: text('type').notNull(), // 'character', 'report', 'guild', 'dungeon_run'
		entityId: text('entity_id').notNull(), // Character name, report code, etc.
		entityData: jsonb('entity_data').notNull(), // Full entity details for quick access
		title: text('title').notNull(), // Display title
		subtitle: text('subtitle'), // Additional context
		metadata: jsonb('metadata').default('{}').notNull(), // Extra data
		lastAccessedAt: timestamp('last_accessed_at', { mode: 'date' }).defaultNow().notNull(),
		createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull()
	},
	(table) => ({
		userIdx: index('idx_user_recents_user').on(table.userId),
		typeIdx: index('idx_user_recents_type').on(table.type),
		userTypeIdx: index('idx_user_recents_user_type').on(table.userId, table.type),
		lastAccessedIdx: index('idx_user_recents_last_accessed').on(table.lastAccessedAt),
		uniqueUserEntity: uniqueIndex('idx_user_recents_unique').on(
			table.userId,
			table.type,
			table.entityId
		)
	})
);
