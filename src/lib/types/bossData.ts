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
			{ name: 'Cleanse the Chamber', id: 1234733 }
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
			{ name: 'Soul Calling', id: 1225582 }
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
			{ name: 'Crushing Darkness', id: 1233074 }
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
			{ name: 'Encroaching Oblivion', id: 1235045 }
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
		name: "Nexus-King Salhadaar",
		abilities: [{ name: 'TBD', id: 1 }]
	},
	{
		id: 3135,
		name: 'Dimensius, the All-Devouring',
		abilities: [{ name: 'TBD', id: 1 }]
	}
];
