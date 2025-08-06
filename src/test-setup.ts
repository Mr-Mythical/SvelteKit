import { expect, vi, afterEach } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Mock SvelteKit runtime module
vi.mock('$app/environment', () => ({
	browser: false,
	dev: true,
	building: false,
	version: 'test'
}));

vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
	invalidate: vi.fn(),
	invalidateAll: vi.fn(),
	preloadData: vi.fn(),
	preloadCode: vi.fn(),
	beforeNavigate: vi.fn(),
	afterNavigate: vi.fn(),
	pushState: vi.fn(),
	replaceState: vi.fn()
}));

vi.mock('$app/stores', () => {
	const mockPage = {
		url: {
			pathname: '/',
			search: '',
			hash: '',
			href: 'http://localhost/',
			origin: 'http://localhost',
			toString: () => 'http://localhost/'
		},
		params: {},
		route: { id: null },
		status: 200,
		error: null,
		data: {},
		form: undefined
	};

	const readable = (value: any) => ({
		subscribe: (fn: any) => {
			fn(value);
			return () => {};
		}
	});

	const writable = (value: any) => ({
		subscribe: (fn: any) => {
			fn(value);
			return () => {};
		},
		set: vi.fn(),
		update: vi.fn()
	});

	return {
		page: readable(mockPage),
		navigating: readable(null),
		updated: readable(false),
		getStores: vi.fn(() => ({
			page: readable(mockPage),
			navigating: readable(null),
			updated: readable(false)
		}))
	};
});

vi.mock('$app/forms', () => ({
	enhance: vi.fn()
}));

// Mock SvelteKit modules that are commonly used
vi.mock('$lib/utils', () => ({}));

// Global test utilities
global.fetch = vi.fn();

// Mock window.matchMedia for responsive design tests
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn()
	}))
});

// Mock IntersectionObserver for components that use it
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn()
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn()
}));

// Enhanced cleanup for each test
afterEach(() => {
	vi.clearAllMocks();
	document.body.innerHTML = '';
});
