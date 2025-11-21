export interface Ability {
	name: string;
	id: number;
}

export interface Boss {
	id: number;
	name: string;
	abilities: Ability[];
}

export const bosses: Boss[] = [
	{
		id: 3129,
		name: 'Plexus Sentinel',
		abilities: [
			{ name: 'Obliteration Arcanocannon', id: 1219263 },
			{ name: 'Eradicating Salvo', id: 1219531 },
			{ name: 'Protocol: Purge', id: 1220489 },
			{ name: 'Cleanse the Chamber', id: 1234733 },
			{ name: 'Manifest Matrices', id: 1219450 }
		]
	},
	{
		id: 3131,
		name: "Loom'itha",
		abilities: [
			{ name: 'Overinfusion Burst', id: 1226395 },
			{ name: 'Infusion Tether', id: 1226311 },
			{ name: 'Hyper Infusion', id: 1247045 },
			{ name: 'Piercing Strand', id: 1227263 },
			{ name: 'Lair Weaving', id: 1237272 },
			{ name: 'Writhing Wave', id: 1227226 },
			{ name: 'Arcane Outrage', id: 1227782 }
		]
	},
	{
		id: 3130,
		name: 'Soulbinder Naazindhri',
		abilities: [
			{ name: 'Shatterpulse', id: 1250008 },
			{ name: 'Essence Implosion', id: 1227848 },
			{ name: 'Arcane Expulsion', id: 1242088 },
			{ name: 'Phase Blades', id: 1235576 },
			{ name: 'Soulfire Convergence', id: 1225616 },
			{ name: 'Soulfray Annihilation', id: 1227276 },
			{ name: 'Mystic Lash', id: 1224025 },
			{ name: 'Soul Calling', id: 1225582 },
			{ name: 'Void Burst', id: 1227052 }
		]
	},
	{
		id: 3132,
		name: 'Forgeweaver Araz',
		abilities: [
			{ name: 'Arcane Expulsion', id: 1227631 },
			{ name: 'Arcane Siphon', id: 1228100 },
			{ name: 'Astral Burn', id: 1240705 },
			{ name: 'Arcane Obliteration', id: 1228216 },
			{ name: 'Invoke Collector', id: 1231720 },
			{ name: 'Astral Harvest', id: 1228213 },
			{ name: 'Void Tear', id: 1248171 },
			{ name: 'Crushing Darkness', id: 1233074 },
			{ name: 'Overwhelming Power', id: 1228502 }
		]
	},
	{
		id: 3122,
		name: 'The Soul Hunters',
		abilities: [
			{ name: 'Spirit Bomb', id: 1242259 },
			{ name: 'Sigil of Chains', id: 1240891 },
			{ name: "Devourer's Ire", id: 1245575 },
			{ name: 'Consume', id: 1234565 },
			{ name: 'Fracture', id: 1241833 },
			{ name: 'Eye Beam', id: 1218103 },
			{ name: 'Felblade', id: 1225130 },
			{ name: 'Collapsing Star', id: 1233093 },
			{ name: 'Soul Tether', id: 1245978 },
			{ name: 'Fel Rush', id: 1233863 },
			{ name: 'Fel Devastation', id: 1227117 },
			{ name: 'Aura of Pain', id: 1227154 },
			{ name: 'Voidstep', id: 1227355 },
			{ name: 'Encroaching Oblivion', id: 1235045 },
			{ name: 'The Hunt', id: 1227809 }
		]
	},
	{
		id: 3133,
		name: 'Fractillus',
		abilities: [
			{ name: 'Shattering Backhand', id: 1220394 },
			{ name: 'Crystalline Shockwave', id: 1233416 },
			{ name: 'Shockwave Slam', id: 1231871 },
			{ name: 'Enraged Shattering', id: 1225673 }
		]
	},
	{
		id: 3134,
		name: 'Nexus-King Salhadaar',
		abilities: [
			{ name: 'Decree: Oath-Bound', id: 1224731 },
			{ name: 'Dimension Glare', id: 1234539 },
			{ name: "King's Hunger", id: 1228317 },
			{ name: 'Subjugation Rule', id: 1224776 },
			{ name: 'Command: Besiege', id: 1225016 },
			{ name: 'Dimension Breath', id: 1228163 },
			{ name: 'Banishment', id: 1227529 },
			{ name: 'Command: Behead', id: 1225010 },
			{ name: 'Reap', id: 1228053 },
			{ name: 'Rally the Shadowguard', id: 1228065 },
			{ name: 'Invoke the Oath', id: 1224906 },
			{ name: 'Coalesce Voidwing', id: 1227734 },
			{ name: 'Netherbreaker', id: 1228113 },
			{ name: 'Cosmic Maw', id: 1234529 }
		]
	},
	{
		id: 3135,
		name: 'Dimensius, the All-Devouring',
		abilities: [
			{ name: 'Devour', id: 1229038 },
			{ name: 'Massive Smash', id: 1230087 },
			{ name: 'Dark Matter', id: 1230979 },
			{ name: 'Fission', id: 1231005 },
			{ name: 'Extinguish The Stars', id: 1231716 },
			{ name: 'Gravity Well', id: 1232394 },
			{ name: 'Supernova', id: 1232973 },
			{ name: 'Supernova', id: 1232986 },
			{ name: 'Unknown', id: 1234044 },
			{ name: 'Shadowquake', id: 1234054 },
			{ name: 'Inverse Gravity', id: 1234244 },
			{ name: 'Cosmic Collapse', id: 1234263 },
			{ name: 'Gamma Burst', id: 1237325 },
			{ name: 'Mass Ejection', id: 1237694 },
			{ name: 'Stardust Nova', id: 1237695 },
			{ name: 'Extinction', id: 1238765 },
			{ name: "Conqueror's Cross", id: 1239262 },
			{ name: 'Unknown', id: 1243349 },
			{ name: 'Reverse Gravity', id: 1243577 },
			{ name: 'Shattered Space', id: 1243694 },
			{ name: 'Antimatter', id: 1243702 },
			{ name: 'Null Binding', id: 1246541 },
			{ name: 'Mass Destruction', id: 1249423 },
			{ name: 'Voidgrasp', id: 1250055 },
			{ name: 'Starshard Nova', id: 1251619 }
		]
	}
];

export const testBosses: Boss[] = [
	{
		id: 53176,
		name: 'Imperator Averzian',
		abilities: []
	},
	{
		id: 53177,
		name: 'Vorasius',
		abilities: []
	},
	{
		id: 53178,
		name: 'Vaelgor & Ezzorak',
		abilities: []
	},
	{
		id: 53179,
		name: 'Fallen-King Salhadaar',
		abilities: []
	},
	{ 
		id: 53180,
		name: 'Lightblinded Vanguard',
		abilities: []
	},
	{ 
		id: 53182, 
		name: "Belo'ren, Child of Al'ar", 
		abilities: [] },
	{
		id: 53306,
		name: 'Chimaeras the Undreamt God',
		abilities: []
	}
];
