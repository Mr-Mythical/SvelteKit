import { classSpecAbilities } from '$lib/types/classData';

export const classColors: Record<string, string> = {
	DeathKnight: '#C41E3A',
	DemonHunter: '#A330C9',
	Druid: '#FF7D0A',
	Evoker: '#33937F',
	Hunter: '#AAD372',
	Mage: '#3FC7EB',
	Monk: '#00FF96',
	Paladin: '#F48CBA',
	Priest: '#FFFFFF',
	Rogue: '#FFF468',
	Shaman: '#0070DD',
	Warlock: '#8788EE',
	Warrior: '#C69B6D'
};

export const abilityColors: Record<number, string> = {};

Object.entries(classSpecAbilities).forEach(([className, specs]) => {
	Object.values(specs).forEach((spec) => {
		const { Major, Minor } = spec;

		[...Major, ...Minor].forEach((ability: any) => {
			if (ability.id) {
				abilityColors[ability.id] = classColors[className];
			}
		});
	});
});

// Extract class name from spec icon and return the class color
// Format: "ClassName-SpecName" (e.g., "Mage-Arcane", "Priest-Shadow")
export function getClassColorFromSpec(specIcon: string): string {
	if (!specIcon) return '#808080';

	// Split by '-' and take the first part (the class name)
	const parts = specIcon.split('-');
	if (parts.length < 1) return '#808080';

	const classNamePart = parts[0]; // First part is the class name

	// Map icon class names to our classColors keys
	const classMap: Record<string, string> = {
		DeathKnight: 'DeathKnight',
		DemonHunter: 'DemonHunter',
		Druid: 'Druid',
		Evoker: 'Evoker',
		Hunter: 'Hunter',
		Mage: 'Mage',
		Monk: 'Monk',
		Paladin: 'Paladin',
		Priest: 'Priest',
		Rogue: 'Rogue',
		Shaman: 'Shaman',
		Warlock: 'Warlock',
		Warrior: 'Warrior'
	};

	const className = classMap[classNamePart];
	return className ? classColors[className] : '#808080';
}
