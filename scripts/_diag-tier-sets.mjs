import { readFileSync, writeFileSync } from 'fs';

const tier = JSON.parse(readFileSync('static/gearing/tier-sets-v1.json', 'utf8'));
const itemDb = JSON.parse(readFileSync('static/gearing/item-db-v1.json', 'utf8'));
const season = JSON.parse(readFileSync('static/gearing/season-loot-v1.json', 'utf8'));

const log = (...a) =>
	console.log(a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '));

function resolveItem(id) {
	const n = Number(id);
	const hit = itemDb.items?.[n] ?? itemDb.items?.[String(n)];
	return hit ? { id: n, ...hit } : null;
}

const piecesMap = tier.pieces || {};
const piecesSet = new Set(Object.keys(piecesMap).map(Number));
const seasonIds = new Set((season.items ?? []).map((i) => Number(i.itemId)));

// tokens for PRIEST
log('=== TOKENS WITH PRIEST ===');
for (const [tokId, tok] of Object.entries(tier.tokens)) {
	const pieces = tok.pieces || {};
	if (pieces.PRIEST != null) {
		log(
			JSON.stringify({
				tokenItemId: Number(tokId),
				family: tok.family,
				priestPiece: pieces.PRIEST,
				allClasses: Object.keys(pieces)
			})
		);
	}
}

log('\\n=== 3. Blind Oath in season-loot + item-db ===');
const blindSeason = (season.items || []).filter((i) => /blind\\s*oath/i.test(i.name || ''));
const blindDb = [];
for (const [k, v] of Object.entries(itemDb.items || {})) {
	if (v && /blind\\s*oath/i.test(v.name || ''))
		blindDb.push({ itemId: Number(k), name: v.name, equipLoc: v.equipLoc, inv: v.inv });
}
log('season Blind Oath count:', blindSeason.length);
for (const i of blindSeason) {
	log(
		JSON.stringify({
			itemId: i.itemId,
			name: i.name,
			equipLoc: i.equipLoc,
			inTierPieces: piecesSet.has(Number(i.itemId)),
			source: i.sourceLabel
		})
	);
}
log('item-db Blind Oath count:', blindDb.length);
for (const i of blindDb.slice(0, 50)) {
	log(
		JSON.stringify({
			...i,
			inTierPieces: piecesSet.has(i.itemId),
			inSeason: seasonIds.has(i.itemId)
		})
	);
}

log('\\n=== 4. Priest cloth tier-ish names in season-loot ===');
const patterns = [
	/blind\\s*oath/i,
	/confessor/i,
	/oracle/i,
	/dying\\s*star/i,
	/priest/i,
	/cassock/i,
	/pontificat/i
];
const seen = new Set();
for (const i of season.items || []) {
	const n = i.name || '';
	if (patterns.some((p) => p.test(n))) {
		if (seen.has(i.itemId)) continue;
		seen.add(i.itemId);
		const classes = i.classes || i.classRestriction || i.allowableClasses || i.classMask || null;
		log(
			JSON.stringify({
				itemId: i.itemId,
				name: n,
				equipLoc: i.equipLoc,
				classes,
				inTierPieces: piecesSet.has(Number(i.itemId)),
				source: i.sourceLabel,
				instance: i.instanceName
			})
		);
	}
}

// any season items with class restriction fields
log('\\n--- season items with class-like fields (sample) ---');
let classFieldCount = 0;
const classFieldNames = new Set();
for (const i of season.items || []) {
	for (const k of Object.keys(i)) {
		if (/class/i.test(k)) {
			classFieldNames.add(k);
			classFieldCount++;
		}
	}
}
log('class-like keys seen:', [...classFieldNames], 'occurrences', classFieldCount);

log('\\n=== 5. MAGE + WARRIOR same check ===');
for (const cls of ['MAGE', 'WARRIOR']) {
	log('\\n--- ' + cls + ' ---');
	const ids = [];
	for (const [id, meta] of Object.entries(piecesMap)) {
		if ((meta.matchKey || '').endsWith(':' + cls) || meta.classToken === cls) {
			ids.push({ itemId: Number(id), ...meta });
		}
	}
	// also from tokens
	for (const [tokId, tok] of Object.entries(tier.tokens)) {
		if (tok.pieces?.[cls] != null) {
			log('token', tokId, 'family', tok.family, 'piece', tok.pieces[cls]);
		}
	}
	for (const p of ids.sort((a, b) => a.itemId - b.itemId)) {
		const db = resolveItem(p.itemId);
		log(
			JSON.stringify({
				itemId: p.itemId,
				family: p.family,
				matchKey: p.matchKey,
				dbName: db?.name ?? null,
				inSeason: seasonIds.has(p.itemId),
				seasonName: (season.items || []).find((x) => Number(x.itemId) === p.itemId)?.name ?? null
			})
		);
	}
}

// Name clusters for mage/warrior in season that look tier-ish
log('\\n=== Season names that look like cloth/plate tier sets ===');
const setty = (season.items || []).filter((i) => {
	const n = i.name || '';
	return (
		/dying\\s*star|blind\\s*oath|voidspire|confessor|oracle|mageweave|warpborn|living\\s*weapon|ears\\s*of|crown\\s*of|mantle\\s*of.*raid|of the (oracle|confessor)/i.test(
			n
		) ||
		(/^(The |)|set/i.test(n) && false)
	);
});
// Better: group by name prefix before apostrophe possessive
const prefixes = new Map();
for (const i of season.items || []) {
	const m = (i.name || '').match(/^(.+?)(?:'s|s') /);
	if (!m) continue;
	const pref = m[1];
	if (!prefixes.has(pref)) prefixes.set(pref, []);
	prefixes.get(pref).push(i);
}
const big = [...prefixes.entries()]
	.filter(([, arr]) => arr.length >= 4)
	.sort((a, b) => b[1].length - a[1].length);
log('Possessive name families with >=4 pieces:');
for (const [pref, arr] of big.slice(0, 40)) {
	const locs = [...new Set(arr.map((x) => x.equipLoc))];
	const inTier = arr.filter((x) => piecesSet.has(Number(x.itemId))).length;
	log(
		JSON.stringify({
			family: pref,
			count: arr.length,
			equipLocs: locs,
			inTierPieces: inTier,
			sampleIds: arr.slice(0, 6).map((x) => x.itemId),
			sampleNames: arr.slice(0, 3).map((x) => x.name)
		})
	);
}

writeFileSync('check-output.txt', 'done');
