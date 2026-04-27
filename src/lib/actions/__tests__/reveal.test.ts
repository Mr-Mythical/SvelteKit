import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { reveal } from '../reveal';

class MockIntersectionObserver {
	public static instances: MockIntersectionObserver[] = [];
	public observed: Element[] = [];
	public disconnected = false;
	constructor(public callback: IntersectionObserverCallback, public options?: IntersectionObserverInit) {
		MockIntersectionObserver.instances.push(this);
	}
	observe(el: Element) { this.observed.push(el); }
	disconnect() { this.disconnected = true; }
	unobserve() {}
	takeRecords(): IntersectionObserverEntry[] { return []; }
}

describe('reveal action', () => {
	let originalIO: typeof IntersectionObserver | undefined;
	let originalMatchMedia: typeof window.matchMedia;

	beforeEach(() => {
		MockIntersectionObserver.instances = [];
		originalIO = (window as unknown as { IntersectionObserver?: typeof IntersectionObserver }).IntersectionObserver;
		(window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = MockIntersectionObserver as unknown;
		originalMatchMedia = window.matchMedia;
		window.matchMedia = vi.fn().mockImplementation((q: string) => ({
			matches: false,
			media: q,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			addListener: vi.fn(),
			removeListener: vi.fn(),
			onchange: null,
			dispatchEvent: vi.fn()
		})) as unknown as typeof window.matchMedia;
	});

	afterEach(() => {
		(window as unknown as { IntersectionObserver?: typeof IntersectionObserver }).IntersectionObserver = originalIO;
		window.matchMedia = originalMatchMedia;
	});

	it('observes the node and reveals it on intersection', () => {
		const node = document.createElement('div');
		const action = reveal(node, { delay: 250 });

		expect(node.style.getPropertyValue('--reveal-delay')).toBe('250ms');
		expect(node.dataset.revealed).toBeUndefined();

		const observer = MockIntersectionObserver.instances[0];
		expect(observer.observed[0]).toBe(node);

		// Simulate an intersection
		observer.callback(
			[{ isIntersecting: true, target: node } as unknown as IntersectionObserverEntry],
			observer as unknown as IntersectionObserver
		);

		expect(node.dataset.revealed).toBe('true');
		expect(observer.disconnected).toBe(true);

		(action as { destroy?: () => void }).destroy?.();
	});

	it('reveals immediately when prefers-reduced-motion is set', () => {
		window.matchMedia = vi.fn().mockImplementation((q: string) => ({
			matches: q.includes('reduce'),
			media: q,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			addListener: vi.fn(),
			removeListener: vi.fn(),
			onchange: null,
			dispatchEvent: vi.fn()
		})) as unknown as typeof window.matchMedia;

		const node = document.createElement('div');
		const action = reveal(node);
		expect(node.dataset.revealed).toBe('true');
		expect(MockIntersectionObserver.instances).toHaveLength(0);
		expect((action as { destroy?: () => void }).destroy).toBeUndefined();
	});

	it('falls back to reveal when IntersectionObserver is not available', () => {
		delete (window as unknown as { IntersectionObserver?: unknown }).IntersectionObserver;
		const node = document.createElement('div');
		reveal(node);
		expect(node.dataset.revealed).toBe('true');
	});

	it('disconnects the observer on destroy', () => {
		const node = document.createElement('div');
		const action = reveal(node) as { destroy?: () => void };
		const observer = MockIntersectionObserver.instances[0];
		expect(observer.disconnected).toBe(false);
		action.destroy?.();
		expect(observer.disconnected).toBe(true);
	});
});
