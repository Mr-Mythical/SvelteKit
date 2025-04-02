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
		id: 3009,
		name: 'Vexie And The Geargrinders',
		abilities: [
			{ name: 'Spew Oil', id: 459671 },
			{ name: 'Incendiary Fire', id: 468487 },
			{ name: 'Tank Buster', id: 459627 },
			{ name: 'Call Bikers', id: 459943 },
			{ name: 'Backfire', id: 460116 }
		]
	},
	{
		id: 3010,
		name: 'Cauldron Of Carnage',
		abilities: [
			{ name: 'Colossal Clash', id: 465872 },
			{ name: 'Scrapbomb', id: 473650 },
			{ name: 'Thunderdrum Salvo', id: 463900 },
			{ name: 'Blastburn Roarcannon', id: 472233 }
		]
	},
	{
		id: 3011,
		name: 'Rik Reverb',
		abilities: [
			{ name: 'Sound Cannon', id: 467606 },
			{ name: 'Amplification!', id: 473748 },
			{ name: 'Echoing Chant', id: 466866 },
			{ name: 'Blaring Drop', id: 473260 },
			{ name: 'Faulty Zap!', id: 466979 },
			{ name: 'Sound Cloud', id: 464584 }
		]
	},
	{
		id: 3012,
		name: 'Stix Bunkjunker',
		abilities: [
			{ name: 'Overdrive', id: 467117 },
			{ name: 'Electromagnetic Sorting', id: 464399 },
			{ name: 'Incinerator', id: 464149 },
			{ name: 'Demolish', id: 464112 },
			{ name: 'Meltdown', id: 1217954 }
		]
	},
	{
		id: 3013,
		name: 'Sprocketmonger Lockenstock',
		abilities: [
			{ name: 'Sonic Ba-Boom', id: 465232 },
			{ name: 'Foot-Blasters', id: 1217231 },
			{ name: 'Pyro Party Pack', id: 1214872 },
			{ name: 'Wire Transfer', id: 1218418 },
			{ name: 'Polarization Generator', id: 1217355 },
			{ name: 'Screw Up', id: 1216508 },
			{ name: 'Activate Inventions!', id: 473276 },
			{ name: 'Beta Launch', id: 466765 }
		]
	},
	{
		id: 3014,
		name: 'One-Armed Bandit',
		abilities: [
			{ name: 'Pay-Line', id: 460181 },
			{ name: 'Foul Exhaust', id: 469993 },
			{ name: 'The Big Hit', id: 460472 },
			{ name: 'Spin To Win!', id: 461060 },
			{ name: 'Overload!', id: 460582 }
		]
	},
	{
		id: 3015,
		name: "Mug'Zee, Heads of Security",
		abilities: [{ name: 'TBD', id: 1 }]
	},
	{
		id: 3016,
		name: 'Chrome King Gallywix',
		abilities: [{ name: 'TBD', id: 1 }]
	}
];
