/**
 * Spec profile key helpers for the Gearing Dashboard.
 * Keys match ModelData v6 `spec_keys` / addon MID1_* profiles.
 */

const MULTI_WORD_CLASSES = ['Death_Knight', 'Demon_Hunter'] as const;

function titleCaseWords(raw: string): string {
	return raw
		.split('_')
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
		.join(' ');
}

export type SpecLabel = {
	profileKey: string;
	className: string;
	specName: string;
	heroTalent: string | null;
	label: string;
};

/** Turn `MID1_Mage_Frost_Frostfire` into class / spec / hero labels. */
export function formatProfileKey(profileKey: string): SpecLabel {
	let rest = profileKey.replace(/^MID\d+_/, '');
	let className = '';
	for (const multi of MULTI_WORD_CLASSES) {
		if (rest === multi || rest.startsWith(multi + '_')) {
			className = titleCaseWords(multi);
			rest = rest.slice(multi.length).replace(/^_/, '');
			break;
		}
	}
	if (!className) {
		const first = rest.split('_')[0] ?? '';
		className = titleCaseWords(first);
		rest = rest.slice(first.length).replace(/^_/, '');
	}

	const parts = rest.split('_').filter(Boolean);
	// Multi-token base specs (match slots.ts MULTI_TOKEN_SPECS).
	let specTokens = 1;
	const joined = parts.join('_');
	if (joined === 'Beast_Mastery' || joined.startsWith('Beast_Mastery_')) specTokens = 2;
	else if (joined === 'Survival_PL_DW' || joined.startsWith('Survival_PL_DW_')) specTokens = 3;

	const specName = titleCaseWords(parts.slice(0, specTokens).join('_'));
	const heroTalent =
		parts.length > specTokens ? titleCaseWords(parts.slice(specTokens).join('_')) : null;
	const label = heroTalent
		? `${className} ${specName} (${heroTalent})`
		: `${className} ${specName}`;

	return { profileKey, className, specName, heroTalent, label };
}

export function labeledSpecs(specKeys: string[]): SpecLabel[] {
	return specKeys.map(formatProfileKey).sort((a, b) => {
		const byClass = a.className.localeCompare(b.className);
		if (byClass !== 0) return byClass;
		const bySpec = a.specName.localeCompare(b.specName);
		if (bySpec !== 0) return bySpec;
		return (a.heroTalent ?? '').localeCompare(b.heroTalent ?? '');
	});
}

/** Specs for one class only (e.g. Armory `characterClass` = "Death Knight"). */
export function labeledSpecsForClass(
	specKeys: string[],
	characterClass: string | null | undefined
): SpecLabel[] {
	const want = normalizeToken(characterClass);
	if (!want) return [];
	const wantForms = new Set(classTokenForms(want));
	return labeledSpecs(specKeys).filter((s) => {
		const classNorm = normalizeToken(s.className);
		return wantForms.has(classNorm) || classTokenForms(classNorm).some((f) => wantForms.has(f));
	});
}

/** Compact label when class is already known: `Frost (Frostfire)` or `Beast Mastery`. */
export function classRelativeSpecLabel(spec: SpecLabel): string {
	return spec.heroTalent ? `${spec.specName} (${spec.heroTalent})` : spec.specName;
}

/** Best-effort match of SimC class/spec tokens to a MID1 profile key. */
export function matchSpecKey(
	specKeys: string[],
	opts: { classToken?: string; specToken?: string; heroToken?: string }
): string | null {
	const classNorm = normalizeToken(opts.classToken);
	const specNorm = normalizeToken(opts.specToken);
	const heroNorm = normalizeToken(opts.heroToken);
	if (!classNorm && !specNorm) return null;

	const scored = specKeys
		.map((key) => {
			const bodyRaw = key.replace(/^MID\d+_/, '').toLowerCase();
			const body = bodyRaw.replace(/['’]/g, '');
			let score = 0;
			if (classNorm) {
				const classForms = classTokenForms(classNorm);
				if (classForms.some((f) => body.startsWith(f + '_') || body === f)) score += 3;
				else return { key, score: -1 };
			}
			if (specNorm) {
				if (body.includes('_' + specNorm) || body.endsWith(specNorm)) score += 2;
				else return { key, score: -1 };
			}
			if (heroNorm) {
				if (body.includes(heroNorm)) score += 1;
			} else {
				// Prefer base spec (no hero talent) when hero not specified.
				const parts = body.split('_');
				const multi = ['death_knight', 'demon_hunter'];
				const classParts = multi.find((m) => body.startsWith(m))?.split('_').length ?? 1;
				const afterClass = parts.length - classParts;
				if (afterClass === 1) score += 0.5;
			}
			return { key, score };
		})
		.filter((r) => r.score >= 0)
		.sort((a, b) => b.score - a.score);

	return scored[0]?.key ?? null;
}

function normalizeToken(value?: string | null): string {
	return (value ?? '')
		.trim()
		.toLowerCase()
		.replace(/['’]/g, '')
		.replace(/[\s-]+/g, '_')
		.replace(/[^a-z0-9_]/g, '');
}

function classTokenForms(token: string): string[] {
	const t = token.replace(/_/g, '');
	const forms = [token];
	if (t === 'deathknight' || token === 'death_knight') forms.push('death_knight', 'deathknight');
	if (t === 'demonhunter' || token === 'demon_hunter') forms.push('demon_hunter', 'demonhunter');
	return [...new Set(forms.map((f) => f.replace(/__/g, '_')))];
}
