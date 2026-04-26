import type { RequestHandler } from './$types';
import type { CastEvent } from '$lib/types/apiTypes';
import {
	buildAbilityMetadata,
	enrichAbilityEvent,
	isExcludedBossAbilityEvent,
	type WarcraftLogsAbility
} from '$lib/ui/abilityMetadata';
import { apiError, apiOk } from '$lib/server/apiResponses';
import { executeWclQuery, parseFightRequestBody, WclQueryError } from '$lib/server/wclGraphQL';
import { logServerError } from '$lib/server/logger';

const QUERY = `
	query ResourcesBySource($code: String!, $fightID: Int!, $start: Float!, $end: Float!) {
		reportData {
			report(code: $code) {
				events(
					dataType: Casts,
					fightIDs: [$fightID],
					startTime: $start,
					endTime: $end,
					hostilityType: Enemies
				) {
					data
					nextPageTimestamp
				}
				masterData {
					abilities {
						gameID
						name
						icon
					}
				}
			}
		}
	}
`;

interface BossEventsData {
	reportData: {
		report: {
			events: { data: Array<{ type: string } & Record<string, unknown>> } | null;
			masterData: { abilities: WarcraftLogsAbility[] } | null;
		} | null;
	};
}

/**
 * POST /api/boss-events
 *
 * Returns enemy cast events (boss abilities) for a single fight, enriched with
 * ability name + icon metadata pulled from the report's master data.
 *
 * Body: `{ fightID, code, startTime, endTime }` — see {@link parseFightRequestBody}.
 *
 * Returns:
 * - 200 `{ events, abilities }`
 * - 400 if the body is malformed.
 * - 502 if the WarcraftLogs GraphQL call fails (network or schema error).
 *
 * @throws Never — {@link WclQueryError} is caught and translated to a 502.
 */
export const POST: RequestHandler = async ({ request }) => {
	const body = parseFightRequestBody(await request.json().catch(() => null));
	if (!body) return apiError('Invalid or missing fight ID and/or report code.', 400);

	try {
		const data = await executeWclQuery<BossEventsData>(QUERY, {
			code: body.code,
			fightID: body.fightID,
			start: body.startTime,
			end: body.endTime
		});

		const report = data.reportData?.report;
		const abilityMetadata = buildAbilityMetadata(report?.masterData?.abilities ?? []);
		const castEvents: CastEvent[] = (report?.events?.data ?? [])
			.filter((event) => event.type === 'cast')
			.map((event) => enrichAbilityEvent(event as unknown as CastEvent, abilityMetadata))
			.filter((event) => !isExcludedBossAbilityEvent(event));
		const abilities = Array.from(abilityMetadata.values())
			.filter((ability) => castEvents.some((event) => event.abilityGameID === ability.id))
			.sort((a, b) => a.name.localeCompare(b.name));

		return apiOk({ castEvents, abilities });
	} catch (error) {
		if (error instanceof WclQueryError) {
			return apiError('Failed to fetch cast events from API.');
		}
		logServerError('api/boss-events', 'request failed', error);
		return apiError('Internal Server Error.');
	}
};
