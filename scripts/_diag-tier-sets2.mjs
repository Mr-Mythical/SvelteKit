import { readFileSync } from 'fs';
const itemDb = JSON.parse(readFileSync('static/gearing/item-db-v1.json', 'utf8'));
const season = JSON.parse(readFileSync('static/gearing/season-loot-v1.json', 'utf8'));
const tier = JSON.parse(readFileSync('static/gearing/tier-sets-v1.json', 'utf8'));

const needles = [
	/blind/i,
	/oath/i,
	/confessor/i,
	/oracle/i,
	/voidspire/i,
	/nullcore/i,
	/riftbloom/i,
	/dying star/i,
	/augur/i,
	/living weapon/i,
	/midnight herald/i
];

console.log('=== item-db name hits ===');
const hits = [];
for (const [k, v] of Object.entries(itemDb.items || {})) {
	const n = v?.name || '';
	if (needles.some((p) => p.test(n))) hits.push({ id: Number(k), name: n, equipLoc: v.equipLoc });
}
for (const h of hits.sort((a, b) => a.id - b.id)) console.log(JSON.stringify(h));
console.log('total hits', hits.length);

console.log('\\n=== season Voidspire / tier sources ===');
const byInst = new Map();
for (const i of season.items || []) {
	const key = i.instanceName || i.sourceLabel || '?';
	byInst.set(key, (byInst.get(key) || 0) + 1);
}
console.log(
	[...byInst.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 25)
		.map(([k, v]) => k + ': ' + v)
		.join('\\n')
);

console.log('\\n=== season items from Voidspire ===');
for (const i of season.items || []) {
	if (
		/voidspire|tier/i.test((i.instanceName || '') + (i.sourceLabel || '') + (i.encounterName || ''))
	) {
		console.log(
			JSON.stringify({ id: i.itemId, name: i.name, equipLoc: i.equipLoc, src: i.sourceLabel })
		);
	}
}

console.log('\\n=== all class matchKeys in tier pieces ===');
const byClass = {};
for (const [id, m] of Object.entries(tier.pieces || {})) {
	const cls = (m.matchKey || '').split(':')[1] || m.classToken || '?';
	const fam = m.family;
	byClass[cls] = byClass[cls] || {};
	byClass[cls][fam] = byClass[cls][fam] || [];
	byClass[cls][fam].push(Number(id));
}
console.log(JSON.stringify(byClass, null, 2));
