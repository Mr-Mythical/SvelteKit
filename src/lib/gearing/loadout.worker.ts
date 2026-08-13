/**
 * Web Worker entry for bag/season loadout search (one of a multi-core pool).
 * Model is cached via `init`. Searches receive a pre-built plan from the main
 * thread (candidates already filtered/pruned) so workers only run DFS + predict.
 *
 * Searches are cooperative (async) so pause/resume/stop control messages can be
 * handled mid-run via the worker message loop.
 */

import {
	countLoadoutCombinations,
	LoadoutSearchControl,
	searchBestBagLoadoutFromPlanCooperative
} from './loadout';
import type { LoadedModel } from './model';
import type { LoadoutWorkerRequest, LoadoutWorkerResponse } from './loadoutWorkerTypes';

let cachedModel: LoadedModel | null = null;
/** Active search control — pause/resume/stop messages update this. */
let activeControl: LoadoutSearchControl | null = null;
/** Control that arrived before the search loop created `activeControl`. */
let pendingControlAction: 'pause' | 'resume' | 'stop' | null = null;

function applyControlAction(
	control: LoadoutSearchControl,
	action: 'pause' | 'resume' | 'stop'
): void {
	if (action === 'pause') control.pause();
	else if (action === 'resume') control.resume();
	else if (action === 'stop') control.stop();
}

self.onmessage = async (event: MessageEvent<LoadoutWorkerRequest>) => {
	const msg = event.data;
	if (!msg) return;

	if (msg.type === 'control') {
		if (activeControl) applyControlAction(activeControl, msg.action);
		else pendingControlAction = msg.action;
		return;
	}

	if (msg.type === 'init') {
		cachedModel = msg.model;
		const response: LoadoutWorkerResponse = { type: 'ready', id: msg.id };
		self.postMessage(response);
		return;
	}

	if (msg.type === 'countCombos') {
		try {
			const count = countLoadoutCombinations(
				msg.parts.slotCandidates,
				msg.parts.weaponPairs,
				msg.parts.tierRules
			);
			const response: LoadoutWorkerResponse = { type: 'countResult', id: msg.id, count };
			self.postMessage(response);
		} catch (err) {
			const response: LoadoutWorkerResponse = {
				type: 'error',
				id: msg.id,
				error: err instanceof Error ? err.message : 'Combo count failed'
			};
			self.postMessage(response);
		}
		return;
	}

	if (msg.type !== 'searchPlan') return;

	const control = new LoadoutSearchControl();
	activeControl = control;
	if (pendingControlAction) {
		applyControlAction(control, pendingControlAction);
		pendingControlAction = null;
	}
	try {
		if (!cachedModel) {
			throw new Error('Loadout worker model not initialized');
		}
		const result = await searchBestBagLoadoutFromPlanCooperative(cachedModel, msg.plan, {
			...msg.opts,
			control,
			onProgress: (progress) => {
				const response: LoadoutWorkerResponse = {
					type: 'progress',
					id: msg.id,
					progress
				};
				self.postMessage(response);
			}
		});
		const response: LoadoutWorkerResponse = { type: 'result', id: msg.id, result };
		self.postMessage(response);
	} catch (err) {
		const response: LoadoutWorkerResponse = {
			type: 'error',
			id: msg.id,
			error: err instanceof Error ? err.message : 'Loadout search failed'
		};
		self.postMessage(response);
	} finally {
		if (activeControl === control) activeControl = null;
		// Drop stale pause/stop so the next search starts clean.
		pendingControlAction = null;
	}
};
