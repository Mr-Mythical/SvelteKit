import { relations } from 'drizzle-orm/relations';
import {
	encounters,
	unifiedReports,
	damageAverages,
	damageData,
	healerCompositions,
	collectionProgress,
	progressValidation
} from './schema';

export const unifiedReportsRelations = relations(unifiedReports, ({ one, many }) => ({
	encounter: one(encounters, {
		fields: [unifiedReports.encounterId],
		references: [encounters.encounterId]
	}),
	damageData: many(damageData),
	healerCompositions: many(healerCompositions)
}));

export const encountersRelations = relations(encounters, ({ many }) => ({
	unifiedReports: many(unifiedReports),
	damageAverages: many(damageAverages),
	collectionProgresses: many(collectionProgress),
	progressValidations: many(progressValidation)
}));

export const damageAveragesRelations = relations(damageAverages, ({ one }) => ({
	encounter: one(encounters, {
		fields: [damageAverages.encounterId],
		references: [encounters.encounterId]
	})
}));

export const damageDataRelations = relations(damageData, ({ one }) => ({
	unifiedReport: one(unifiedReports, {
		fields: [damageData.reportId],
		references: [unifiedReports.id]
	})
}));

export const healerCompositionsRelations = relations(healerCompositions, ({ one }) => ({
	unifiedReport: one(unifiedReports, {
		fields: [healerCompositions.reportId],
		references: [unifiedReports.id]
	})
}));

export const collectionProgressRelations = relations(collectionProgress, ({ one }) => ({
	encounter: one(encounters, {
		fields: [collectionProgress.encounterId],
		references: [encounters.encounterId]
	})
}));

export const progressValidationRelations = relations(progressValidation, ({ one }) => ({
	encounter: one(encounters, {
		fields: [progressValidation.encounterId],
		references: [encounters.encounterId]
	})
}));
