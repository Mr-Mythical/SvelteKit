import { readFileSync } from 'fs';
const db = JSON.parse(readFileSync('static/gearing/item-db-v1.json', 'utf8'));

let over = null,
	under = null,
	overArmor = null;
for (const [id, e] of Object.entries(db.items)) {
	if (!over && e.level > 320)
		over = {
			id: Number(id),
			name: e.name,
			level: e.level,
			q: e.quality,
			equipLoc: e.equipLoc,
			itemClass: e.itemClass,
			stats: e.stats
		};
	if (!overArmor && e.level > 320 && e.itemClass === 4 && e.equipLoc === 'INVTYPE_HEAD')
		overArmor = {
			id: Number(id),
			name: e.name,
			level: e.level,
			quality: e.quality,
			inv: e.inv,
			stats: e.stats
		};
	if (!under && e.level < 180 && e.itemClass === 4)
		under = {
			id: Number(id),
			name: e.name,
			level: e.level,
			quality: e.quality,
			equipLoc: e.equipLoc,
			stats: e.stats
		};
	if (over && under && overArmor) break;
}
console.log('sample over320', JSON.stringify(over));
console.log('sample overArmor', JSON.stringify(overArmor));
console.log('sample under180', JSON.stringify(under));

const qdist = {};
for (const e of Object.values(db.items)) {
	if (e.itemClass === 2 || e.itemClass === 4) qdist[e.quality] = (qdist[e.quality] || 0) + 1;
}
console.log('quality dist class 2/4', qdist);

let mn = 1e9,
	mx = 0,
	below = 0,
	inRange = 0,
	above = 0;
for (const e of Object.values(db.items)) {
	mn = Math.min(mn, e.level);
	mx = Math.max(mx, e.level);
	if (e.level < db.scale.ilevelMin) below++;
	else if (e.level > db.scale.ilevelMax) above++;
	else inRange++;
}
console.log('level min/max', mn, mx);
console.log('ilevel distribution vs scale', {
	below,
	inRange,
	above,
	min: db.scale.ilevelMin,
	max: db.scale.ilevelMax
});

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
let zeroBudgetAtStored = 0,
	okBudget = 0;
for (const e of Object.values(db.items)) {
	if (e.itemClass !== 2 && e.itemClass !== 4) continue;
	const st = randomSuffixType(e.itemClass, e.itemSubclass, e.inv);
	const oob = e.level < db.scale.ilevelMin || e.level > db.scale.ilevelMax || st < 0;
	if (oob) zeroBudgetAtStored++;
	else okBudget++;
}
console.log(
	'armor/weapon budget@storedLevel without clamp: ok',
	okBudget,
	'wouldBeZero',
	zeroBudgetAtStored
);
