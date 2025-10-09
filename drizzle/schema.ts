import { pgTable, index, uniqueIndex, foreignKey, serial, text, integer, bigint, timestamp, real, jsonb, unique, json, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const unifiedReports = pgTable("unified_reports", {
	id: serial().primaryKey().notNull(),
	reportCode: text("report_code").notNull(),
	fightId: integer("fight_id").notNull(),
	encounterId: integer("encounter_id").notNull(),
	region: text().notNull(),
	guildName: text("guild_name"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	rankingStartTime: bigint("ranking_start_time", { mode: "number" }),
	rankingDuration: integer("ranking_duration"),
	fightStartTime: integer("fight_start_time"),
	fightEndTime: integer("fight_end_time"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_unified_reports_encounter").using("btree", table.encounterId.asc().nullsLast().op("int4_ops")),
	index("idx_unified_reports_region").using("btree", table.region.asc().nullsLast().op("text_ops")),
	uniqueIndex("idx_unified_reports_unique").using("btree", table.reportCode.asc().nullsLast().op("int4_ops"), table.fightId.asc().nullsLast().op("text_ops"), table.encounterId.asc().nullsLast().op("int4_ops"), table.region.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.encounterId],
			foreignColumns: [encounters.encounterId],
			name: "unified_reports_encounter_id_encounters_encounter_id_fk"
		}),
]);

export const encounters = pgTable("encounters", {
	encounterId: integer("encounter_id").primaryKey().notNull(),
	encounterName: text("encounter_name").notNull(),
});

export const damageAverages = pgTable("damage_averages", {
	id: serial().primaryKey().notNull(),
	encounterId: integer("encounter_id").notNull(),
	timeSeconds: integer("time_seconds").notNull(),
	avgDamage: integer("avg_damage"),
	stdDev: integer("std_dev"),
	count: integer(),
	confidenceInterval: integer("confidence_interval"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.encounterId],
			foreignColumns: [encounters.encounterId],
			name: "damage_averages_encounter_id_encounters_encounter_id_fk"
		}),
]);

export const damageData = pgTable("damage_data", {
	id: serial().primaryKey().notNull(),
	reportId: integer("report_id").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	timestampMs: bigint("timestamp_ms", { mode: "number" }).notNull(),
	damageValue: real("damage_value").notNull(),
}, (table) => [
	uniqueIndex().using("btree", table.reportId.asc().nullsLast().op("int4_ops"), table.timestampMs.asc().nullsLast().op("int4_ops")),
	index("idx_damage_data_report").using("btree", table.reportId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.reportId],
			foreignColumns: [unifiedReports.id],
			name: "damage_data_report_id_unified_reports_id_fk"
		}).onDelete("cascade"),
]);

export const applicationLocks = pgTable("application_locks", {
	lockName: text("lock_name").primaryKey().notNull(),
	lockedBy: text("locked_by").notNull(),
	lockedAt: timestamp("locked_at", { mode: 'string' }).defaultNow(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	processInfo: jsonb("process_info"),
});

export const healerCompositions = pgTable("healer_compositions", {
	id: serial().primaryKey().notNull(),
	reportId: integer("report_id").notNull(),
	specIcons: json("spec_icons").notNull(),
	fightDuration: integer("fight_duration"),
}, (table) => [
	index("idx_healer_compositions_report").using("btree", table.reportId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.reportId],
			foreignColumns: [unifiedReports.id],
			name: "healer_compositions_report_id_unified_reports_id_fk"
		}).onDelete("cascade"),
	unique("healer_compositions_report_id_unique").on(table.reportId),
]);

export const collectionProgress = pgTable("collection_progress", {
	encounterId: integer("encounter_id").notNull(),
	region: text().notNull(),
	collectionType: text("collection_type").notNull(),
	lastPage: integer("last_page").default(0),
	reportsCollected: integer("reports_collected").default(0),
	lastUpdated: timestamp("last_updated", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.encounterId],
			foreignColumns: [encounters.encounterId],
			name: "collection_progress_encounter_id_encounters_encounter_id_fk"
		}),
	primaryKey({ columns: [table.encounterId, table.region, table.collectionType], name: "collection_progress_encounter_id_region_collection_type_pk"}),
]);

export const progressValidation = pgTable("progress_validation", {
	encounterId: integer("encounter_id").notNull(),
	region: text().notNull(),
	collectionType: text("collection_type").notNull(),
	expectedReports: integer("expected_reports").default(0),
	actualReports: integer("actual_reports").default(0),
	lastValidated: timestamp("last_validated", { mode: 'string' }).defaultNow(),
	inconsistenciesDetected: integer("inconsistencies_detected").default(0),
}, (table) => [
	foreignKey({
			columns: [table.encounterId],
			foreignColumns: [encounters.encounterId],
			name: "progress_validation_encounter_id_encounters_encounter_id_fk"
		}),
	primaryKey({ columns: [table.encounterId, table.region, table.collectionType], name: "progress_validation_encounter_id_region_collection_type_pk"}),
]);
