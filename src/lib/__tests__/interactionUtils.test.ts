import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reveal } from '$lib/actions/reveal';
import { configureWowheadTooltips, hideWowheadTooltips } from '$lib/ui/wowheadTooltips';

describe('reveal action', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
	});

	it('reveals immediately when reduced motion is preferred', () => {
		const node = document.createElement('div');
		const originalMatchMedia = window.matchMedia;
		(window as Window & { matchMedia: typeof window.matchMedia }).matchMedia = vi
			.fn()
			.mockReturnValue({ matches: true });

		const action = reveal(node, { delay: 120 });

		expect(node.dataset.revealed).toBe('true');
		expect(node.style.getPropertyValue('--reveal-delay')).toBe('120ms');
		expect(typeof action).toBe('object');

		(window as Window & { matchMedia: typeof window.matchMedia }).matchMedia = originalMatchMedia;
	});

	it('uses IntersectionObserver when available', () => {
		const node = document.createElement('div');
		const disconnect = vi.fn();
		const observe = vi.fn();

		class MockIntersectionObserver {
			private callback: IntersectionObserverCallback;
			constructor(callback: IntersectionObserverCallback) {
				this.callback = callback;
			}
			observe = observe;
			disconnect = disconnect;
			trigger() {
				this.callback(
					[{ isIntersecting: true } as IntersectionObserverEntry],
					this as unknown as IntersectionObserver
				);
			}
		}

		const originalMatchMedia = window.matchMedia;
		const originalObserver = (window as unknown as { IntersectionObserver?: unknown })
			.IntersectionObserver;
		(window as Window & { matchMedia: typeof window.matchMedia }).matchMedia = vi
			.fn()
			.mockReturnValue({ matches: false });
		(
			window as unknown as { IntersectionObserver: typeof MockIntersectionObserver }
		).IntersectionObserver = MockIntersectionObserver;

		const action = reveal(node);
		expect(observe).toHaveBeenCalledWith(node);

		const instance = (MockIntersectionObserver as unknown as { prototype: { trigger: () => void } })
			.prototype;
		expect(typeof instance.trigger).toBe('function');
		(action as { destroy?: () => void }).destroy?.();
		expect(disconnect).toHaveBeenCalled();

		(window as Window & { matchMedia: typeof window.matchMedia }).matchMedia = originalMatchMedia;
		(window as unknown as { IntersectionObserver?: unknown }).IntersectionObserver =
			originalObserver;
	});
});

describe('wowhead tooltip helpers', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
		(window as Window & { whTooltips?: Record<string, unknown> }).whTooltips = undefined;
	});

	it('merges wowhead tooltip config into window', () => {
		configureWowheadTooltips({ colorlinks: true, iconizelinks: true });
		configureWowheadTooltips({ renameLinks: false });

		expect((window as Window & { whTooltips?: Record<string, unknown> }).whTooltips).toMatchObject({
			colorlinks: true,
			iconizelinks: true,
			renameLinks: false
		});
	});

	it('hides tooltip elements and invokes known hide APIs', () => {
		const tooltip = document.createElement('div');
		tooltip.id = 'wowhead-tooltip';
		document.body.appendChild(tooltip);

		const hideA = vi.fn();
		const hideB = vi.fn();
		const hideC = vi.fn();
		const hideD = vi.fn();

		(
			window as Window & {
				Tooltips?: { hide?: () => void };
				WH?: { Tooltip?: { hide?: () => void }; Tooltips?: { hide?: () => void } };
				$WowheadPower?: { hideTooltip?: () => void };
			}
		).Tooltips = { hide: hideA };
		(
			window as Window & {
				WH?: { Tooltip?: { hide?: () => void }; Tooltips?: { hide?: () => void } };
			}
		).WH = { Tooltip: { hide: hideB }, Tooltips: { hide: hideC } };
		(window as Window & { $WowheadPower?: { hideTooltip?: () => void } }).$WowheadPower = {
			hideTooltip: hideD
		};

		hideWowheadTooltips();

		expect(hideA).toHaveBeenCalled();
		expect(hideB).toHaveBeenCalled();
		expect(hideC).toHaveBeenCalled();
		expect(hideD).toHaveBeenCalled();
		expect(tooltip.style.display).toBe('none');
		expect(tooltip.style.pointerEvents).toBe('none');
	});
});
