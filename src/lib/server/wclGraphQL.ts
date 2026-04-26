import { getOrRefreshAccessToken } from '$lib/auth/tokenCache';

export const WCL_GRAPHQL_URL = 'https://www.warcraftlogs.com/api/v2/client';

export class WclQueryError extends Error {
	constructor(
		message: string,
		public readonly kind: 'http' | 'graphql',
		public readonly detail?: unknown
	) {
		super(message);
		this.name = 'WclQueryError';
	}
}

/**
 * Run a GraphQL query against the Warcraft Logs v2 API using the cached
 * client-credentials token. Throws {@link WclQueryError} on transport or
 * GraphQL-level failures so route handlers can map to a single error shape.
 */
export async function executeWclQuery<T>(
	query: string,
	variables: Record<string, unknown>
): Promise<T> {
const accessToken = await getOrRefreshAccessToken();

	const response = await fetch(WCL_GRAPHQL_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${accessToken}`
		},
		body: JSON.stringify({ query, variables })
	});

	if (!response.ok) {
		throw new WclQueryError(`WCL HTTP ${response.status}`, 'http', response.statusText);
	}

	const body = (await response.json()) as { data?: T; errors?: unknown };

	if (body.errors) {
		throw new WclQueryError('WCL returned GraphQL errors', 'graphql', body.errors);
	}

	if (body.data === undefined) {
		throw new WclQueryError('WCL response missing data', 'graphql');
	}

	return body.data;
}

export interface FightRequestBody {
	fightID: number;
	code: string;
	startTime: number;
	endTime: number;
}

/**
 * Validate the body shape used by every per-fight WCL endpoint
 * (cast/damage/healing/death/boss events). Returns the typed body or `null`
 * when validation fails so callers can return a 400 with a unified message.
 */
export function parseFightRequestBody(body: unknown): FightRequestBody | null {
	if (!body || typeof body !== 'object') return null;
	const { fightID, code, startTime, endTime } = body as Record<string, unknown>;
	if (
		typeof fightID !== 'number' ||
		typeof code !== 'string' ||
		!code ||
		typeof startTime !== 'number' ||
		typeof endTime !== 'number'
	) {
		return null;
	}
	return { fightID, code, startTime, endTime };
}
