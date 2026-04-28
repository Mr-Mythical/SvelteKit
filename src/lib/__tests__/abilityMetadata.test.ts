import { describe, expect, it } from 'vitest';
import {
	buildBossAbilityGroups,
	buildAbilityMetadata,
	enrichAbilityEvent,
	getWowIconUrl,
	isExcludedBossAbilityEvent,
	normalizeAbilityName
} from '$lib/ui/abilityMetadata';

describe('ability metadata helpers', () => {
	it('builds Wowhead icon URLs from Warcraft Logs icon slugs', () => {
		expect(getWowIconUrl('spell_shadow_shadowbolt')).toBe(
			'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_shadowbolt.jpg'
		);
	});

	it('preserves absolute icon URLs', () => {
		expect(getWowIconUrl('https://example.com/icon.webp')).toBe('https://example.com/icon.webp');
	});

	it('indexes metadata by Warcraft Logs game ID', () => {
		const metadata = buildAbilityMetadata([
			{ gameID: 12345, name: 'Void Blast', icon: 'spell_shadow_shadowbolt' }
		]);

		expect(metadata.get(12345)).toEqual({
			id: 12345,
			name: 'Void Blast',
			icon: 'spell_shadow_shadowbolt',
			iconUrl: 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_shadowbolt.jpg'
		});
	});

	it('enriches cast events with metadata names and icons', () => {
		const metadata = buildAbilityMetadata([
			{ gameID: 12345, name: 'Void Blast', icon: 'spell_shadow_shadowbolt' }
		]);

		expect(enrichAbilityEvent({ abilityGameID: 12345 }, metadata)).toMatchObject({
			abilityGameID: 12345,
			abilityName: 'Void Blast',
			abilityIcon: 'spell_shadow_shadowbolt',
			abilityIconUrl: 'https://wow.zamimg.com/images/wow/icons/large/spell_shadow_shadowbolt.jpg'
		});
	});

	it('normalizes ability names for player-facing grouping', () => {
		expect(normalizeAbilityName('  Death’s   Dirge  ')).toBe("death's dirge");
	});

	it('groups same-name boss abilities that use different spell ids', () => {
		const groups = buildBossAbilityGroups(
			[
				{
					abilityGameID: 1246736,
					abilityName: 'Judgment',
					abilityIcon: 'ability_paladin_judgementred'
				},
				{
					abilityGameID: 1251857,
					abilityName: 'Judgment',
					abilityIcon: 'ability_paladin_judgementblue'
				}
			],
			{ encounterId: 3180 }
		);

		expect(groups).toHaveLength(1);
		expect(groups[0]).toMatchObject({
			key: 'name:judgment',
			name: 'Judgment',
			primaryId: 1246736,
			ids: [1246736, 1251857],
			defaultVisible: true
		});
	});

	it('deselects low-signal abilities when a curated boss default matches', () => {
		const groups = buildBossAbilityGroups(
			[
				{ abilityGameID: 1246485, abilityName: "Avenger's Shield" },
				{ abilityGameID: 1248983, abilityName: 'Execution Sentence' }
			],
			{ encounterId: 3180 }
		);

		expect(groups.find((group) => group.name === 'Execution Sentence')?.defaultVisible).toBe(true);
		expect(groups.find((group) => group.name === "Avenger's Shield")?.defaultVisible).toBe(false);
	});

	it('keeps all boss abilities visible when no curated default can match', () => {
		const groups = buildBossAbilityGroups(
			[
				{ abilityGameID: 1, abilityName: 'Unmapped Beta Spell' },
				{ abilityGameID: 2, abilityName: 'Another Unknown Cast' }
			],
			{ encounterId: 3180 }
		);

		expect(groups.every((group) => group.defaultVisible)).toBe(true);
	});

	it('keeps all boss abilities visible when an encounter has no curated defaults', () => {
		const groups = buildBossAbilityGroups([{ abilityGameID: 1, abilityName: 'Low Signal' }], {
			encounterId: 9999
		});

		expect(groups[0].defaultVisible).toBe(true);
	});

	it('excludes known player abilities from boss ability groups', () => {
		const events = [
			{ abilityGameID: 145629, abilityName: 'Anti-Magic Zone' },
			{ abilityGameID: 1248983, abilityName: 'Execution Sentence' }
		];

		expect(isExcludedBossAbilityEvent(events[0])).toBe(true);
		expect(buildBossAbilityGroups(events, { encounterId: 3180 })).toHaveLength(1);
		expect(buildBossAbilityGroups(events, { encounterId: 3180 })[0].name).toBe(
			'Execution Sentence'
		);
	});
});
