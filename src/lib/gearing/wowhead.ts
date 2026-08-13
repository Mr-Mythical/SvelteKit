/**
 * Build Wowhead item URLs / data-wowhead attrs for GearPiece previews.
 * Works with the global tooltips.js loaded in app.html.
 */

import type { GearPiece } from './types';

export type WowheadItemRef = {
	itemId: number;
	bonusIds?: number[];
	ilvl?: number;
	name?: string;
};

/** Pull bonus IDs from `item:123:1,2,3` or a truncated WoW item link when present. */
export function bonusIdsFromLink(link: string | undefined | null): number[] {
	if (!link) return [];
	const compact = link.match(/^item:(\d+)(?::([\d,:]+))?$/i);
	if (compact) {
		const rest = compact[2];
		if (!rest) return [];
		return rest
			.split(/[,:]/)
			.map((p) => Number(p))
			.filter((n) => Number.isFinite(n) && n > 0);
	}
	// |Hitem:itemID:enchant:gem1:gem2:gem3:gem4:suffix:unique:linkLevel:specialty:upgrade:instanceDifficulty:numBonusIDs:bonusID1:...
	const wow = link.match(/\|Hitem:(\d+)(?::([^|]*))?\|h/i);
	if (wow?.[2]) {
		const parts = wow[2].split(':');
		// bonus count is typically at index 12 (0-based after itemId already stripped)
		const countIdx = 12;
		const count = Number(parts[countIdx] ?? 0);
		if (Number.isFinite(count) && count > 0 && count < 64) {
			const out: number[] = [];
			for (let i = 0; i < count; i++) {
				const n = Number(parts[countIdx + 1 + i]);
				if (Number.isFinite(n) && n > 0) out.push(n);
			}
			return out;
		}
	}
	return [];
}

export function wowheadItemRefFromPiece(
	piece: Pick<GearPiece, 'itemId' | 'link' | 'ilvl' | 'name'>
): WowheadItemRef | null {
	const itemId = Number(piece.itemId);
	if (!Number.isFinite(itemId) || itemId <= 0) return null;
	const bonusIds = bonusIdsFromLink(piece.link);
	return {
		itemId,
		bonusIds: bonusIds.length ? bonusIds : undefined,
		ilvl: piece.ilvl,
		name: piece.name
	};
}

export function wowheadItemHref(ref: WowheadItemRef): string {
	const params = new URLSearchParams();
	if (ref.bonusIds?.length) params.set('bonus', ref.bonusIds.join(':'));
	if (ref.ilvl && ref.ilvl > 0) params.set('ilvl', String(Math.round(ref.ilvl)));
	const qs = params.toString();
	return `https://www.wowhead.com/item=${ref.itemId}${qs ? `&${qs}` : ''}`;
}

/** data-wowhead attribute value for power/tooltips.js */
export function wowheadItemDataAttr(ref: WowheadItemRef): string {
	const parts = [`item=${ref.itemId}`];
	if (ref.bonusIds?.length) parts.push(`bonus=${ref.bonusIds.join(':')}`);
	if (ref.ilvl && ref.ilvl > 0) parts.push(`ilvl=${Math.round(ref.ilvl)}`);
	return parts.join('&');
}

const iconNameCache = new Map<number, string>();
const tooltipCache = new Map<number, string>();

export type ItemPreview = { icon: string; tooltip?: string; name?: string };

const previewInflight = new Map<number, Promise<ItemPreview | null>>();

/** Wowhead CDN icon JPG (large). */
export function wowheadIconJpgUrl(iconName: string): string {
	const safe = iconName.replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
	return `https://wow.zamimg.com/images/wow/icons/large/${safe || 'inv_misc_questionmark'}.jpg`;
}

/**
 * Resolve icon (+ optional tooltip HTML) via same-origin API (cached).
 */
export async function resolveItemPreview(itemId: number): Promise<ItemPreview | null> {
	if (!Number.isFinite(itemId) || itemId <= 0) return null;
	const cachedIcon = iconNameCache.get(itemId);
	const cachedTip = tooltipCache.get(itemId);
	// Only reuse cache when we have already stored a tooltip entry (may be '').
	if (cachedIcon && cachedTip !== undefined) {
		return { icon: cachedIcon, tooltip: cachedTip || undefined };
	}
	const pending = previewInflight.get(itemId);
	if (pending) return pending;

	const job = (async (): Promise<ItemPreview | null> => {
		try {
			const res = await fetch(`/api/gearing/item-icon/${itemId}?v=2`);
			if (!res.ok) return null;
			const data = (await res.json()) as { icon?: string; tooltip?: string; name?: string };
			const icon = typeof data.icon === 'string' ? data.icon.trim() : '';
			if (!icon) return null;
			iconNameCache.set(itemId, icon);
			const tip = typeof data.tooltip === 'string' ? data.tooltip : '';
			tooltipCache.set(itemId, tip);
			return { icon, tooltip: tip || undefined, name: data.name };
		} catch {
			return null;
		} finally {
			previewInflight.delete(itemId);
		}
	})();
	previewInflight.set(itemId, job);
	return job;
}

/** Resolve an item icon via same-origin API (cached). */
export async function resolveItemIconName(itemId: number): Promise<string | null> {
	const preview = await resolveItemPreview(itemId);
	return preview?.icon ?? null;
}

/**
 * Resolve an item's icon file name via Wowhead's tooltip endpoint (cached).
 * Prefer {@link resolveItemIconName} in the browser (avoids CORS).
 */
export async function resolveWowheadIconName(itemId: number): Promise<string | null> {
	return resolveItemIconName(itemId);
}

export function refreshWowheadLinks(): void {
	if (typeof window === 'undefined') return;
	const w = window as Window & {
		$WowheadPower?: { refreshLinks?: () => void };
		WH?: { refreshLinks?: () => void };
		whTooltips?: Record<string, unknown>;
	};
	if (w.whTooltips) {
		w.whTooltips = { ...w.whTooltips, iconizeLinks: false };
	}
	try {
		w.$WowheadPower?.refreshLinks?.();
		w.WH?.refreshLinks?.();
	} catch {
		/* ignore */
	}
}
