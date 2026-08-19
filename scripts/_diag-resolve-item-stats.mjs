import { readFileSync } from 'fs';

const db = JSON.parse(readFileSync('static/gearing/item-db-v1.json', 'utf8'));
console.log('scale', db.scale.ilevelMin, db.scale.ilevelMax);
console.log('epic rows', db.scale.epic.length, 'cols', db.scale.epic[0]?.length);
console.log('crMult armor', db.scale.crMult.armor.length);

const want = [
	'INVTYPE_HEAD',
	'INVTYPE_SHOULDER',
	'INVTYPE_CHEST',
	'INVTYPE_WRIST',
	'INVTYPE_HAND',
	'INVTYPE_WAIST',
	'INVTYPE_LEGS',
	'INVTYPE_WEAPONMAINHAND',
	'INVTYPE_2HWEAPON',
	'INVTYPE_HOLDABLE',
	'INVTYPE_WEAPONOFFHAND',
	'INVTYPE_WEAPON'
];
const samples = {};
for (const [id, e] of Object.entries(db.items)) {
	if (!samples[e.equipLoc]) samples[e.equipLoc] = { id: Number(id), ...e };
}
for (const loc of want) {
	const s = samples[loc];
	if (!s) {
		console.log(loc, 'MISSING');
		continue;
	}
	console.log(
		JSON.stringify({
			loc,
			id: s.id,
			inv: s.inv,
			itemClass: s.itemClass,
			itemSubclass: s.itemSubclass,
			quality: s.quality,
			level: s.level,
			nStats: s.stats?.length,
			stats: s.stats?.slice(0, 3)
		})
	);
}

// Also find items with level >= 220 for head
let headHigh = null;
for (const [id, e] of Object.entries(db.items)) {
	if (e.equipLoc === 'INVTYPE_HEAD' && e.level >= 220) {
		headHigh = { id: Number(id), ...e };
		break;
	}
}
console.log(
	'headHigh',
	JSON.stringify(
		headHigh && {
			id: headHigh.id,
			inv: headHigh.inv,
			q: headHigh.quality,
			lvl: headHigh.level,
			stats: headHigh.stats
		}
	)
);

// weapon 273873
console.log('273873', JSON.stringify(db.items['273873']));

// Check inv values that give slotType -1 for class 4
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
let bad = 0,
	good = 0,
	byInv = {};
for (const e of Object.values(db.items)) {
	const st = randomSuffixType(e.itemClass, e.itemSubclass, e.inv);
	if (st < 0) {
		bad++;
		byInv[e.inv] = (byInv[e.inv] || 0) + 1;
	} else good++;
}
console.log('slotType ok', good, 'bad', bad, 'badByInv', byInv);

// Budget at 246 for slotTypes 0-3 quality 4
const idx = 246 - db.scale.ilevelMin;
console.log('budget@246', db.scale.epic[idx]);
console.log('budget@320', db.scale.epic[320 - db.scale.ilevelMin]);
console.log('budget@321 would be OOB');

// Count items with empty stats array
let emptyStats = 0;
for (const e of Object.values(db.items)) if (!e.stats || !e.stats.length) emptyStats++;
console.log('entries with empty stats array', emptyStats);
