export function generateDynamicLink(): string {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2);
	const param = btoa('guide');

	return `/api/redirect?t=${param}&_=${timestamp}&r=${random}`;
}

export function createObfuscatedUrl(base: string): string {
	const parts = base.split('.');
	if (parts.length >= 2) {
		const domain = parts[0];
		const tld = parts.slice(1).join('.');
		return `${domain}.${tld}`;
	}
	return base;
}

export function getResourcePath(): string {
	const paths = [
		'/api/redirect?t=Z3VpZGU=',
		'/api/redirect?t=dG9vbHM=',
		'/api/redirect?t=cmVzb3VyY2U='
	];

	const index = Math.floor(Date.now() / 60000) % paths.length;
	return paths[index];
}
