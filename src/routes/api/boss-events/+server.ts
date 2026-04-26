import type { RequestHandler } from './$types';
import type { CastEvent } from '$lib/types/apiTypes';
import {
	buildAbilityMetadata,
	enrichAbilityEvent,
	isExcludedBossAbilityEvent,
	type WarcraftLogsAbility
} from '$lib/ui/abilityMetadata';
import { handleWclFightRequest } from '$lib/server/wclGraphQL';

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

interface BossEventsResult {
	castEvents: CastEvent[];
	abilities: ReturnType<typeof buildAbilityMetadata> extends Map<unknown, infer V> ? V[] : never;
}

/**
 * POST /api/boss-events
 *
 * Returns enemy cast events (boss abilities) for a single fight, enriched with
 * ability name + icon metadata pulled from the report's master data.
 *
 * Body: `{ fightID, code, startTime, endTime }`.
 *
 * Returns:
 * - 200 `{ castEvents, abilities }`
 * - 400 if the body is malformed.
 * - 502 if the WarcraftLogs GraphQL call fails.
 */
export const POST: RequestHandler = ({ request }) =>
	handleWclFightRequest<BossEventsData, BossEventsResult>(request, {
		query: QUERY,
		operation: 'api/boss-events',
		fetchErrorMessage: 'Failed to fetch cast events from API.',
		transform: (data) => {
			const report = data.reportData?.report;
			const abilityMetadata = buildAbilityMetadata(report?.masterData?.abilities ?? []);
			const castEvents: CastEvent[] = (report?.events?.data ?? [])
				.filter((event) => event.type === 'cast')
				.map((event) => enrichAbilityEvent(event as unknown as CastEvent, abilityMetadata))
				.filter((event) => !isExcludedBossAbilityEvent(event));
			const abilities = Array.from(abilityMetadata.values())
				.filter((ability) => castEvents.some((event) => event.abilityGameID === ability.id))
				.sort((a, b) => a.name.localeCompare(b.name));
			return { castEvents, abilities };
		}
	});
