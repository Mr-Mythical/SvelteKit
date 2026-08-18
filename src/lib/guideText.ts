/** Inline Wowhead spell marker used in raid guide copy: `[[1285623:Soulcoil Well]]`. */
export const SPELL_MARKER = /\[\[(\d+):([^\]]+)\]\]/g;

export type GuideTextToken =
	| { type: 'text'; value: string }
	| { type: 'spell'; id: number; name: string };

export function spell(id: number, name: string): string {
	return `[[${id}:${name}]]`;
}

export function parseGuideText(input: string): GuideTextToken[] {
	const tokens: GuideTextToken[] = [];
	let lastIndex = 0;
	const pattern = new RegExp(SPELL_MARKER.source, 'g');
	for (const match of input.matchAll(pattern)) {
		const index = match.index ?? 0;
		if (index > lastIndex) {
			tokens.push({ type: 'text', value: input.slice(lastIndex, index) });
		}
		tokens.push({ type: 'spell', id: Number(match[1]), name: match[2] });
		lastIndex = index + match[0].length;
	}
	if (lastIndex < input.length) {
		tokens.push({ type: 'text', value: input.slice(lastIndex) });
	}
	return tokens;
}

export function plainGuideText(input: string): string {
	return input.replace(new RegExp(SPELL_MARKER.source, 'g'), '$2');
}

export function wowheadSpellHref(id: number): string {
	return `https://www.wowhead.com/spell=${id}`;
}

export function wowheadSpellDataAttr(id: number): string {
	return `spell=${id}`;
}

export function spellsFromText(input: string): { name: string; id: number }[] {
	const seen = new Map<number, string>();
	const pattern = new RegExp(SPELL_MARKER.source, 'g');
	for (const match of input.matchAll(pattern)) {
		const id = Number(match[1]);
		if (!seen.has(id)) seen.set(id, match[2]);
	}
	return [...seen.entries()].map(([id, name]) => ({ name, id }));
}
