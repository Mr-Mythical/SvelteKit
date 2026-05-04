import type { RequestHandler } from './$types';
import { getUserRecents, addUserRecent, type CharacterRecentData } from '$lib/db/userRecents.js';
import { apiError, apiOk } from '$lib/server/apiResponses';
import { requireSession } from '$lib/server/requireSession';
import { handleApiError } from '$lib/server/logger';
import { parseJsonBody, parseRecentCharacterBody } from '$lib/server/requestBody';
import { getOrRefreshBlizzardAccessToken } from '$lib/auth/blizzardTokenCache';

const MIN_CHARACTER_LEVEL = 90;

function normalizeIdentityPart(value: string): string {
	return value.trim().toLowerCase();
}

function recentCharacterIdentity(region: string, realm: string, characterName: string): string {
	return `${normalizeIdentityPart(region)}::${normalizeIdentityPart(realm)}::${normalizeIdentityPart(characterName)}`;
}

function normalizeRegion(value: string): string {
	return normalizeIdentityPart(value);
}

function normalizeRealm(value: string): string {
	return normalizeIdentityPart(value);
}

function normalizeCharacterName(value: string): string {
	return value.trim();
}

async function fetchCharacterLevel(
	region: string,
	realm: string,
	characterName: string
): Promise<{ level: number; className: string | null } | null> {
	const regionLc = region.toLowerCase();
	const realmLc = realm.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
	const nameLc = characterName.toLowerCase();

	const token = await getOrRefreshBlizzardAccessToken();
	const summaryUrl = `https://${encodeURIComponent(regionLc)}.api.blizzard.com/profile/wow/character/${encodeURIComponent(realmLc)}/${encodeURIComponent(nameLc)}?namespace=profile-${encodeURIComponent(regionLc)}&locale=en_US`;
	const summaryResponse = await fetch(summaryUrl, {
		headers: { Authorization: `Bearer ${token}` }
	});

	if (!summaryResponse.ok) return null;

	const summaryData = (await summaryResponse.json()) as {
		level?: number;
		character_class?: { name?: string };
	};
	if (typeof summaryData.level !== 'number') return null;
	return {
		level: summaryData.level,
		className: typeof summaryData.character_class?.name === 'string' ? summaryData.character_class.name : null
	};
}

export const GET: RequestHandler = async ({ locals }) => {
	const auth = await requireSession(locals);
	if ('response' in auth) return auth.response;

	try {
		const recentCharacters = await getUserRecents<CharacterRecentData>(
			auth.session.user.id,
			'character',
			6
		);

		const dedupedByIdentity = new Map<string, CharacterRecentData>();
		for (const recent of recentCharacters) {
			const region = normalizeRegion(recent.entityData.region);
			const realm = normalizeRealm(recent.entityData.realm);
			const characterName = normalizeCharacterName(recent.entityData.characterName);
			const className =
				typeof recent.entityData.className === 'string' ? recent.entityData.className : null;
			const identity = recentCharacterIdentity(region, realm, characterName);
			if (!dedupedByIdentity.has(identity)) {
				dedupedByIdentity.set(identity, { region, realm, characterName, className });
			}
		}

		const characters = Array.from(dedupedByIdentity.values());

		return apiOk(characters);
	} catch (error) {
		return handleApiError('api/recent-characters', error, 'Failed to fetch recent characters');
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const auth = await requireSession(locals);
	if ('response' in auth) return auth.response;

	try {
		const parsed = await parseJsonBody(request, parseRecentCharacterBody);
		if (parsed instanceof Response) return parsed;
		const characterName = normalizeCharacterName(parsed.characterName);
		const realm = normalizeRealm(parsed.realm);
		const region = normalizeRegion(parsed.region);

		const profile = await fetchCharacterLevel(region, realm, characterName);
		if (profile === null) {
			return apiError('Unable to verify character level', 502);
		}
		if (profile.level < MIN_CHARACTER_LEVEL) {
			return apiError('Only endgame characters can be saved', 422);
		}

		await addUserRecent(
			auth.session.user.id,
			'character',
			recentCharacterIdentity(region, realm, characterName),
			{
				characterName,
				realm,
				region,
				className: profile.className
			},
			characterName,
			`${realm} - ${region}`,
			{
				class: profile.className,
				level: profile.level,
				timestamp: Date.now()
			}
		);

		return apiOk({ success: true });
	} catch (error) {
		return handleApiError('api/recent-characters', error, 'Failed to add character');
	}
};
