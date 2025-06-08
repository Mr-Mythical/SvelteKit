import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createClient } from '@supabase/supabase-js';
import type { BrowseLogsParams, BrowsedLog, BrowseLogsResponse } from '$lib/types/apiTypes';
import { bosses as bossList } from '$lib/types/bossData';

const supabaseUrl = env.SUPABASE_HEALER_URL;
const supabaseKey = env.SUPABASE_HEALER_KEY;

if (!supabaseUrl) {
	throw new Error('SUPABASE_HEALER_URL is not defined in environment variables.');
}
if (!supabaseKey) {
	throw new Error('SUPABASE_HEALER_KEY is not defined in environment variables.');
}
const supabase = createClient(supabaseUrl, supabaseKey);

export const POST: RequestHandler = async ({ request }) => {
	try {
		const params: BrowseLogsParams = await request.json();

		type HealerCompositionWithSpecs = {
			report_code: string;
			fight_id: number;
			encounter_id: number | null;
			encounter_name: string | null;
			guild_name: string | null;
			report_absolute_start_time_ms: number | null;
			duration_ms: number | null;
			healer_specs: Array<{ spec_icon: string }>;
		};

		let compositionsQuery = supabase
			.from('healer_compositions')
			.select('*, healer_specs(spec_icon)');

		if (params.bossId) {
			compositionsQuery = compositionsQuery.eq('encounter_id', params.bossId);
		}
		if (params.minDuration) {
			compositionsQuery = compositionsQuery.gte('duration_ms', params.minDuration * 1000);
		}
		if (params.maxDuration) {
			compositionsQuery = compositionsQuery.lte('duration_ms', params.maxDuration * 1000);
		}

		compositionsQuery = compositionsQuery.order('report_absolute_start_time_ms', {
			ascending: false
		});

		const { data: fetchedCompositions, error: compositionsError } = await compositionsQuery;

		if (compositionsError) {
			console.error('Supabase error fetching compositions:', compositionsError);
			throw new Error(compositionsError.message);
		}

		let filteredLogsData: HealerCompositionWithSpecs[] = fetchedCompositions || [];

		if (params.healerSpecs && params.healerSpecs.length > 0) {
			filteredLogsData = filteredLogsData.filter((comp) => {
				const actualSpecsInLog = comp.healer_specs.map((s) => s.spec_icon);
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
				healer_composition: log.healer_specs.map((s) => s.spec_icon),
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
