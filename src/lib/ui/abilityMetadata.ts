export interface AbilityMetadata {
	id: number;
	name: string;
	icon?: string;
	iconUrl?: string;
}

export interface BossAbilityGroup {
	key: string;
	name: string;
	primaryId: number;
	ids: number[];
	icon?: string;
	iconUrl?: string;
	defaultVisible: boolean;
}

export interface WarcraftLogsAbility {
	gameID?: number | null;
	id?: number | null;
	name?: string | null;
	icon?: string | null;
}

export interface AbilityBearingEvent {
	abilityGameID?: number | null;
	ability?: WarcraftLogsAbility | null;
	abilityName?: string | null;
	abilityIcon?: string | null;
	abilityIconUrl?: string | null;
}

const excludedBossAbilityIds = new Set<number>([
	145629 // Anti-Magic Zone, a player Death Knight ability that can appear in enemy cast data.
]);

const excludedBossAbilityNames = new Set<string>(['Anti-Magic Zone'].map(normalizeAbilityName));

const defaultVisibleAbilityNamesByEncounter: Record<number, string[]> = {
	3176: [
		"Shadow's Advance",
		'Gathering Darkness',
		'Umbral Collapse',
		'Void Rupture',
		'Void Fall',
		"Oblivion's Wrath",
		'Shadow Phalanx',
		"Imperator's Glory",
		'Pitch Bulwark',
		'Blackening Wounds',
		'Dark Upheaval'
	],
	3177: [
		'Primordial Roar',
		'Shadowclaw Slam',
		'Aftershock',
		'Blisterburst',
		'Void Breath',
		'Crystal Wall',
		'Parasite Expulsion'
	],
	3178: [
		'Void Howl',
		'Nullbeam',
		'Nullzone',
		'Dread Breath',
		'Gloom',
		'Midnight Flames',
		'Radiant Barrier',
		'Vaelwing',
		'Rakfang',
		'Twilight Bond'
	],
	3179: [
		'Void Convergence',
		'Fractured Projection',
		'Fractured Image',
		'Shadow Fracture',
		'Despotic Command',
		'Entropic Unraveling',
		'Umbral Beams',
		'Shattering Twilight',
		'Twisting Obscurity',
		'Dark Radiation',
		'Void Infusion'
	],
	3180: [
		'Divine Shield',
		'Aura of Wrath',
		'Aura of Devotion',
		'Aura of Peace',
		'Execution Sentence',
		'Divine Hammer',
		'Divine Hammers',
		'Divine Toll',
		'Sacred Toll',
		'Sacred Shield',
		'Blinding Light',
		"Tyr's Wrath",
		'Searing Radiance',
		'Light Infused',
		'Judgment',
		'Final Verdict',
		'Shield of the Righteous'
	],
	3181: [
		'Silverstrike Arrow',
		"Ranger Captain's Mark",
		'Silverstrike Ricochet',
		'Grasp of Emptiness',
		'Void Expulsion',
		'Null Corona',
		'Stellar Emission',
		'Silverstrike Barrage',
		'Call of the Void',
		'Void Barrage',
		'Rift Slash',
		'Aspect of the End',
		'Gravity Collapse',
		'Devouring Cosmos',
		'Orbiting Matter'
	],
	3306: [
		'Alndust Upheaval',
		'Rift Emergence',
		'Alnshroud',
		'Haunting Essence',
		'Fearsome Cry',
		'Essence Bolt',
		'Consuming Miasma',
		'Rending Tear',
		'Consume',
		'Corrupted Devastation',
		'Ravenous Dive',
		'Caustic Phlegm',
		'Rift Shroud'
	],
	3182: [
		'Voidlight Convergence',
		'Light Dive',
		'Void Dive',
		"Embers of Belo'ren",
		'Light Eruption',
		'Void Eruption',
		'Rebirth',
		'Radiant Echoes',
		"Guardian's Edict",
		'Infused Quills',
		'Death Drop',
		'Incubation of Flames',
		'Ashen Benediction',
		'Burning Heart'
	],
	3183: [
		'Dark Quasar',
		"Death's Dirge",
		'Safeguard Prism',
		'Safeguard Matrix',
		'Safeguard',
		'Disintegration',
		'Cosmic Fracture',
		'Dawn Crystal',
		"Heaven's Glaives",
		"Heaven's Lance",
		'Shattered Sky',
		'Total Eclipse',
		'Starsplinter',
		'Galvanize',
		'Cosmic Fission',
		'Core Harvest',
		'Dark Meltdown',
		'Torchbearer',
		'The Dark Archangel',
		'Dark Archangel',
		'Black Tide',
		'Dark Constellation',
		'Light Siphon',
		'Stellar Implosion'
	]
};

const defaultVisibleAbilityKeysByEncounter = Object.fromEntries(
	Object.entries(defaultVisibleAbilityNamesByEncounter).map(([encounterId, names]) => [
		Number(encounterId),
		new Set(names.map(normalizeAbilityName))
	])
) as Record<number, Set<string>>;

export function getWowIconUrl(icon?: string | null): string | undefined {
	const value = icon?.trim();
	if (!value) return undefined;
	if (/^https?:\/\//i.test(value) || value.startsWith('/')) return value;

	const normalized = value.replace(/\.(jpe?g|png|webp)$/i, '').toLowerCase();
	return `https://wow.zamimg.com/images/wow/icons/large/${encodeURIComponent(normalized)}.jpg`;
}

export function normalizeAbilityName(name?: string | null): string {
	return (name ?? '')
		.trim()
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[\u2018\u2019\u02bc]/g, "'")
		.replace(/[\u201c\u201d]/g, '"')
		.replace(/\s+/g, ' ')
		.toLowerCase();
}

function getAbilityDisplayName(
	event: AbilityBearingEvent,
	staticAbility?: AbilityMetadata
): string | undefined {
	return (
		event.abilityName?.trim() ||
		event.ability?.name?.trim() ||
		staticAbility?.name?.trim() ||
		undefined
	);
}

export function isExcludedBossAbilityEvent(
	event: AbilityBearingEvent,
	staticAbilities: AbilityMetadata[] = []
): boolean {
	const id = event.abilityGameID;
	if (typeof id === 'number' && excludedBossAbilityIds.has(id)) return true;

	const staticAbility =
		typeof id === 'number' ? staticAbilities.find((ability) => ability.id === id) : undefined;
	const normalizedName = normalizeAbilityName(getAbilityDisplayName(event, staticAbility));
	return normalizedName ? excludedBossAbilityNames.has(normalizedName) : false;
}

export function getBossAbilityGroupKey(
	event: AbilityBearingEvent,
	staticAbilities: AbilityMetadata[] = []
): string {
	const id = event.abilityGameID;
	const staticAbility =
		typeof id === 'number' ? staticAbilities.find((ability) => ability.id === id) : undefined;
	const normalizedName = normalizeAbilityName(getAbilityDisplayName(event, staticAbility));

	if (normalizedName) return `name:${normalizedName}`;
	return `id:${typeof id === 'number' ? id : 'unknown'}`;
}

export function isDefaultVisibleBossAbility(
	encounterId: number | undefined,
	name: string
): boolean {
	if (!encounterId) return true;
	const defaultNames = defaultVisibleAbilityKeysByEncounter[encounterId];
	if (!defaultNames) return true;
	return defaultNames.has(normalizeAbilityName(name));
}

export function buildBossAbilityGroups(
	events: AbilityBearingEvent[],
	options: { encounterId?: number; staticAbilities?: AbilityMetadata[] } = {}
): BossAbilityGroup[] {
	const staticAbilities = options.staticAbilities ?? [];
	const staticById = new Map(staticAbilities.map((ability) => [ability.id, ability]));
	const groups = new Map<string, BossAbilityGroup>();

	for (const event of events) {
		const id = event.abilityGameID;
		if (typeof id !== 'number' || !Number.isFinite(id)) continue;
		if (isExcludedBossAbilityEvent(event, staticAbilities)) continue;

		const staticAbility = staticById.get(id);
		const name = getAbilityDisplayName(event, staticAbility) || `Ability ${id}`;
		const key = getBossAbilityGroupKey(event, staticAbilities);
		const icon = event.abilityIcon?.trim() || event.ability?.icon?.trim() || staticAbility?.icon;
		const iconUrl = event.abilityIconUrl?.trim() || getWowIconUrl(icon) || staticAbility?.iconUrl;
		const existing = groups.get(key);

		if (existing) {
			if (!existing.ids.includes(id)) existing.ids.push(id);
			if (!existing.icon && icon) existing.icon = icon;
			if (!existing.iconUrl && iconUrl) existing.iconUrl = iconUrl;
			continue;
		}

		groups.set(key, {
			key,
			name,
			primaryId: id,
			ids: [id],
			icon,
			iconUrl,
			defaultVisible: isDefaultVisibleBossAbility(options.encounterId, name)
		});
	}

	const groupedAbilities = Array.from(groups.values()).map((group) => ({
		...group,
		ids: [...group.ids].sort((a, b) => a - b),
		primaryId: Math.min(...group.ids)
	}));

	const hasRules = Boolean(
		options.encounterId && defaultVisibleAbilityKeysByEncounter[options.encounterId]
	);
	if (
		hasRules &&
		groupedAbilities.length > 0 &&
		groupedAbilities.every((group) => !group.defaultVisible)
	) {
		return groupedAbilities
			.map((group) => ({ ...group, defaultVisible: true }))
			.sort((a, b) => a.name.localeCompare(b.name));
	}

	return groupedAbilities.sort((a, b) => a.name.localeCompare(b.name));
}

export function buildAbilityMetadata(
	abilities: WarcraftLogsAbility[]
): Map<number, AbilityMetadata> {
	const metadataById = new Map<number, AbilityMetadata>();

	for (const ability of abilities) {
		const id = ability.gameID ?? ability.id;
		if (typeof id !== 'number' || !Number.isFinite(id)) continue;

		const name = ability.name?.trim() || `Ability ${id}`;
		const icon = ability.icon?.trim() || undefined;
		metadataById.set(id, {
			id,
			name,
			icon,
			iconUrl: getWowIconUrl(icon)
		});
	}

	return metadataById;
}

export function enrichAbilityEvent<T extends AbilityBearingEvent>(
	event: T,
	metadataById: Map<number, AbilityMetadata>
): T & { abilityName?: string; abilityIcon?: string; abilityIconUrl?: string } {
	const id = event.abilityGameID;
	const metadata = typeof id === 'number' ? metadataById.get(id) : undefined;
	const eventAbilityName = event.ability?.name?.trim();
	const eventAbilityIcon = event.ability?.icon?.trim();
	const abilityIcon = eventAbilityIcon || metadata?.icon;

	return {
		...event,
		abilityName: eventAbilityName || metadata?.name,
		abilityIcon,
		abilityIconUrl: getWowIconUrl(abilityIcon) || metadata?.iconUrl
	};
}
