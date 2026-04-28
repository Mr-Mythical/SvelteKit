import type { RequestHandler } from './$types';
import type { CastEvent } from '$lib/types/apiTypes';
import { classSpecAbilities } from '$lib/types/classData';
import { handleWclFightRequest } from '$lib/server/wclGraphQL';

const HEALER_SPECS = '"Holy", "Restoration", "Preservation", "Discipline", "Mistweaver"';

function collectHealerAbilityIds(): number[] {
	return Object.values(classSpecAbilities)
		.flatMap((classSpecs) =>
			Object.values(classSpecs).flatMap((spec) =>
				(spec.Major as { name: string; id: number }[])
					.concat(spec.Minor as { name: string; id: number }[])
					.map((ability) => ability.id)
			)
		)
		.filter((id): id is number => id !== undefined && id !== null);
}

const QUERY = `
	query ResourcesBySource($code: String!, $fightID: Int!, $start: Float!, $end: Float!, $filter: String!) {
		reportData {
			report(code: $code) {
				events(
					filterExpression: $filter,
					dataType: Casts,
					fightIDs: [$fightID],
					startTime: $start,
					endTime: $end,
					hostilityType: Friendlies
				) {
					data
					nextPageTimestamp
				}
			}
		}
	}
`;

interface CastEventsData {
	reportData: {
		report: {
			events: { data: Array<{ type: string } & Record<string, unknown>> };
		};
	};
}

export const POST: RequestHandler = ({ request }) => {
	const abilityIDs = collectHealerAbilityIds();
	const filter =
		abilityIDs.length > 0
			? `ability.id IN (${abilityIDs.join(', ')}) AND source.spec IN (${HEALER_SPECS})`
			: '';

	return handleWclFightRequest<CastEventsData, { castEvents: CastEvent[] }>(request, {
		query: QUERY,
		operation: 'api/cast-events',
		fetchErrorMessage: 'Failed to fetch cast events from API.',
		extraVariables: () => ({ filter }),
		transform: (data) => ({
			castEvents: data.reportData.report.events.data.filter(
				(event) => event.type === 'cast'
			) as unknown as CastEvent[]
		})
	});
};
