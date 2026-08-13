/**
 * Parallel boot loader for all gearing game-data artifacts.
 */

import { artifactPipelineLabel } from './gameDataContract';
import { fetchItemDb, type ItemDbJson } from './itemDb';
import { fetchModel, type LoadedModel } from './model';
import { fetchSeasonLoot, type SeasonLootJson } from './season';
import { fetchTierSets, type TierSetsJson } from './tier';
import { formatArtifactLabel, type ArtifactVersions } from './versions';
import { logClientError } from '$lib/clientLog';

export type LoadedGameData = {
	model: LoadedModel;
	itemDb: ItemDbJson;
	tierSets: TierSetsJson | null;
	seasonLoot: SeasonLootJson | null;
	versions: ArtifactVersions;
	label: string;
	/** User-facing warnings when optional catalogs fail (model + item-db still loaded). */
	warnings: string[];
};

export async function loadGearingGameData(): Promise<LoadedGameData> {
	const [model, itemDb, tierSetsResult, seasonResult] = await Promise.all([
		fetchModel(),
		fetchItemDb(),
		fetchTierSets().then(
			(t) => ({ ok: true as const, value: t }),
			(err) => ({ ok: false as const, error: err })
		),
		fetchSeasonLoot().then(
			(s) => ({ ok: true as const, value: s }),
			(err) => ({ ok: false as const, error: err })
		)
	]);

	const warnings: string[] = [];
	const tierSets = tierSetsResult.ok ? tierSetsResult.value : null;
	const seasonLoot = seasonResult.ok ? seasonResult.value : null;
	if (!tierSetsResult.ok) {
		logClientError('gearing/loadGameData', 'tier sets failed', tierSetsResult.error);
		warnings.push(
			'Tier set data failed to load. 4-piece set enforcement is off until you refresh.'
		);
	}
	if (!seasonResult.ok) {
		logClientError('gearing/loadGameData', 'season loot failed', seasonResult.error);
		warnings.push('Season loot catalog failed to load. Refresh the page to try again.');
	}

	const pipelines: string[] = [];
	if (itemDb.source) pipelines.push(`item-db:${artifactPipelineLabel(itemDb.source)}`);
	if (tierSets?.source) pipelines.push(`tier:${artifactPipelineLabel(tierSets.source)}`);
	if (seasonLoot?.source && typeof seasonLoot.source !== 'string') {
		pipelines.push(`season:${artifactPipelineLabel(seasonLoot.source)}`);
	} else if (typeof seasonLoot?.source === 'string') {
		pipelines.push(`season:${seasonLoot.source}`);
	}

	const versions: ArtifactVersions = {
		modelVersion: model.version,
		itemDbVersion: itemDb.version,
		tierSetsVersion: tierSets?.version,
		seasonLootVersion: seasonLoot?.version,
		modelCompat: itemDb.model_compat,
		season: seasonLoot?.season ?? itemDb.season ?? tierSets?.season,
		wowBuild: itemDb.wow_build ?? tierSets?.wow_build ?? seasonLoot?.wow_build,
		pipelines
	};

	return {
		model,
		itemDb,
		tierSets,
		seasonLoot,
		versions,
		label: formatArtifactLabel(versions),
		warnings
	};
}
