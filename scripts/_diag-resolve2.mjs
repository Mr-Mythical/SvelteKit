import { readFileSync } from 'fs';
const db = JSON.parse(readFileSync('static/gearing/item-db-v1.json', 'utf8'));

const INV = {
	HEAD: 1,
	NECK: 2,
	SHOULDERS: 3,
	CHEST: 5,
	WAIST: 6,
	LEGS: 7,
	FEET: 8,
	WRISTS: 9,
	HANDS: 10,
	FINGER: 11,
	TRINKET: 12,
	WEAPON: 13,
	SHIELD: 14,
	CLOAK: 16,
	WEAPON_2H: 17,
	ROBE: 20,
	WEAPON_MH: 21,
	WEAPON_OH: 22,
	HOLDABLE: 23
};
function randomSuffixType(itemClass, itemSubclass, inv) {
	if (itemClass === 2) {
		if ([1, 2, 3, 5, 6, 8, 10, 16, 18].includes(itemSubclass) || inv === INV.WEAPON_2H) return 0;
		return 3;
	}
	if (itemClass === 4) {
		switch (inv) {
			case INV.HEAD:
			case INV.CHEST:
			case INV.LEGS:
			case INV.ROBE:
				return 0;
			case INV.SHOULDERS:
			case INV.WAIST:
			case INV.FEET:
			case INV.HANDS:
			case INV.TRINKET:
				return 1;
			case INV.NECK:
			case INV.FINGER:
			case INV.CLOAK:
			case INV.WRISTS:
				return 2;
			case INV.WEAPON_OH:
			case INV.HOLDABLE:
			case INV.SHIELD:
				return 3;
			default:
				return -1;
		}
	}
	return -1;
}
function budgetFor(scale, quality, ilevel, slotType) {
	if (slotType < 0 || ilevel < scale.ilevelMin || ilevel > scale.ilevelMax) return 0;
	const idx = ilevel - scale.ilevelMin;
	const table =
		quality === 5
			? scale.legendary
			: quality === 4
				? scale.epic
				: quality === 3
					? scale.rare
					: quality === 2
						? scale.uncommon
						: scale.epic;
	const row = table?.[idx];
	return row?.[slotType] ?? 0;
}
function bankRound(v) {
	return Math.floor(v + 0.5);
}
const RATING_MODS = { 32: 1, 36: 1, 40: 1, 49: 1 };
const PRIMARY = {
	3: 'agility',
	4: 'strength',
	5: 'intellect',
	71: 'agility',
	72: 'strength',
	73: 'agility',
	74: 'strength'
};

function resolve(entry, itemLevel) {
	const slotType = randomSuffixType(entry.itemClass, entry.itemSubclass, entry.inv);
	let budget = budgetFor(db.scale, entry.quality, itemLevel, slotType);
	const stats = { primary_stat: 0, crit: 0, haste: 0, mastery: 0, versatility: 0 };
	const primary = { agility: 0, strength: 0, intellect: 0 };
	for (const [mod, alloc] of entry.stats || []) {
		const raw = alloc * budget * 0.0001;
		let value = raw;
		if (RATING_MODS[mod]) value = raw; // skip cr for simplicity first
		value = bankRound(value);
		if (mod === 32) stats.crit += value;
		else if (mod === 36) stats.haste += value;
		else if (mod === 40) stats.mastery += value;
		else if (mod === 49) stats.versatility += value;
		else if (PRIMARY[mod]) {
			primary[PRIMARY[mod] === PRIMARY[mod] ? PRIMARY[mod] : 'intellect'];
			stats.primary_stat += value;
		} else if ([3, 4, 5, 71, 72, 73, 74].includes(mod)) stats.primary_stat += value;
	}
	return { slotType, budget, stats, itemLevel };
}

// Probe: sample armor/weapon at entry.level (often <180) and at 246
const ids = [133501, 50233, 190124, 273873, 186287];
for (const id of ids) {
	const e = db.items[String(id)];
	const atStored = resolve(e, e.level);
	const at246 = resolve(e, 246);
	const at179 = resolve(e, 179);
	const at321 = resolve(e, 321);
	console.log(
		JSON.stringify({
			id,
			name: e.name,
			q: e.quality,
			storedLvl: e.level,
			equipLoc: e.equipLoc,
			atStored,
			at246: { budget: at246.budget, stats: at246.stats },
			at179: { budget: at179.budget, stats: at179.stats },
			at321: { budget: at321.budget, stats: at321.stats }
		})
	);
}

// Count how many items have stored level outside scale range
let below = 0,
	above = 0,
	inRange = 0;
for (const e of Object.values(db.items)) {
	if (e.level < db.scale.ilevelMin) below++;
	else if (e.level > db.scale.ilevelMax) above++;
	else inRange++;
}
console.log('ilevel distribution vs scale', {
	below,
	inRange,
	above,
	min: db.scale.ilevelMin,
	max: db.scale.ilevelMax
});

// Quality tables present?
console.log(
	'tables',
	Object.keys(db.scale).filter((k) => Array.isArray(db.scale[k]))
);
