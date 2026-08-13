import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import fixtures from '../__fixtures__/forward-parity.json';
import {
	compareItemDelta,
	createFusedSpecPredictor,
	createNaiveSpecPredictor,
	createSpecPredictor,
	isFusedTopologyEligible,
	loadModelFromJson,
	predictDps,
	type CombatStats,
	type WebModelJson
} from '../model';

function loadShippedModel() {
	const path = resolve(process.cwd(), 'static/gearing/model-v6.json');
	const raw = JSON.parse(readFileSync(path, 'utf-8')) as WebModelJson;
	return loadModelFromJson(raw);
}

describe('gearing model forward pass', () => {
	const model = loadShippedModel();

	it('loads v6 contract with 5 stats and prebaked specs', () => {
		expect(model.version).toBe('v6');
		expect(model.statNames).toEqual(['primary_stat', 'crit', 'haste', 'mastery', 'versatility']);
		expect(model.specKeys.length).toBeGreaterThan(40);
		expect(model.layers).toHaveLength(2);
		expect(model.layers[0]!.w[0]).toHaveLength(5);
		expect(model.layers[0]!.b).toBeUndefined();
		expect(model.layers[1]!.b?.length).toBe(model.layers[1]!.w.length);
		expect(isFusedTopologyEligible(model)).toBe(true);
	});

	it.each(fixtures.cases)('matches addon_runtime.exported_forward for $name', (c) => {
		const got = predictDps(model, c.stats, c.spec_key);
		expect(got).toBeCloseTo(c.expected_dps, 4);
	});

	it('throws on unknown spec', () => {
		expect(() => predictDps(model, fixtures.cases[0]!.stats, 'MID1_Not_A_Real_Spec')).toThrow(
			/Unknown spec/
		);
	});

	it('compareItemDelta swaps piece stats correctly', () => {
		const base: CombatStats = {
			primary_stat: 1800,
			crit: 700,
			haste: 650,
			mastery: 800,
			versatility: 400
		};
		const equipped = { crit: 200, haste: 50 };
		const candidate = { crit: 280, haste: 40 };
		const { baseDps, candidateDps, delta } = compareItemDelta(
			model,
			base,
			equipped,
			candidate,
			'MID1_Mage_Frost'
		);
		expect(baseDps).toBeCloseTo(predictDps(model, base, 'MID1_Mage_Frost'), 6);
		const expectedStats: CombatStats = {
			...base,
			crit: base.crit - 200 + 280,
			haste: base.haste - 50 + 40
		};
		expect(candidateDps).toBeCloseTo(predictDps(model, expectedStats, 'MID1_Mage_Frost'), 6);
		expect(delta).toBeCloseTo(candidateDps - baseDps, 6);
	});

	it('fused matches naive on random vectors for first spec (≤1e-4 relative)', () => {
		expect(isFusedTopologyEligible(model)).toBe(true);
		const specKey = model.specKeys[0]!;
		const fused = createFusedSpecPredictor(model, specKey);
		const naive = createNaiveSpecPredictor(model, specKey);
		const defaultPred = createSpecPredictor(model, specKey);

		// Deterministic PRNG (mulberry32)
		let seed = 0xc0ffee;
		const rand = () => {
			seed |= 0;
			seed = (seed + 0x6d2b79f5) | 0;
			let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
		const randStat = (lo: number, hi: number) => lo + rand() * (hi - lo);

		for (let i = 0; i < 50; i++) {
			const p = randStat(800, 3500);
			const c = randStat(200, 1500);
			const h = randStat(200, 1500);
			const m = randStat(200, 1500);
			const v = randStat(100, 1200);
			const a = fused(p, c, h, m, v);
			const b = naive(p, c, h, m, v);
			const d = defaultPred(p, c, h, m, v);
			const denom = Math.max(Math.abs(b), 1);
			expect(Math.abs(a - b) / denom).toBeLessThanOrEqual(1e-4);
			expect(Math.abs(d - b) / denom).toBeLessThanOrEqual(1e-4);
		}
	});
});
