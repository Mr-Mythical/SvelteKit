/**
 * Shared request body parsers for POST handlers.
 *
 * The route handlers under `src/routes/api/*` accept JSON bodies that come
 * straight from the client. Parsing them with a bare `await request.json()`
 * (a) throws on non-JSON input, surfacing as an unhandled 500 instead of a
 * 400, and (b) leaves the runtime shape of the body unchecked, so values
 * flow into DB writes / string templating without ever being narrowed.
 *
 * Helpers here own the "parse + shape-check" seam so handlers can return
 * `apiError('Invalid request body', 400)` consistently.
 */
import { apiError } from './apiResponses';

/**
 * Read a JSON body and run a shape validator over it. On parse failure or
 * validation failure, returns the standard 400 `{error}` response so callers
 * can do `if (parsed instanceof Response) return parsed;`.
 */
export async function parseJsonBody<T>(
	request: Request,
	validate: (body: unknown) => T | null,
	options: { invalidMessage?: string } = {}
): Promise<T | Response> {
	let raw: unknown;
	try {
		raw = await request.json();
	} catch {
		return apiError(options.invalidMessage ?? 'Invalid request body', 400);
	}
	const validated = validate(raw);
	if (validated === null) {
		return apiError(options.invalidMessage ?? 'Invalid request body', 400);
	}
	return validated;
}

export interface RecentCharacterBody {
	characterName: string;
	realm: string;
	region: string;
}

const MAX_FIELD_LEN = 64;

function isNonEmptyString(value: unknown, max = MAX_FIELD_LEN): value is string {
	return typeof value === 'string' && value.length > 0 && value.length <= max;
}

export function parseRecentCharacterBody(body: unknown): RecentCharacterBody | null {
	if (!body || typeof body !== 'object') return null;
	const { characterName, realm, region } = body as Record<string, unknown>;
	if (!isNonEmptyString(characterName) || !isNonEmptyString(realm) || !isNonEmptyString(region)) {
		return null;
	}
	return { characterName, realm, region };
}

export interface RecentReportBody {
	code: string;
	title: string;
	guild?: { name: string };
	owner?: { name: string };
}

export function parseRecentReportBody(body: unknown): RecentReportBody | null {
	if (!body || typeof body !== 'object') return null;
	const { code, title, guild, owner } = body as Record<string, unknown>;
	if (!isNonEmptyString(code, 32) || !isNonEmptyString(title, 256)) return null;

	let parsedGuild: { name: string } | undefined;
	if (guild !== undefined && guild !== null) {
		if (typeof guild !== 'object') return null;
		const guildName = (guild as Record<string, unknown>).name;
		if (guildName !== undefined && !isNonEmptyString(guildName, 128)) return null;
		parsedGuild = guildName ? { name: guildName as string } : undefined;
	}

	let parsedOwner: { name: string } | undefined;
	if (owner !== undefined && owner !== null) {
		if (typeof owner !== 'object') return null;
		const ownerName = (owner as Record<string, unknown>).name;
		if (ownerName !== undefined && !isNonEmptyString(ownerName, 128)) return null;
		parsedOwner = ownerName ? { name: ownerName as string } : undefined;
	}

	return { code, title, guild: parsedGuild, owner: parsedOwner };
}

export interface CurrentStateBody {
	urlParams: string;
}

const MAX_URL_PARAMS_LEN = 4096;

export function parseCurrentStateBody(body: unknown): CurrentStateBody | null {
	if (!body || typeof body !== 'object') return null;
	const { urlParams } = body as Record<string, unknown>;
	if (typeof urlParams !== 'string' || urlParams.length > MAX_URL_PARAMS_LEN) return null;
	return { urlParams };
}
