import { classSpecAbilities } from '$lib/types/classData';

export const classColors: Record<string, string> = {
  Druid: '#FF7D0A',
  Evoker: '#33937F',
  Monk: '#00FF96',
  Paladin: '#F58CBA',
  Priest: '#ffffff',
  Shaman: '#0070DE'
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
