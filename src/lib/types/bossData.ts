export interface Ability {
	name: string;
	id: number;
}

export interface Boss {
	id: number;
	name: string;
	slug: string;
	abilities: Ability[];
}

export const bosses: Boss[] = [
	{
		id: 3176,
		name: 'Imperator Averzian',
		slug: 'imperator-averzian',
		abilities: []
	},
	{
		id: 3177,
		name: 'Vorasius',
		slug: 'vorasius',
		abilities: []
	},
	{
		id: 3179,
		name: 'Fallen-King Salhadaar',
		slug: 'fallenking-salhadaar',
		abilities: []
	},
	{
		id: 3178,
		name: 'Vaelgor & Ezzorak',
		slug: 'vaelgor-ezzorak',
		abilities: []
	},
	{
		id: 3180,
		name: 'Lightblinded Vanguard',
		slug: 'lightblinded-vanguard',
		abilities: []
	},
	{
		id: 3181,
		name: 'Crown of the Cosmos',
		slug: 'crown-of-the-cosmos',
		abilities: []
	},
	{
		id: 3306,
		name: 'Chimaerus the Undreamt God',
		slug: 'chimaerus-the-undreamt-god',
		abilities: []
	},
	{
		id: 3182,
		name: "Belo'ren, Child of Al'ar",
		slug: 'beloren-child-of-alar',
		abilities: []
	},
	{
		id: 3183,
		name: 'Midnight Falls',
		slug: 'midnight-falls',
		abilities: []
	}
];
