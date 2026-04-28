import { getOrRefreshAccessToken } from '$lib/auth/tokenCache';
import { apiError, apiOk } from '$lib/server/apiResponses';
import { logServerError } from '$lib/server/logger';

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

/**
 * Handle a per-fight WCL POST endpoint end-to-end: parse + validate the body,
 * run the GraphQL query with `extraVariables` merged in, transform the result,
 * and translate any failure into the standard `{error}` JSON shape.
 *
 * Centralises what every event/graph handler had inlined: 400 on bad body,
 * 502 on WCL transport/GraphQL error, 500 on anything else.
 */
export async function handleWclFightRequest<TData, TBody>(
	request: Request,
	options: {
		query: string;
		operation: string;
		fetchErrorMessage: string;
		transform: (data: TData, body: FightRequestBody) => TBody | Promise<TBody>;
		extraVariables?: (body: FightRequestBody) => Record<string, unknown>;
	}
): Promise<Response> {
	const body = parseFightRequestBody(await request.json().catch(() => null));
	if (!body) return apiError('Invalid or missing fight ID and/or report code.', 400);

	try {
		const variables = {
			code: body.code,
			fightID: body.fightID,
			start: body.startTime,
			end: body.endTime,
			...(options.extraVariables?.(body) ?? {})
		};
		const data = await executeWclQuery<TData>(options.query, variables);
		const result = await options.transform(data, body);
		return apiOk(result);
	} catch (error) {
		if (error instanceof WclQueryError) {
			return apiError(options.fetchErrorMessage, 502);
		}
		logServerError(options.operation, 'request failed', error);
		return apiError('Internal Server Error.');
	}
}
