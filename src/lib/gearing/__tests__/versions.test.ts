import { describe, expect, it } from 'vitest';
import {
	ITEM_DB_ARTIFACT_VERSION,
	MODEL_ARTIFACT_VERSION,
	SEASON_LOOT_ARTIFACT_VERSION,
	TIER_SETS_ARTIFACT_VERSION,
	artifactUrl,
	formatArtifactLabel,
	itemDbFetchUrl,
	modelFetchUrl,
	seasonLootFetchUrl,
	tierSetsFetchUrl
} from '../versions';

describe('gearing artifact versioning', () => {
	it('builds cache-busted model, item-db, and tier-sets URLs', () => {
		expect(modelFetchUrl()).toBe(
			`/gearing/model-${MODEL_ARTIFACT_VERSION}.json?v=${MODEL_ARTIFACT_VERSION}`
		);
		expect(itemDbFetchUrl()).toContain(`/gearing/item-db-v${ITEM_DB_ARTIFACT_VERSION}.json?v=`);
		expect(tierSetsFetchUrl()).toContain(
			`/gearing/tier-sets-v${TIER_SETS_ARTIFACT_VERSION}.json?v=`
		);
		expect(seasonLootFetchUrl()).toContain(
			`/gearing/season-loot-v${SEASON_LOOT_ARTIFACT_VERSION}.json?v=`
		);
	});

	it('artifactUrl appends or merges query params', () => {
		expect(artifactUrl('/gearing/model-v6.json', 'v6')).toBe('/gearing/model-v6.json?v=v6');
		expect(artifactUrl('/gearing/model-v6.json?x=1', 'v6')).toBe('/gearing/model-v6.json?x=1&v=v6');
	});

	it('formatArtifactLabel includes season and build when present', () => {
		expect(
			formatArtifactLabel({
				modelVersion: 'v6',
				itemDbVersion: 1,
				season: 'midnight-s2',
				wowBuild: '12.1.0'
			})
		).toBe('model v6 · item-db v1 · midnight-s2 · build 12.1.0');
	});
});
