import { render } from '@testing-library/svelte';

/**
 * Custom render function that provides common test utilities
 */
export function renderComponent(
	component: any,
	options: any = {}
) {
	const defaultOptions = {
		props: {},
		...options
	};

	return render(component, defaultOptions);
}

/**
 * Mock for SvelteKit's page store
 */
export function createMockPage(overrides: any = {}) {
	return {
		url: new URL('http://localhost:3000'),
		params: {},
		route: { id: null },
		status: 200,
		error: null,
		data: {},
		form: undefined,
		...overrides
	};
}

/**
 * Helper to wait for async operations in tests
 */
export function waitFor(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock data generators for testing
 */
export const mockData = {
	dungeons: [
		{ value: 'shrine-of-the-storm', label: 'Shrine of the Storm', short_name: 'SotS' },
		{ value: 'temple-of-sethraliss', label: 'Temple of Sethraliss', short_name: 'ToS' },
		{ value: 'the-underrot', label: 'The Underrot', short_name: 'UR' },
		{ value: 'waycrest-manor', label: 'Waycrest Manor', short_name: 'WM' }
	],
	
	realms: [
		{ value: 'stormrage', label: 'Stormrage', region: 'US' },
		{ value: 'area-52', label: 'Area-52', region: 'US' },
		{ value: 'tichondrius', label: 'Tichondrius', region: 'US' }
	],

	character: {
		name: 'TestCharacter',
		realm: 'stormrage',
		class: 'warrior',
		spec: 'protection',
		level: 80,
		score: 2500
	}
};

/**
 * Helper for testing components that use stores
 */
export function withMockStores(stores: Record<string, any> = {}) {
	// This would be used with a testing library that supports store mocking
	return stores;
}
