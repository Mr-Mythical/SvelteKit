import type { RequestHandler } from '@sveltejs/kit';
import { getOrRefreshBlizzardAccessToken } from '$lib/auth/blizzardTokenCache';
import { apiError, apiOk } from '$lib/server/apiResponses';
import { handleApiError } from '$lib/server/logger';

/**
 * GET /api/gearing/character?name=&region=&realm=
 *
 * Battle.net equipment + statistics proxy for the Gearing Dashboard.
 * Returns item IDs/bonuses, per-item combat ratings, and the live paper-doll
 * vector from the character statistics endpoint (addon-equivalent base stats).
 */

const SLOT_TYPES = [
	'HEAD',
	'NECK',
	'SHOULDER',
	'CHEST',
	'WAIST',
	'LEGS',
	'FEET',
	'WRIST',
	'HANDS',
	'FINGER_1',
	'FINGER_2',
	'TRINKET_1',
	'TRINKET_2',
	'BACK',
	'MAIN_HAND',
	'OFF_HAND'
] as const;

/** NN combat ratings extracted from Blizzard equipment `stats`. */
type ArmoryCombatStats = {
	primary_stat: number;
	crit: number;
	haste: number;
	mastery: number;
	versatility: number;
};

/** Live character-sheet ratings from `/statistics` (all three primaries kept). */
type ArmoryPaperDoll = {
	strength: number;
	agility: number;
	intellect: number;
	crit: number;
	haste: number;
	mastery: number;
	versatility: number;
};

type EquippedPiece = {
	slot: string;
	itemId: number;
	bonusIds: number[];
	itemLevel: number;
	name: string;
	quality?: { type?: string; name?: string };
	inventoryType?: string;
	/** Present when Battle.net returned usable combat ratings for the piece. */
	combatStats?: ArmoryCombatStats;
};

type GearingCharacterResponse = {
	name: string;
	realm: string;
	region: string;
	level: number | null;
	characterClass: string | null;
	activeSpec: string | null;
	equipped: EquippedPiece[];
	/** Live character-sheet ratings when `/statistics` succeeded. */
	paperDoll?: ArmoryPaperDoll | null;
	notes: string[];
};

type BlizzardEquipmentResponse = {
	character?: { name?: string; id?: number };
	equipped_items?: Array<{
		item?: { id?: number };
		slot?: { type?: string; name?: string };
		name?: string;
		level?: { value?: number };
		quality?: { type?: string; name?: string };
		bonus_list?: number[];
		inventory_type?: { type?: string; name?: string };
		stats?: Array<{
			type?: { type?: string; name?: string };
			value?: number;
			is_negated?: boolean;
		}>;
	}>;
};

type BlizzardRatingBlock = {
	rating?: number;
	rating_bonus?: number;
	rating_normalized?: number;
	value?: number;
};

type BlizzardEffectiveStat = {
	base?: number;
	effective?: number;
};

type BlizzardStatisticsResponse = {
	strength?: BlizzardEffectiveStat;
	agility?: BlizzardEffectiveStat;
	intellect?: BlizzardEffectiveStat;
	mastery?: BlizzardRatingBlock;
	melee_crit?: BlizzardRatingBlock;
	ranged_crit?: BlizzardRatingBlock;
	spell_crit?: BlizzardRatingBlock;
	melee_haste?: BlizzardRatingBlock;
	ranged_haste?: BlizzardRatingBlock;
	spell_haste?: BlizzardRatingBlock;
	/** Raw versatility rating on the character sheet. */
	versatility?: number;
};

function combatStatsFromBlizzard(
	stats: NonNullable<NonNullable<BlizzardEquipmentResponse['equipped_items']>[number]['stats']>
): ArmoryCombatStats | undefined {
	const out: ArmoryCombatStats = {
		primary_stat: 0,
		crit: 0,
		haste: 0,
		mastery: 0,
		versatility: 0
	};
	for (const row of stats) {
		if (row.is_negated) continue;
		const t = (row.type?.type || '').toUpperCase();
		const v = Number(row.value) || 0;
		if (!v) continue;
		switch (t) {
			case 'INTELLECT':
			case 'STRENGTH':
			case 'AGILITY':
				out.primary_stat += v;
				break;
			case 'CRIT_RATING':
				out.crit += v;
				break;
			case 'HASTE_RATING':
				out.haste += v;
				break;
			case 'MASTERY':
			case 'MASTERY_RATING':
				out.mastery += v;
				break;
			case 'VERSATILITY':
				out.versatility += v;
				break;
			default:
				break;
		}
	}
	if (
		out.primary_stat === 0 &&
		out.crit === 0 &&
		out.haste === 0 &&
		out.mastery === 0 &&
		out.versatility === 0
	) {
		return undefined;
	}
	return out;
}

function ratingOf(block: BlizzardRatingBlock | undefined): number {
	if (!block) return 0;
	// Prefer raw combat rating (matches addon GetCombatRating). `value` is %.
	const rating = Number(block.rating);
	if (Number.isFinite(rating) && rating !== 0) return rating;
	const normalized = Number(block.rating_normalized);
	if (Number.isFinite(normalized) && normalized !== 0) return normalized;
	return 0;
}

function effectiveOf(stat: BlizzardEffectiveStat | undefined): number {
	const n = Number(stat?.effective);
	return Number.isFinite(n) ? n : 0;
}

function paperDollFromStatistics(stats: BlizzardStatisticsResponse): ArmoryPaperDoll | null {
	const strength = effectiveOf(stats.strength);
	const agility = effectiveOf(stats.agility);
	const intellect = effectiveOf(stats.intellect);
	const crit = Math.max(
		ratingOf(stats.melee_crit),
		ratingOf(stats.ranged_crit),
		ratingOf(stats.spell_crit)
	);
	const haste = Math.max(
		ratingOf(stats.melee_haste),
		ratingOf(stats.ranged_haste),
		ratingOf(stats.spell_haste)
	);
	const mastery = ratingOf(stats.mastery);
	const versatility = Number(stats.versatility) || 0;

	if (
		strength === 0 &&
		agility === 0 &&
		intellect === 0 &&
		crit === 0 &&
		haste === 0 &&
		mastery === 0 &&
		versatility === 0
	) {
		return null;
	}

	return { strength, agility, intellect, crit, haste, mastery, versatility };
}

type BlizzardSummaryResponse = {
	name?: string;
	level?: number;
	character_class?: { name?: string };
	active_spec?: { name?: string };
	realm?: { slug?: string; name?: string };
};

const ARMORY_REGIONS = new Set(['us', 'eu', 'kr', 'tw']);
const MAX_NAME_LEN = 32;
const MAX_REALM_LEN = 64;

export const GET: RequestHandler = async ({ url }) => {
	const name = url.searchParams.get('name');
	const region = url.searchParams.get('region');
	const realm = url.searchParams.get('realm');

	if (!name || !region || !realm) {
		return apiError('Missing parameters: name, region, realm', 400);
	}
	if (name.length > MAX_NAME_LEN || realm.length > MAX_REALM_LEN) {
		return apiError('Invalid character name or realm', 400);
	}

	const regionLc = region.toLowerCase();
	if (!ARMORY_REGIONS.has(regionLc)) {
		return apiError('Invalid region', 400);
	}
	const realmLc = realm.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
	const nameLc = name.toLowerCase();

	try {
		const token = await getOrRefreshBlizzardAccessToken();
		const ns = `profile-${regionLc}`;
		const base = `https://${encodeURIComponent(regionLc)}.api.blizzard.com/profile/wow/character/${encodeURIComponent(realmLc)}/${encodeURIComponent(nameLc)}`;
		const auth = { Authorization: `Bearer ${token}` };

		const summaryUrl = `${base}?namespace=${encodeURIComponent(ns)}&locale=en_US`;
		const equipUrl = `${base}/equipment?namespace=${encodeURIComponent(ns)}&locale=en_US`;
		const statsUrl = `${base}/statistics?namespace=${encodeURIComponent(ns)}&locale=en_US`;

		const [summaryRes, equipRes, statsRes] = await Promise.all([
			fetch(summaryUrl, { headers: auth }),
			fetch(equipUrl, { headers: auth }),
			fetch(statsUrl, { headers: auth })
		]);

		if (summaryRes.status === 404 || equipRes.status === 404) {
			return apiError('Character not found', 404);
		}
		if (!summaryRes.ok) {
			throw new Error(`Summary endpoint error: status ${summaryRes.status}`);
		}
		if (!equipRes.ok) {
			throw new Error(`Equipment endpoint error: status ${equipRes.status}`);
		}

		const summary = (await summaryRes.json()) as BlizzardSummaryResponse;
		const equipment = (await equipRes.json()) as BlizzardEquipmentResponse;

		let paperDoll: ArmoryPaperDoll | null = null;
		if (statsRes.ok) {
			const statistics = (await statsRes.json()) as BlizzardStatisticsResponse;
			paperDoll = paperDollFromStatistics(statistics);
		}

		const equipped: EquippedPiece[] = [];
		for (const row of equipment.equipped_items ?? []) {
			const itemId = row.item?.id;
			if (!itemId) continue;
			const slotType = row.slot?.type ?? 'UNKNOWN';
			equipped.push({
				slot: slotType,
				itemId,
				bonusIds: Array.isArray(row.bonus_list) ? row.bonus_list.map(Number) : [],
				itemLevel: Number(row.level?.value ?? 0) || 0,
				name: row.name ?? `Item ${itemId}`,
				quality: row.quality,
				inventoryType: row.inventory_type?.type,
				combatStats: row.stats?.length ? combatStatsFromBlizzard(row.stats) : undefined
			});
		}

		// Stable slot order for UI.
		equipped.sort((a, b) => {
			const ai = SLOT_TYPES.indexOf(a.slot as (typeof SLOT_TYPES)[number]);
			const bi = SLOT_TYPES.indexOf(b.slot as (typeof SLOT_TYPES)[number]);
			return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
		});

		const body: GearingCharacterResponse = {
			name: summary.name ?? name,
			realm: summary.realm?.name ?? realm,
			region: regionLc,
			level: summary.level ?? null,
			characterClass: summary.character_class?.name ?? null,
			activeSpec: summary.active_spec?.name ?? null,
			equipped,
			paperDoll,
			notes: []
		};

		return apiOk(body);
	} catch (error) {
		return handleApiError(
			'api/gearing/character',
			error,
			'Failed to fetch character equipment from Battle.net.',
			502
		);
	}
};
