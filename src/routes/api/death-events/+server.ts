import type { RequestHandler } from './$types';
import { handleWclFightRequest } from '$lib/server/wclGraphQL';

export interface DeathEvent {
	timestamp: number;
	targetID: number;
	targetName: string;
	targetClass?: string;
	abilityGameID?: number;
	abilityName?: string;
	killerID?: number;
	killerName?: string;
}

const QUERY = `
	query DeathsForFight($code: String!, $fightID: Int!, $start: Float!, $end: Float!) {
		reportData {
			report(code: $code) {
				events(
					dataType: Deaths
					fightIDs: [$fightID]
					startTime: $start
					endTime: $end
					hostilityType: Friendlies
					limit: 1000
				) {
					data
					nextPageTimestamp
				}
				masterData {
					actors(type: "Player") {
						id
						name
						type
						subType
					}
				}
			}
		}
	}
`;

interface DeathRawEvent {
	type: string;
	timestamp: number;
	targetID: number;
	abilityGameID?: number;
	ability?: { name?: string };
	killerID?: number;
}

interface DeathsData {
	reportData: {
		report: {
			events: { data: DeathRawEvent[] } | null;
			masterData: {
				actors: Array<{ id: number; name: string; type: string; subType?: string }>;
			} | null;
		} | null;
	};
}

export const POST: RequestHandler = ({ request }) =>
	handleWclFightRequest<DeathsData, { deathEvents: DeathEvent[] }>(request, {
		query: QUERY,
		operation: 'api/death-events',
		fetchErrorMessage: 'Failed to fetch death events.',
		transform: (data) => {
			const report = data.reportData?.report;
			const rawEvents = report?.events?.data ?? [];
			const actors = report?.masterData?.actors ?? [];
			const actorById = new Map(actors.map((a) => [a.id, a]));

			const deathEvents: DeathEvent[] = rawEvents
				.filter((e) => e.type === 'death')
				.map((e) => {
					const target = actorById.get(e.targetID);
					const killer = e.killerID != null ? actorById.get(e.killerID) : undefined;
					return {
						timestamp: e.timestamp,
						targetID: e.targetID,
						targetName: target?.name ?? `Unknown ${e.targetID}`,
						targetClass: target?.subType,
						abilityGameID: e.abilityGameID,
						abilityName: e.ability?.name,
						killerID: e.killerID,
						killerName: killer?.name
					};
				});

			return { deathEvents };
		}
	});
