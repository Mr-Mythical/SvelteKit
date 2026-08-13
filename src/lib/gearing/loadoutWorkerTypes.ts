import type {
	ComboCountParts,
	LoadoutSearchOpts,
	LoadoutSearchPlan,
	LoadoutSearchProgress,
	LoadoutSearchResult
} from './loadout';
import type { LoadedModel } from './model';

export type LoadoutWorkerControlAction = 'pause' | 'resume' | 'stop';

export type LoadoutWorkerRequest =
	| { type: 'init'; id: number; model: LoadedModel }
	| {
			type: 'searchPlan';
			id: number;
			plan: LoadoutSearchPlan;
			/** itemDb/state/control never sent — plan is built on the main thread. */
			opts?: Omit<LoadoutSearchOpts, 'onProgress' | 'itemDb' | 'control'>;
	  }
	| { type: 'countCombos'; id: number; parts: ComboCountParts }
	| { type: 'control'; action: LoadoutWorkerControlAction };

export type LoadoutWorkerResponse =
	| { type: 'ready'; id: number }
	| { type: 'progress'; id: number; progress: LoadoutSearchProgress }
	| { type: 'result'; id: number; result: LoadoutSearchResult }
	| { type: 'countResult'; id: number; count: number }
	| { type: 'error'; id: number; error: string };
