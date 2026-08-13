/**
 * Game-data contract for the Online Gearing Dashboard.
 *
 * Chosen architecture (aligned with SimC + Raidbots Droptimizer):
 *   1. Extract client DB2s with SimulationCraft casc_extract (CDN) + dbc_extract
 *      (+ DBCache.bin hotfixes when available).
 *   2. simc-factory publishes compact JSON into static/gearing/ (and the addon).
 *   3. This SvelteKit app only consumes those artifacts — no CASC/DBC in the browser.
 *
 * Factory publish order (simc-factory/local):
 *   casc_extract → dbc_extract → engine/dbc/generated/*.inc
 *   → export_item_db.py      → item-db-v{N}.json
 *   → export_tier_sets.py    → tier-sets-v{N}.json   (ItemSet / tokens; interim: TierTokenData.lua)
 *   → export_season_loot.py --from-journal → season-loot-v{N}.json (Journal* DB2)
 *   → export_wow_addon.py    → model-v{N}.json
 *
 * Do not hand-edit combat allocations or season drop lists in this repo.
 */

/** How an artifact was produced. */
export type GameDataPipeline =
	| 'simc-dbc'
	| 'simc-dbc-ej'
	| 'addon-dumpseason'
	| 'bootstrap'
	| 'lua-bridge';

export type GameDataSource = {
	pipeline: GameDataPipeline;
	/** e.g. "simc casc_extract + dbc_extract → simc-factory export" */
	extractor?: string;
	/** Human note for interim sources (Lua bridge, bootstrap seeds). */
	publishedFrom?: string;
	hotfixHash?: string;
	notes?: string[];
};

export type ArtifactMeta = {
	version: number;
	schema?: string;
	season?: string;
	wow_build?: string;
	model_compat?: string;
	source?: GameDataSource;
	notes?: string[];
};

/**
 * ItemBonus subset we resolve in the browser (Raidbots/SimC-style).
 * Full ItemBonus tables stay in the factory; only ilvl-affecting rows are shipped.
 */
export type ItemBonusEntry = {
	/** Absolute item level (ItemBonus set-level / crest track). */
	itemLevel?: number;
	/** Additive offset after set-level. */
	levelOffset?: number;
	crestTrackId?: number;
};

export function artifactPipelineLabel(source: GameDataSource | undefined): string {
	if (!source?.pipeline) return 'unknown';
	if (source.publishedFrom) return `${source.pipeline} (${source.publishedFrom})`;
	return source.pipeline;
}
