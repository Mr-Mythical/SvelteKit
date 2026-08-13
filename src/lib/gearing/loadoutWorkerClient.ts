/**
 * Run bag/season loadout search across a pool of Web Workers (multi-core).
 *
 * Prep (filter / weapon pairs / delta warm) runs once on the
 * main thread; workers only receive the plan and run the same DFS + predictor
 * as the addon. Falls back to cooperative main-thread search if Workers fail.
 */

import {
	buildComboCountParts,
	buildLoadoutSearchPlan,
	countLoadoutCombinations,
	searchBestBagLoadoutCooperative,
	type LoadoutSearchOpts,
	type LoadoutSearchPlan,
	type LoadoutSearchProgress,
	type LoadoutSearchResult
} from './loadout';
import type { LoadedModel } from './model';
import type { CharacterState } from './types';
import type {
	LoadoutWorkerControlAction,
	LoadoutWorkerRequest,
	LoadoutWorkerResponse
} from './loadoutWorkerTypes';
import { annotatePiecesFromItemDb } from './usable';
import type { ItemDbJson } from './itemDb';

export type LoadoutSearchSource = 'worker' | 'main';

export type LoadoutSearchOutcome = {
	result: LoadoutSearchResult;
	source: LoadoutSearchSource;
	/** Number of workers used for this search (1 for main-thread fallback). */
	workers: number;
};

export type { LoadoutSearchProgress };

/** Cap pool size — each worker clones model weights. */
const MAX_POOL_SIZE = 16;

let pool: Worker[] = [];
let workerFailed = false;
let nextId = 1;
let initPromise: Promise<boolean> | null = null;
let cachedModelVersion: string | null = null;

type PendingEntry = {
	resolve: (
		value: LoadoutSearchOutcome | { type: 'ready' } | { type: 'count'; count: number }
	) => void;
	reject: (reason?: unknown) => void;
	onProgress?: (progress: LoadoutSearchProgress) => void;
};

const pending = new Map<number, PendingEntry>();

function desiredPoolSize(): number {
	if (typeof navigator === 'undefined') return 1;
	const hc = navigator.hardwareConcurrency || 4;
	return Math.max(1, Math.min(hc, MAX_POOL_SIZE));
}

function attachWorkerHandlers(w: Worker): void {
	w.onmessage = (event: MessageEvent<LoadoutWorkerResponse>) => {
		const msg = event.data;
		const entry = pending.get(msg.id);
		if (!entry) return;
		if (msg.type === 'progress') {
			entry.onProgress?.(msg.progress);
			return;
		}
		pending.delete(msg.id);
		if (msg.type === 'ready') {
			entry.resolve({ type: 'ready' });
		} else if (msg.type === 'result') {
			entry.resolve({ result: msg.result, source: 'worker', workers: 1 });
		} else if (msg.type === 'countResult') {
			entry.resolve({ type: 'count', count: msg.count });
		} else {
			entry.reject(new Error(msg.error));
		}
	};
	w.onerror = () => {
		failPool('Loadout worker error');
	};
}

function failPool(reason: string): void {
	workerFailed = true;
	initPromise = null;
	cachedModelVersion = null;
	for (const [, entry] of pending) {
		entry.reject(new Error(reason));
	}
	pending.clear();
	for (const w of pool) {
		try {
			w.terminate();
		} catch {
			/* ignore */
		}
	}
	pool = [];
}

function ensurePool(): Worker[] | null {
	if (workerFailed || typeof Worker === 'undefined') return null;
	if (pool.length > 0) return pool;
	const size = desiredPoolSize();
	try {
		const created: Worker[] = [];
		for (let i = 0; i < size; i++) {
			const w = new Worker(new URL('./loadout.worker.ts', import.meta.url), {
				type: 'module'
			});
			attachWorkerHandlers(w);
			created.push(w);
		}
		pool = created;
		return pool;
	} catch {
		workerFailed = true;
		pool = [];
		return null;
	}
}

/**
 * Clone the model into every pool Worker once (call after fetchModel on /gearing).
 * Subsequent searches only send a search plan.
 */
export async function ensureLoadoutWorkerModel(model: LoadedModel): Promise<boolean> {
	if (workerFailed) return false;
	if (cachedModelVersion === model.version && pool.length > 0) return true;

	const workers = ensurePool();
	if (!workers) return false;

	if (initPromise) return initPromise;

	initPromise = (async () => {
		try {
			await Promise.all(
				workers.map(async (w) => {
					const id = nextId++;
					const request: LoadoutWorkerRequest = { type: 'init', id, model };
					await new Promise<{ type: 'ready' }>((resolve, reject) => {
						pending.set(id, {
							resolve: (v) => resolve(v as { type: 'ready' }),
							reject
						});
						w.postMessage(request);
					});
				})
			);
			cachedModelVersion = model.version;
			return true;
		} catch {
			cachedModelVersion = null;
			return false;
		} finally {
			initPromise = null;
		}
	})();

	return initPromise;
}

function mergeShardResults(parts: LoadoutSearchResult[]): LoadoutSearchResult {
	if (parts.length === 0) {
		return {
			baseDps: 0,
			bestDps: 0,
			delta: 0,
			combinationsChecked: 0,
			combinationsCapped: false,
			slotRows: [],
			warnings: ['No shard results']
		};
	}
	let best = parts[0]!;
	let checked = 0;
	let capped = false;
	let stopped = false;
	const warnings: string[] = [];
	for (const p of parts) {
		checked += p.combinationsChecked;
		capped = capped || p.combinationsCapped;
		stopped = stopped || Boolean(p.stopped);
		for (const w of p.warnings) {
			if (!warnings.includes(w)) warnings.push(w);
		}
		if (p.bestDps > best.bestDps + 1e-9) best = p;
	}
	return {
		baseDps: best.baseDps,
		bestDps: best.bestDps,
		delta: best.bestDps - best.baseDps,
		combinationsChecked: checked,
		combinationsCapped: capped,
		stopped: stopped || undefined,
		slotRows: best.slotRows,
		warnings: warnings.slice(0, 12)
	};
}

function broadcastWorkerControl(action: LoadoutWorkerControlAction): void {
	for (const w of pool) {
		try {
			const request: LoadoutWorkerRequest = { type: 'control', action };
			w.postMessage(request);
		} catch {
			/* ignore terminated workers */
		}
	}
}

/** Serializable shard opts — `control` is not structured-cloneable. */
function shardOptsWithoutControl(
	opts: Omit<LoadoutSearchOpts, 'onProgress' | 'itemDb'>
): Omit<LoadoutSearchOpts, 'onProgress' | 'itemDb' | 'control'> {
	const { control: _control, ...rest } = opts;
	return rest;
}

function prepareStateWithUsability(
	state: CharacterState,
	itemDb?: ItemDbJson | null
): CharacterState {
	if (!itemDb) return state;
	return {
		...state,
		bags: annotatePiecesFromItemDb(state.bags, itemDb),
		equipped: annotatePiecesFromItemDb(state.equipped, itemDb),
		vault: annotatePiecesFromItemDb(state.vault, itemDb)
	};
}

async function searchOnMainCooperative(
	model: LoadedModel,
	state: CharacterState,
	opts?: LoadoutSearchOpts
): Promise<LoadoutSearchOutcome> {
	const { itemDb, ...rest } = opts ?? {};
	const prepared = prepareStateWithUsability(state, itemDb);
	const result = await searchBestBagLoadoutCooperative(model, prepared, rest);
	return { result, source: 'main', workers: 1 };
}

async function searchOneShardPlan(
	w: Worker,
	plan: LoadoutSearchPlan,
	opts: Omit<LoadoutSearchOpts, 'onProgress' | 'itemDb'>,
	onProgress?: (progress: LoadoutSearchProgress) => void
): Promise<LoadoutSearchResult> {
	const id = nextId++;
	const request: LoadoutWorkerRequest = {
		type: 'searchPlan',
		id,
		plan,
		opts: shardOptsWithoutControl(opts)
	};
	const outcome = await new Promise<LoadoutSearchOutcome>((resolve, reject) => {
		pending.set(id, {
			resolve: (v) => {
				if ('result' in v) resolve(v);
				else reject(new Error('Unexpected worker ready during search'));
			},
			reject,
			onProgress
		});
		w.postMessage(request);
	});
	return outcome.result;
}

/**
 * Prefer multi-core Worker pool (model must be inited). Never blocks the UI.
 */
export async function searchBestBagLoadoutAsync(
	model: LoadedModel,
	state: CharacterState,
	opts?: LoadoutSearchOpts
): Promise<LoadoutSearchOutcome> {
	const ready = await ensureLoadoutWorkerModel(model);
	const workers = ready ? ensurePool() : null;
	const { itemDb, onProgress, ...rest } = opts ?? {};
	const preparedState = prepareStateWithUsability(state, itemDb);
	const mainOpts: LoadoutSearchOpts = { ...rest, onProgress };

	if (!workers || workers.length === 0 || cachedModelVersion !== model.version) {
		return searchOnMainCooperative(model, preparedState, mainOpts);
	}

	const shardCount = workers.length;
	const planOrEarly = buildLoadoutSearchPlan(model, preparedState, {
		...rest,
		shardCount
	});
	if (!('ok' in planOrEarly) || planOrEarly.ok !== true) {
		const early = planOrEarly as LoadoutSearchResult;
		onProgress?.({
			checked: 0,
			total: 0,
			maxCombinations: 0,
			baseDps: early.baseDps,
			bestDps: early.bestDps
		});
		return { result: early, source: 'worker', workers: shardCount };
	}
	const plan = planOrEarly;

	onProgress?.({
		checked: 0,
		total: plan.total,
		maxCombinations: plan.total,
		baseDps: plan.baseDps,
		bestDps: plan.baseDps
	});

	const checkedByShard = new Array<number>(shardCount).fill(0);
	const bestByShard = new Array<number>(shardCount).fill(plan.baseDps);
	let baseDps = plan.baseDps;
	let total = plan.total;
	let lastEmitMs = 0;

	const emitAggregated = (force = false) => {
		if (!onProgress) return;
		const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
		if (!force && now - lastEmitMs < 100) return;
		lastEmitMs = now;

		let checked = 0;
		let bestDps = Number.NEGATIVE_INFINITY;
		for (let i = 0; i < shardCount; i++) {
			checked += checkedByShard[i]!;
			if (bestByShard[i]! > bestDps) bestDps = bestByShard[i]!;
		}
		if (!Number.isFinite(bestDps)) bestDps = baseDps;
		onProgress({
			checked,
			total: Math.max(total, 1),
			maxCombinations: Math.max(total, 1),
			baseDps,
			bestDps
		});
	};

	const control = rest.control;
	let unsubControl: (() => void) | undefined;
	if (control) {
		const syncWorkers = () => {
			if (control.stopped) broadcastWorkerControl('stop');
			else if (control.paused) broadcastWorkerControl('pause');
			else broadcastWorkerControl('resume');
		};
		unsubControl = control.subscribe(syncWorkers);
		// Apply any state set before workers started (rare).
		if (control.stopped || control.paused) syncWorkers();
	}

	try {
		const parts = await Promise.all(
			workers.map((w, shardIndex) =>
				searchOneShardPlan(
					w,
					plan,
					{
						...rest,
						shardIndex,
						shardCount
					},
					(progress) => {
						checkedByShard[shardIndex] = progress.checked;
						bestByShard[shardIndex] = progress.bestDps;
						baseDps = progress.baseDps;
						if (progress.total > 0) total = progress.total;
						emitAggregated(progress.checked === 0);
					}
				)
			)
		);
		emitAggregated(true);
		return {
			result: mergeShardResults(parts),
			source: 'worker',
			workers: shardCount
		};
	} catch (err) {
		control?.stop();
		broadcastWorkerControl('stop');
		const fallback = await searchOnMainCooperative(model, preparedState, mainOpts);
		const reason = err instanceof Error ? err.message : 'unknown error';
		return {
			...fallback,
			result: {
				...fallback.result,
				warnings: [
					`Worker search failed (${reason}); fell back to main thread.`,
					...fallback.result.warnings
				]
			}
		};
	} finally {
		unsubControl?.();
	}
}

/**
 * Combo count (formula/DP, addon-parity). Sync and cheap — Worker only if needed
 * for the rare shared-key DFS fallback on a huge pool.
 */
export async function countLoadoutCombosAsync(
	state: CharacterState,
	opts?: { itemDb?: ItemDbJson | null; signal?: AbortSignal }
): Promise<number> {
	if (opts?.signal?.aborted) {
		throw new DOMException('Aborted', 'AbortError');
	}
	const prepared = prepareStateWithUsability(state, opts?.itemDb);
	const parts = buildComboCountParts(prepared, { itemDb: opts?.itemDb });
	if (!parts) return 0;
	return countLoadoutCombinations(parts.slotCandidates, parts.weaponPairs, parts.tierRules);
}

/** Terminate the shared pool (tests / page teardown). */
export function disposeLoadoutWorker(): void {
	for (const [, entry] of pending) {
		entry.reject(new Error('Loadout worker disposed'));
	}
	pending.clear();
	initPromise = null;
	cachedModelVersion = null;
	for (const w of pool) {
		try {
			w.terminate();
		} catch {
			/* ignore */
		}
	}
	pool = [];
}
