/**
 * Great Vault ranking from addon export pieces (single-swap vs equipped).
 * Mirrors VaultAdvisor scoring: best ΔDPS among scorable (non-trinket) options.
 */

import { compareItemDelta, type LoadedModel } from './model';
import { isTrinketEquipLoc, SLOT_ID_LABELS, slotsForEquipLoc } from './slots';
import type { CharacterState, GearPiece } from './types';
import type { ItemDbJson } from './itemDb';
import { annotatePieceFromItemDb, slotCanUseCandidate } from './usable';

export type VaultRankRow = {
	piece: GearPiece;
	slotId: number;
	slotLabel: string;
	equipped: GearPiece | null;
	baseDps: number;
	candidateDps: number;
	delta: number;
	skipped?: string;
};

export type VaultRankResult = {
	rows: VaultRankRow[];
	trinketCount: number;
	warnings: string[];
	emptyReason?: string;
};

function equippedForSlot(state: CharacterState, slotId: number): GearPiece | null {
	return state.equipped.find((p) => p.slotId === slotId) ?? null;
}

function bestSlotForVaultPiece(
	piece: GearPiece,
	state: CharacterState,
	model: LoadedModel,
	profileKey: string
): VaultRankRow | null {
	const slots = slotsForEquipLoc(piece.equipLoc);
	if (!slots.length) return null;

	let best: VaultRankRow | null = null;
	for (const slotId of slots) {
		if (!slotCanUseCandidate(slotId, piece, profileKey)) continue;
		const equipped = equippedForSlot(state, slotId);
		const cmp = compareItemDelta(
			model,
			state.stats,
			equipped?.stats ?? {},
			piece.stats,
			profileKey
		);
		const row: VaultRankRow = {
			piece,
			slotId,
			slotLabel: SLOT_ID_LABELS[slotId] ?? String(slotId),
			equipped,
			baseDps: cmp.baseDps,
			candidateDps: cmp.candidateDps,
			delta: cmp.delta
		};
		if (!best || row.delta > best.delta) best = row;
	}
	return best;
}

export function rankVaultOptions(
	model: LoadedModel,
	state: CharacterState,
	opts?: { itemDb?: ItemDbJson }
): VaultRankResult {
	const warnings: string[] = [];
	const profileKey = state.profileKey;

	if (!state.vault.length) {
		return {
			rows: [],
			trinketCount: 0,
			warnings,
			emptyReason:
				state.exportMeta?.vaultNote ||
				'No Great Vault options in this export. Open the vault in-game, then run /mrdps export again.'
		};
	}

	if (!profileKey || !model.prebaked[profileKey]) {
		return {
			rows: [],
			trinketCount: 0,
			warnings: ['Select a trained spec profile before ranking vault options.'],
			emptyReason: 'Missing spec profile.'
		};
	}

	const rows: VaultRankRow[] = [];
	let trinketCount = 0;
	let skippedUnusable = 0;

	for (const raw of state.vault) {
		if (isTrinketEquipLoc(raw.equipLoc)) {
			trinketCount += 1;
			continue;
		}
		const piece = annotatePieceFromItemDb(raw, opts?.itemDb);
		const ranked = bestSlotForVaultPiece(piece, state, model, profileKey);
		if (!ranked) {
			skippedUnusable += 1;
			continue;
		}
		rows.push(ranked);
	}

	rows.sort((a, b) => b.delta - a.delta);

	if (trinketCount > 0) {
		warnings.push(
			`${trinketCount} vault trinket${trinketCount === 1 ? '' : 's'} skipped (estimator does not model trinkets).`
		);
	}
	if (skippedUnusable > 0) {
		warnings.push(`Skipped ${skippedUnusable} vault item(s) unusable for this class/spec.`);
	}

	if (rows.length === 0) {
		return {
			rows,
			trinketCount,
			warnings,
			emptyReason:
				trinketCount > 0
					? 'Only trinket vault rewards were present — nothing to score.'
					: 'No scorable vault rewards in this export.'
		};
	}

	return { rows, trinketCount, warnings };
}
