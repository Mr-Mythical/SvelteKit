/**
 * Minimal Lua table parser for ValidationData.lua exports from simc-factory.
 * Handles string/number/boolean scalars and nested tables with named or ["keyed"] fields.
 */

function parseLuaValue(src: string, i: number): [unknown, number] {
	while (i < src.length && /[\s,]/.test(src[i]!)) i++;
	if (src[i] === '{') return parseLuaTable(src, i);
	if (src[i] === '"' || src[i] === "'") {
		const q = src[i++]!;
		let s = '';
		while (i < src.length && src[i] !== q) {
			if (src[i] === '\\') {
				s += src[i + 1];
				i += 2;
				continue;
			}
			s += src[i++]!;
		}
		return [s, i + 1];
	}
	const start = i;
	while (i < src.length && /[A-Za-z0-9_.+\-]/.test(src[i]!)) i++;
	const tok = src.slice(start, i);
	if (tok === 'true') return [true, i];
	if (tok === 'false') return [false, i];
	if (tok === 'nil') return [null, i];
	const n = Number(tok);
	if (!Number.isNaN(n) && tok !== '') return [n, i];
	throw new Error(`Unexpected Lua token at ${start}: ${tok || src.slice(start, start + 12)}`);
}

function parseLuaTable(src: string, i: number): [Record<string, unknown>, number] {
	i++; // {
	const obj: Record<string, unknown> = {};
	let idx = 1;
	while (true) {
		while (i < src.length && /[\s,]/.test(src[i]!)) i++;
		if (src[i] === '}') return [obj, i + 1];
		if (src[i] === '[') {
			i++;
			while (i < src.length && /\s/.test(src[i]!)) i++;
			const [keyVal, afterKey] = parseLuaValue(src, i);
			i = afterKey;
			while (i < src.length && /\s/.test(src[i]!)) i++;
			if (src[i] !== ']') throw new Error(`Expected ] at ${i}`);
			i++;
			while (i < src.length && /\s/.test(src[i]!)) i++;
			if (src[i] !== '=') throw new Error(`Expected = at ${i}`);
			i++;
			const [v, afterVal] = parseLuaValue(src, i);
			obj[String(keyVal)] = v;
			i = afterVal;
		} else {
			const start = i;
			while (i < src.length && /[A-Za-z0-9_]/.test(src[i]!)) i++;
			const ident = src.slice(start, i);
			while (i < src.length && /\s/.test(src[i]!)) i++;
			if (src[i] === '=') {
				i++;
				const [v, afterVal] = parseLuaValue(src, i);
				obj[ident] = v;
				i = afterVal;
			} else {
				i = start;
				const [v, afterVal] = parseLuaValue(src, i);
				obj[String(idx++)] = v;
				i = afterVal;
			}
		}
	}
}

/** Parse MrMythical ValidationData.lua into a plain object of `V.*` assignments. */
export function parseValidationLua(lua: string): Record<string, unknown> {
	const fields: Record<string, unknown> = {};
	const re = /^V\.(\w+)\s*=\s*/gm;
	let m: RegExpExecArray | null;
	while ((m = re.exec(lua))) {
		const name = m[1]!;
		const [val] = parseLuaValue(lua, m.index + m[0].length);
		fields[name] = val;
	}
	return fields;
}
