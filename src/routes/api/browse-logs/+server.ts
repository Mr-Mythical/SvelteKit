import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { healerCompositions, unifiedReports, encounters } from '$lib/db/schema';
import { eq, gte, lte, desc, and, sql } from 'drizzle-orm';
import type { BrowseLogsParams, BrowsedLog, BrowseLogsResponse } from '$lib/types/apiTypes';
import { bosses as bossList } from '$lib/types/bossData';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const params: BrowseLogsParams = await request.json();

		// Build the where conditions
		let whereConditions = [];

		if (params.bossId) {
			whereConditions.push(eq(unifiedReports.encounterId, params.bossId));
		}
		if (params.minDuration) {
			whereConditions.push(gte(healerCompositions.fightDuration, params.minDuration));
		}
		if (params.maxDuration) {
			whereConditions.push(lte(healerCompositions.fightDuration, params.maxDuration));
		}

		// Query healer compositions with joined data
		let query = db()
			.select({
				reportCode: unifiedReports.reportCode,
				fightId: unifiedReports.fightId,
				encounterId: unifiedReports.encounterId,
				encounterName: encounters.encounterName,
				guildName: unifiedReports.guildName,
				rankingStartTime: unifiedReports.rankingStartTime,
				fightDuration: healerCompositions.fightDuration,
				specIcons: healerCompositions.specIcons,
			})
			.from(healerCompositions)
			.innerJoin(unifiedReports, eq(healerCompositions.reportId, unifiedReports.id))
			.innerJoin(encounters, eq(unifiedReports.encounterId, encounters.encounterId))
			.where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
			.orderBy(desc(unifiedReports.rankingStartTime));

		const compositionsData = await query;

		// Transform data to match expected format
		let filteredLogsData = compositionsData.map((row) => ({
			report_code: row.reportCode,
			fight_id: row.fightId,
			encounter_id: row.encounterId,
			encounter_name: row.encounterName,
			guild_name: row.guildName,
			report_absolute_start_time_ms: row.rankingStartTime,
			duration_ms: row.fightDuration,
			healer_specs: row.specIcons as string[],
		}));

		// Filter by healer specs if specified
		if (params.healerSpecs && params.healerSpecs.length > 0) {
			filteredLogsData = filteredLogsData.filter((comp) => {
				const actualSpecsInLog = comp.healer_specs;
				return params.healerSpecs!.every((requiredSpec) => actualSpecsInLog.includes(requiredSpec));
			});
		}

		const totalFilteredCount = filteredLogsData.length;

		const page = params.page || 1;
		const limit = params.limit || 10;
		const offset = (page - 1) * limit;
		const paginatedLogsData = filteredLogsData.slice(offset, offset + limit);

		const browsedLogsResult: BrowsedLog[] = paginatedLogsData.map((log) => {
			const bossData = log.encounter_id ? bossList.find((b) => b.id === log.encounter_id) : null;
			const durationInSeconds = log.duration_ms ? Math.floor(log.duration_ms / 1000) : 0;

			return {
				log_code: log.report_code,
				title: log.encounter_name || log.guild_name || `Report: ${log.report_code}`,
				boss_name: bossData ? bossData.name : log.encounter_name || 'Unknown Boss',
				duration_seconds: durationInSeconds,
				healer_composition: log.healer_specs,
				log_url: `https://www.warcraftlogs.com/reports/${log.report_code}#fight=${log.fight_id}`,
				fight_id: log.fight_id,
				start_time: log.report_absolute_start_time_ms || 0,
				end_time: (log.report_absolute_start_time_ms || 0) + (log.duration_ms || 0)
			};
		});

		const responsePayload: BrowseLogsResponse = {
			logs: browsedLogsResult,
			total: totalFilteredCount,
			page,
			limit
		};

		return json(responsePayload);
	} catch (error: any) {
		console.error('Error in /api/browse-logs:', error.message, error.stack);
		const errorResponse: { error: string } = { error: error.message || 'Internal Server Error.' };
		return json(errorResponse, { status: 500 });
	}
};
