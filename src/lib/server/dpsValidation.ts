import type {
	ValidationExport,
	ValidationOverall,
	ValidationSpecDisplay,
	ValidationSpecRow
} from '$lib/data/validation';
import { memoryCacheGet, memoryCacheSet } from '$lib/server/memoryCache';
import { parseValidationLua } from '$lib/server/parseValidationLua';

const GITHUB_VALIDATION_URL =
	'https://raw.githubusercontent.com/Mr-Mythical/MrMythicalDpsPredictor/main/ValidationData.lua';

/** Synthetic URL used as the Cloudflare Cache API key (not fetched). */
const CF_CACHE_KEY = 'https://mrmythical.com/__cache/dps-validation.lua';

/** Edge + isolate TTL. Validation ships with daily model publishes; hourly is plenty. */
const CACHE_TTL_SECONDS = 60 * 60;
const MEMORY_TTL_MS = CACHE_TTL_SECONDS * 1000;
const MEMORY_KEY = 'dps-validation:export';

const MULTI_WORD_CLASSES = ['Death_Knight', 'Demon_Hunter'] as const;

function asNumber(value: unknown, fallback = 0): number {
	const n = typeof value === 'number' ? value : Number(value);
	return Number.isFinite(n) ? n : fallback;
}

function asString(value: unknown, fallback = ''): string {
	return typeof value === 'string' ? value : fallback;
}

function asBool(value: unknown): boolean {
	return value === true;
}

function normalizeOverall(raw: unknown): ValidationOverall {
	const row = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
	return {
		upgrade_picks_pct: asNumber(row.upgrade_picks_pct),
		upgrade_size_error_pct: asNumber(row.upgrade_size_error_pct),
		dps_read_error_pct: asNumber(row.dps_read_error_pct),
		scored_pairs: asNumber(row.scored_pairs),
		spec_count: asNumber(row.spec_count)
	};
}

function normalizeSpecRow(raw: unknown): ValidationSpecRow {
	const row = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
	return {
		upgrade_picks_pct: asNumber(row.upgrade_picks_pct),
		upgrade_size_error_pct: asNumber(row.upgrade_size_error_pct),
		dps_read_error_pct: asNumber(row.dps_read_error_pct),
		n_scored_pairs: asNumber(row.n_scored_pairs),
		n_tie_pairs: asNumber(row.n_tie_pairs)
	};
}

function normalizeExport(fields: Record<string, unknown>): ValidationExport | null {
	const overall = fields.overall;
	const bySpecRaw = fields.by_spec;
	if (!overall || typeof overall !== 'object' || !bySpecRaw || typeof bySpecRaw !== 'object') {
		return null;
	}

	const by_spec: Record<string, ValidationSpecRow> = {};
	for (const [key, value] of Object.entries(bySpecRaw as Record<string, unknown>)) {
		by_spec[key] = normalizeSpecRow(value);
	}

	return {
		has_data: asBool(fields.has_data),
		run_id: asString(fields.run_id),
		checked_at: asString(fields.checked_at),
		checked_label: asString(fields.checked_label),
		status: asString(fields.status, 'validated'),
		confirmed_at: fields.confirmed_at != null ? asString(fields.confirmed_at) : undefined,
		confirmed_label:
			fields.confirmed_label != null ? asString(fields.confirmed_label) : undefined,
		is_full_run: asBool(fields.is_full_run),
		is_current: asBool(fields.is_current),
		overall: normalizeOverall(overall),
		by_spec
	};
}

function titleCaseWords(raw: string): string {
	return raw
		.split('_')
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
		.join(' ');
}

/** Turn `MID1_Mage_Frost_Frostfire` into class / spec / hero labels. */
export function formatProfileKey(profileKey: string): Omit<
	ValidationSpecDisplay,
	keyof ValidationSpecRow
> {
	let rest = profileKey.replace(/^MID\d+_/, '');
	let className = '';
	for (const multi of MULTI_WORD_CLASSES) {
		if (rest === multi || rest.startsWith(multi + '_')) {
			className = titleCaseWords(multi);
			rest = rest.slice(multi.length).replace(/^_/, '');
			break;
		}
	}
	if (!className) {
		const first = rest.split('_')[0] ?? '';
		className = titleCaseWords(first);
		rest = rest.slice(first.length).replace(/^_/, '');
	}

	const parts = rest.split('_').filter(Boolean);
	const specName = titleCaseWords(parts[0] ?? '');
	const heroTalent = parts.length > 1 ? titleCaseWords(parts.slice(1).join('_')) : null;
	const label = heroTalent ? `${className} ${specName} (${heroTalent})` : `${className} ${specName}`;

	return { profileKey, className, specName, heroTalent, label };
}

export function specsForDisplay(data: ValidationExport): ValidationSpecDisplay[] {
	return Object.entries(data.by_spec)
		.map(([profileKey, row]) => ({ ...formatProfileKey(profileKey), ...row }))
		.sort((a, b) => {
			const byClass = a.className.localeCompare(b.className);
			if (byClass !== 0) return byClass;
			const bySpec = a.specName.localeCompare(b.specName);
			if (bySpec !== 0) return bySpec;
			return (a.heroTalent ?? '').localeCompare(b.heroTalent ?? '');
		});
}

/**
 * Fetch ValidationData.lua, preferring Cloudflare's Cache API when `platform`
 * is available (Pages/Workers). Misses fall through to GitHub raw.
 */
async function fetchValidationLua(platform?: App.Platform): Promise<string | null> {
	const cache = platform?.caches?.default;
	const cacheKey = new Request(CF_CACHE_KEY);

	if (cache) {
		try {
			const hit = await cache.match(cacheKey);
			if (hit?.ok) return await hit.text();
		} catch {
			// Cache API unavailable in some local/dev contexts — continue to origin.
		}
	}

	const res = await fetch(GITHUB_VALIDATION_URL, {
		headers: { Accept: 'text/plain' }
	});
	if (!res.ok) return null;

	const lua = await res.text();
	if (!lua || !cache) return lua || null;

	const cached = new Response(lua, {
		status: 200,
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}`
		}
	});
	const put = cache.put(cacheKey, cached);
	platform?.context?.waitUntil?.(put);

	return lua;
}

/**
 * Load the latest shipped validation export from the addon GitHub repo.
 * Cached for 1h in-isolate and in Cloudflare's edge Cache API.
 */
export async function loadDpsValidation(
	platform?: App.Platform
): Promise<ValidationExport | null> {
	const memHit = memoryCacheGet<ValidationExport>(MEMORY_KEY);
	if (memHit) return memHit;

	try {
		const lua = await fetchValidationLua(platform);
		if (!lua) return null;

		const parsed = normalizeExport(parseValidationLua(lua));
		if (!parsed?.has_data || !parsed.overall) return null;

		memoryCacheSet(MEMORY_KEY, parsed, MEMORY_TTL_MS);
		return parsed;
	} catch {
		return null;
	}
}
