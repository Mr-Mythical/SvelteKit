import { classSpecAbilities } from '$lib/types/classData';

export function getAbilityNameById(abilityId: number): string {
	for (const classSpecs of Object.values(classSpecAbilities)) {
		for (const spec of Object.values(classSpecs)) {
			const {
				Major,
				Minor
			}: { Major: { id: number; name: string }[]; Minor: { id?: number; name?: string }[] } = spec;
			const allAbilities: { id: number; name: string }[] = [...Major, ...Minor].filter(
				(ability): ability is { id: number; name: string } =>
					ability.id !== undefined && ability.name !== undefined
			);
			const ability = allAbilities.find(
				(ability: { id: number; name: string }) => ability.id === abilityId
			);
			if (ability) {
				return ability.name;
			}
		}
	}
	return `Unknown Ability (${abilityId})`;
}
