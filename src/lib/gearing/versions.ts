/**
 * Artifact versioning and cache-bust URLs.
 *
 * Source of truth: SimulationCraft CASC/DBC extract → simc-factory exporters.
 * This app only fetches the published JSON under /gearing/.
 *
 *   item-db-v{N}.json     — ItemSparse allocs + rand_prop/scale + crests (+ optional bonuses)
 *   tier-sets-v{N}.json   — token→class→piece maps for 4pc enforcement
 *   season-loot-v{N}.json — Journal* DBC drop catalog (export_season_loot --from-journal)
 *   model-v{N}.json       — DPS NN (trained separately; not client DBC)
 */

import type { ArtifactMeta } from './gameDataContract';

export const MODEL_ARTIFACT_VERSION = 'v6';
export const ITEM_DB_ARTIFACT_VERSION = 1;
/** Schema version in the filename (`season-loot-v{N}.json`). */
export const SEASON_LOOT_ARTIFACT_VERSION = 1;
/**
 * Bump when season-loot content is republished in place (same filename).
 * Current Season EJ + availability filter (no prior-season / non-gear).
 */
export const SEASON_LOOT_CACHE_TOKEN = '8-midnight-s2-ej';
export const TIER_SETS_ARTIFACT_VERSION = 1;
export const ITEM_DB_CACHE_TOKEN = '8-midnight-s2-wago';
export const TIER_SETS_CACHE_TOKEN = '3-midnight-s2';

export const MODEL_PATH = `/gearing/model-${MODEL_ARTIFACT_VERSION}.json`;
export const ITEM_DB_PATH = `/gearing/item-db-v${ITEM_DB_ARTIFACT_VERSION}.json`;
export const SEASON_LOOT_PATH = `/gearing/season-loot-v${SEASON_LOOT_ARTIFACT_VERSION}.json`;
export const TIER_SETS_PATH = `/gearing/tier-sets-v${TIER_SETS_ARTIFACT_VERSION}.json`;

/** Build a fetch URL with an explicit cache-bust query. */
export function artifactUrl(path: string, versionToken: string | number): string {
	const sep = path.includes('?') ? '&' : '?';
	return `${path}${sep}v=${encodeURIComponent(String(versionToken))}`;
}

export function modelFetchUrl(overrideVersion = MODEL_ARTIFACT_VERSION): string {
	return artifactUrl(MODEL_PATH, overrideVersion);
}

export function itemDbFetchUrl(
	overrideVersion: string | number = `${ITEM_DB_ARTIFACT_VERSION}.${ITEM_DB_CACHE_TOKEN}`
): string {
	return artifactUrl(ITEM_DB_PATH, overrideVersion);
}

export function seasonLootFetchUrl(
	overrideVersion: string | number = `${SEASON_LOOT_ARTIFACT_VERSION}.${SEASON_LOOT_CACHE_TOKEN}`
): string {
	return artifactUrl(SEASON_LOOT_PATH, overrideVersion);
}

export function tierSetsFetchUrl(
	overrideVersion: string | number = `${TIER_SETS_ARTIFACT_VERSION}.${TIER_SETS_CACHE_TOKEN}`
): string {
	return artifactUrl(TIER_SETS_PATH, overrideVersion);
}

export type ArtifactVersions = {
	modelVersion: string;
	itemDbVersion: number;
	seasonLootVersion?: number;
	tierSetsVersion?: number;
	modelCompat?: string;
	season?: string;
	wowBuild?: string;
	/** Short pipeline labels for UI (e.g. item-db:simc-dbc). */
	pipelines?: string[];
};

export function formatArtifactLabel(v: ArtifactVersions): string {
	const parts = [`model ${v.modelVersion}`, `item-db v${v.itemDbVersion}`];
	if (v.tierSetsVersion != null) parts.push(`tier-sets v${v.tierSetsVersion}`);
	if (v.seasonLootVersion != null) parts.push(`season-loot v${v.seasonLootVersion}`);
	if (v.season) parts.push(v.season);
	if (v.wowBuild) parts.push(`build ${v.wowBuild}`);
	return parts.join(' · ');
}

export function metaPipeline(meta: ArtifactMeta | null | undefined): string | undefined {
	return meta?.source?.pipeline;
}
