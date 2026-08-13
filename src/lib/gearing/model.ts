/**
 * Browser forward pass for ModelData v6 / model-v6.json.
 * Mirrors simc-factory `addon_runtime.exported_forward` and addon Model.lua.
 *
 * Versioning: artifact path is `/gearing/model-{model_version}.json` with JSON field
 * `model_version`. `fetchModel` appends `?v=` for cache busting (see versions.ts).
 */

import { modelFetchUrl } from './versions';

export const STAT_NAMES = ['primary_stat', 'crit', 'haste', 'mastery', 'versatility'] as const;

export type StatName = (typeof STAT_NAMES)[number];

export type CombatStats = Record<StatName, number>;

export type ModelLayer = {
	w: number[][];
	bn_s: number[];
	bn_o: number[];
	/** Absent on layer 1 when prebaked per-spec biases are used. */
	b?: number[];
};

export type WebModelJson = {
	model_version: string;
	n_stat_features: number;
	stat_names: string[];
	spec_keys: string[];
	runtime: {
		fused_topology_eligible: boolean;
		hidden_dims: number[];
	};
	scaler: {
		x_mean: number[];
		x_scale: number[];
		y_mean: number;
		y_scale: number;
	};
	single_model: {
		layers: ModelLayer[];
		prebaked: Record<string, number[]>;
		output: { w: number[]; b: number };
	};
};

export type LoadedModel = {
	version: string;
	statNames: string[];
	specKeys: string[];
	xMean: number[];
	xScale: number[];
	yMean: number;
	yScale: number;
	layers: ModelLayer[];
	prebaked: Record<string, number[]>;
	outW: number[];
	outB: number;
};

export function emptyStats(): CombatStats {
	return {
		primary_stat: 0,
		crit: 0,
		haste: 0,
		mastery: 0,
		versatility: 0
	};
}

export function loadModelFromJson(raw: WebModelJson): LoadedModel {
	if (!raw?.single_model?.layers?.length) {
		throw new Error('Invalid model JSON: missing single_model.layers');
	}
	if (!raw.single_model.prebaked || Object.keys(raw.single_model.prebaked).length === 0) {
		throw new Error('Invalid model JSON: missing prebaked biases');
	}
	const statNames = raw.stat_names?.length ? raw.stat_names : [...STAT_NAMES];
	if (statNames.length !== 5) {
		throw new Error(`Expected 5 stat features, got ${statNames.length}`);
	}
	return {
		version: raw.model_version || 'v6',
		statNames,
		specKeys: raw.spec_keys?.length ? raw.spec_keys : Object.keys(raw.single_model.prebaked).sort(),
		xMean: raw.scaler.x_mean,
		xScale: raw.scaler.x_scale,
		yMean: raw.scaler.y_mean,
		yScale: raw.scaler.y_scale,
		layers: raw.single_model.layers,
		prebaked: raw.single_model.prebaked,
		outW: raw.single_model.output.w,
		outB: raw.single_model.output.b
	};
}

/** Fetch published model from static/gearing/model-vN.json (cache-busted). */
export async function fetchModel(url: string = modelFetchUrl()): Promise<LoadedModel> {
	const res = await fetch(url, { cache: 'default' });
	if (!res.ok) {
		throw new Error(`Failed to load model (${res.status}): ${url}`);
	}
	const raw = (await res.json()) as WebModelJson;
	return loadModelFromJson(raw);
}

/**
 * Hot path predictor: closed-over buffers, unrolled 5-stat L1 input.
 * Returns DPS from raw combat ratings (not CombatStats object).
 * When topology matches the addon fused path (2 hidden layers, L1 width 200),
 * {@link createSpecPredictor} returns the fused L1+L2 implementation.
 */
export type SpecPredictor = (
	primary: number,
	crit: number,
	haste: number,
	mastery: number,
	versatility: number
) => number;

/** Addon Model.lua fused-reference cache bounds. */
const MAX_FUSED_REFERENCES = 8;
const NEW_FUSED_REFERENCE_DISTANCE = 16;
const FUSED_L1_WIDTH = 200;

type FusedReference = {
	active: Uint8Array;
	c0: Float64Array;
	c1: Float64Array;
	c2: Float64Array;
	c3: Float64Array;
	c4: Float64Array;
	c5: Float64Array;
};

/** True when model matches addon fused topology (2×hidden, L1=200, L2←200). */
export function isFusedTopologyEligible(model: LoadedModel): boolean {
	const layers = model.layers;
	if (layers.length !== 2) return false;
	const l1 = layers[0]!;
	const l2 = layers[1]!;
	const n1 = l1.w.length;
	const n2 = l2.w.length;
	return (
		n1 === FUSED_L1_WIDTH &&
		n2 > 0 &&
		l1.w[0]?.length === 5 &&
		l2.w[0]?.length === n1 &&
		model.outW.length === n2 &&
		!!l2.b &&
		l2.b.length === n2
	);
}

function toF64(src: number[]): Float64Array {
	return Float64Array.from(src);
}

function flattenRows(rows: number[][], rowLen: number): Float64Array {
	const out = new Float64Array(rows.length * rowLen);
	for (let i = 0; i < rows.length; i++) {
		const row = rows[i]!;
		const base = i * rowLen;
		for (let j = 0; j < rowLen; j++) {
			out[base + j] = row[j]!;
		}
	}
	return out;
}

/**
 * Naive layered forward (mirrors addon `forwardModelStats` / exported_forward).
 * Exported for fused-vs-naive parity tests.
 */
export function createNaiveSpecPredictor(model: LoadedModel, specKey: string): SpecPredictor {
	const biasArr = model.prebaked[specKey];
	if (!biasArr) {
		throw new Error(`Unknown spec key: ${specKey}`);
	}
	const mean = model.xMean;
	const scale = model.xScale;
	const layer0 = model.layers[0]!;
	const n0 = layer0.w.length;
	const bias = toF64(biasArr);
	const w0 = flattenRows(layer0.w, 5);
	const bn0s = toF64(layer0.bn_s);
	const bn0o = toF64(layer0.bn_o);
	const h0 = new Float64Array(n0);

	const later: {
		w: Float64Array;
		b: Float64Array;
		bn_s: Float64Array;
		bn_o: Float64Array;
		h: Float64Array;
		n: number;
		inLen: number;
	}[] = [];
	let prevWidth = n0;
	for (let li = 1; li < model.layers.length; li++) {
		const layer = model.layers[li]!;
		const b = layer.b;
		if (!b || b.length !== layer.w.length) {
			throw new Error(`Layer ${li} missing bias vector`);
		}
		const n = layer.w.length;
		later.push({
			w: flattenRows(layer.w, prevWidth),
			b: toF64(b),
			bn_s: toF64(layer.bn_s),
			bn_o: toF64(layer.bn_o),
			h: new Float64Array(n),
			n,
			inLen: prevWidth
		});
		prevWidth = n;
	}
	const outW = toF64(model.outW);
	const outB = model.outB;
	const yScale = model.yScale;
	const yMean = model.yMean;

	return (primary, crit, haste, mastery, versatility) => {
		const x0 = (primary - mean[0]!) / scale[0]!;
		const x1 = (crit - mean[1]!) / scale[1]!;
		const x2 = (haste - mean[2]!) / scale[2]!;
		const x3 = (mastery - mean[3]!) / scale[3]!;
		const x4 = (versatility - mean[4]!) / scale[4]!;

		for (let i = 0; i < n0; i++) {
			const base = i * 5;
			let s =
				bias[i]! +
				w0[base]! * x0 +
				w0[base + 1]! * x1 +
				w0[base + 2]! * x2 +
				w0[base + 3]! * x3 +
				w0[base + 4]! * x4;
			h0[i] = bn0s[i]! * (s > 0 ? s : 0) + bn0o[i]!;
		}

		let prev: Float64Array = h0;
		for (let li = 0; li < later.length; li++) {
			const layer = later[li]!;
			const { w, b, bn_s, bn_o, h, n, inLen } = layer;
			for (let i = 0; i < n; i++) {
				const rowBase = i * inLen;
				let s = b[i]!;
				for (let j = 0; j < inLen; j++) {
					s += w[rowBase + j]! * prev[j]!;
				}
				h[i] = bn_s[i]! * (s > 0 ? s : 0) + bn_o[i]!;
			}
			prev = h;
		}

		let yScaled = outB;
		for (let i = 0; i < outW.length; i++) {
			yScaled += outW[i]! * prev[i]!;
		}
		return yScaled * yScale + yMean;
	};
}

/**
 * Fused L1+L2 forward matching addon `forwardModelStatsFused`.
 * Caches ReLU activity patterns; on hit L2 is affine in the 5 stats plus
 * small corrections for flipped neurons.
 */
export function createFusedSpecPredictor(model: LoadedModel, specKey: string): SpecPredictor {
	if (!isFusedTopologyEligible(model)) {
		throw new Error('Model topology is not fused-eligible');
	}
	const biasArr = model.prebaked[specKey];
	if (!biasArr) {
		throw new Error(`Unknown spec key: ${specKey}`);
	}

	const mean = model.xMean;
	const scale = model.xScale;
	const layer1 = model.layers[0]!;
	const layer2 = model.layers[1]!;
	const n1 = FUSED_L1_WIDTH;
	const n2 = layer2.w.length;

	const bias = toF64(biasArr);
	const w1 = flattenRows(layer1.w, 5);
	const bn1s = toF64(layer1.bn_s);
	const bn1o = toF64(layer1.bn_o);
	const w2 = flattenRows(layer2.w, n1);
	const b2 = toF64(layer2.b!);
	const bn2s = toF64(layer2.bn_s);
	const bn2o = toF64(layer2.bn_o);
	const outW = toF64(model.outW);
	const outB = model.outB;
	const yScale = model.yScale;
	const yMean = model.yMean;

	// invariantOffsets[i] = b2[i] + sum_j w2[i,j] * bn1o[j]
	const invariantOffsets = new Float64Array(n2);
	for (let i = 0; i < n2; i++) {
		const rowBase = i * n1;
		let value = b2[i]!;
		for (let j = 0; j < n1; j++) {
			value += w2[rowBase + j]! * bn1o[j]!;
		}
		invariantOffsets[i] = value;
	}

	const preactivation = new Float64Array(n1);
	const active = new Uint8Array(n1);
	const changedIndices = new Int32Array(n1);
	const changedValues = new Float64Array(n1);
	const references: FusedReference[] = [];

	const buildFusedReference = (activePattern: Uint8Array): FusedReference => {
		const c0 = new Float64Array(n2);
		const c1 = new Float64Array(n2);
		const c2 = new Float64Array(n2);
		const c3 = new Float64Array(n2);
		const c4 = new Float64Array(n2);
		const c5 = new Float64Array(n2);
		const activeCopy = new Uint8Array(activePattern);

		for (let oi = 0; oi < n2; oi++) {
			const rowBase = oi * n1;
			let biasTerm = invariantOffsets[oi]!;
			let wOut1 = 0;
			let wOut2 = 0;
			let wOut3 = 0;
			let wOut4 = 0;
			let wOut5 = 0;
			for (let ii = 0; ii < n1; ii++) {
				if (!activePattern[ii]) continue;
				const factor = w2[rowBase + ii]! * bn1s[ii]!;
				biasTerm += factor * bias[ii]!;
				const inBase = ii * 5;
				wOut1 += factor * w1[inBase]!;
				wOut2 += factor * w1[inBase + 1]!;
				wOut3 += factor * w1[inBase + 2]!;
				wOut4 += factor * w1[inBase + 3]!;
				wOut5 += factor * w1[inBase + 4]!;
			}
			c0[oi] = biasTerm;
			c1[oi] = wOut1;
			c2[oi] = wOut2;
			c3[oi] = wOut3;
			c4[oi] = wOut4;
			c5[oi] = wOut5;
		}

		return { active: activeCopy, c0, c1, c2, c3, c4, c5 };
	};

	return (primary, crit, haste, mastery, versatility) => {
		const x1 = (primary - mean[0]!) / scale[0]!;
		const x2 = (crit - mean[1]!) / scale[1]!;
		const x3 = (haste - mean[2]!) / scale[2]!;
		const x4 = (mastery - mean[3]!) / scale[3]!;
		const x5 = (versatility - mean[4]!) / scale[4]!;

		for (let i = 0; i < n1; i++) {
			const base = i * 5;
			const value =
				bias[i]! +
				w1[base]! * x1 +
				w1[base + 1]! * x2 +
				w1[base + 2]! * x3 +
				w1[base + 3]! * x4 +
				w1[base + 4]! * x5;
			preactivation[i] = value;
			active[i] = value > 0 ? 1 : 0;
		}

		let fused: FusedReference | undefined;
		let bestDistance: number | undefined;
		for (let r = 0; r < references.length; r++) {
			const reference = references[r]!;
			let distance = 0;
			const refActive = reference.active;
			for (let i = 0; i < n1; i++) {
				if (refActive[i] !== active[i]) distance++;
			}
			if (bestDistance === undefined || distance < bestDistance) {
				fused = reference;
				bestDistance = distance;
				if (distance === 0) break;
			}
		}

		if (
			!fused ||
			(bestDistance! > NEW_FUSED_REFERENCE_DISTANCE && references.length < MAX_FUSED_REFERENCES)
		) {
			fused = buildFusedReference(active);
			references.push(fused);
			bestDistance = 0;
		}

		let changedCount = 0;
		if (bestDistance! > 0) {
			const refActive = fused.active;
			for (let i = 0; i < n1; i++) {
				if (refActive[i] === active[i]) continue;
				changedIndices[changedCount] = i;
				const sign = active[i] ? 1 : -1;
				changedValues[changedCount] = sign * bn1s[i]! * preactivation[i]!;
				changedCount++;
			}
		}

		let yScaled = outB;
		for (let i = 0; i < n2; i++) {
			let value =
				fused.c0[i]! +
				fused.c1[i]! * x1 +
				fused.c2[i]! * x2 +
				fused.c3[i]! * x3 +
				fused.c4[i]! * x4 +
				fused.c5[i]! * x5;
			const rowBase = i * n1;
			for (let c = 0; c < changedCount; c++) {
				value += w2[rowBase + changedIndices[c]!]! * changedValues[c]!;
			}
			if (value <= 0) value = 0;
			const hidden = bn2s[i]! * value + bn2o[i]!;
			yScaled += outW[i]! * hidden;
		}
		return yScaled * yScale + yMean;
	};
}

/** Prefer fused L1+L2 when topology matches; otherwise naive layered forward. */
export function createSpecPredictor(model: LoadedModel, specKey: string): SpecPredictor {
	if (isFusedTopologyEligible(model)) {
		return createFusedSpecPredictor(model, specKey);
	}
	return createNaiveSpecPredictor(model, specKey);
}

/**
 * Forward pass matching Lua Model.lua / NumPy `exported_forward`.
 * Input is the five combat ratings; spec one-hot is baked into layer-1 bias.
 */
export function predictDps(
	model: LoadedModel,
	stats: Partial<CombatStats> | Record<string, number>,
	specKey: string
): number {
	const predict = createSpecPredictor(model, specKey);
	return predict(
		Number(stats.primary_stat ?? 0),
		Number(stats.crit ?? 0),
		Number(stats.haste ?? 0),
		Number(stats.mastery ?? 0),
		Number(stats.versatility ?? 0)
	);
}

/** ΔDPS when replacing equipped piece stats with candidate piece stats (same total base). */
export function compareItemDelta(
	model: LoadedModel,
	baseStats: CombatStats,
	equippedPiece: Partial<CombatStats>,
	candidatePiece: Partial<CombatStats>,
	specKey: string
): { baseDps: number; candidateDps: number; delta: number } {
	const withoutEquipped = applyDelta(baseStats, equippedPiece, -1);
	const withCandidate = applyDelta(withoutEquipped, candidatePiece, 1);
	const baseDps = predictDps(model, baseStats, specKey);
	const candidateDps = predictDps(model, withCandidate, specKey);
	return { baseDps, candidateDps, delta: candidateDps - baseDps };
}

export function applyDelta(
	base: CombatStats,
	piece: Partial<CombatStats>,
	sign: 1 | -1
): CombatStats {
	const out = { ...base };
	for (const name of STAT_NAMES) {
		out[name] = (out[name] ?? 0) + sign * (Number(piece[name] ?? 0) || 0);
	}
	return out;
}

export function formatDps(value: number): string {
	if (!Number.isFinite(value)) return '—';
	return Math.round(value).toLocaleString('en-US');
}

export function formatDelta(value: number): string {
	if (!Number.isFinite(value)) return '—';
	const rounded = Math.round(value);
	const sign = rounded > 0 ? '+' : '';
	return `${sign}${rounded.toLocaleString('en-US')}`;
}
