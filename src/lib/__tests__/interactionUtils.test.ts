import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reveal } from '$lib/actions/reveal';
import {
	bindWowheadTooltipDismiss,
	configureWowheadTooltips,
	hideDuplicateWowheadTooltips,
	hideWowheadTooltips,
	isWowheadTrigger,
	loadWowheadTooltipsScript
} from '$lib/ui/wowheadTooltips';

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
		document.head
			.querySelectorAll('script[src*="tooltips.js"]')
			.forEach((script) => script.remove());
		const wowheadWindow = window as Window & {
			whTooltips?: Record<string, unknown>;
			Tooltips?: { hide?: () => void };
			WH?: { Tooltip?: { hide?: () => void }; Tooltips?: { hide?: () => void } };
			$WowheadPower?: { hideTooltip?: () => void };
			__mrMythicalWowheadScript?: 'pending' | 'loaded';
		};
		wowheadWindow.whTooltips = undefined;
		wowheadWindow.Tooltips = undefined;
		wowheadWindow.WH = undefined;
		wowheadWindow.$WowheadPower = undefined;
		wowheadWindow.__mrMythicalWowheadScript = undefined;
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
		expect(tooltip.style.visibility).toBe('hidden');
	});

	it('treats data-wowhead and wowhead.com anchors as triggers', () => {
		const spell = document.createElement('a');
		spell.dataset.wowhead = 'spell=1';
		const icon = document.createElement('img');
		spell.appendChild(icon);
		document.body.appendChild(spell);

		const item = document.createElement('a');
		item.href = 'https://www.wowhead.com/item=19019';
		document.body.appendChild(item);

		const other = document.createElement('a');
		other.href = 'https://mrmythical.com/raid';
		document.body.appendChild(other);

		expect(isWowheadTrigger(icon)).toBe(true);
		expect(isWowheadTrigger(item)).toBe(true);
		expect(isWowheadTrigger(other)).toBe(false);
		expect(isWowheadTrigger(document.body)).toBe(false);
	});

	it('hides when the pointer leaves a wowhead link', () => {
		const link = document.createElement('a');
		link.dataset.wowhead = 'spell=1';
		link.href = 'https://www.wowhead.com/spell=1';
		document.body.appendChild(link);

		const tooltip = document.createElement('div');
		tooltip.className = 'wowhead-tooltip';
		document.body.appendChild(tooltip);

		const hide = vi.fn();
		(window as Window & { WH?: { Tooltips?: { hide?: () => void } } }).WH = {
			Tooltips: { hide }
		};

		const originalFromPoint = document.elementFromPoint;
		document.elementFromPoint = () => document.body;

		const unbind = bindWowheadTooltipDismiss();
		link.dispatchEvent(
			new PointerEvent('pointerout', { bubbles: true, relatedTarget: document.body })
		);

		expect(hide).toHaveBeenCalled();
		expect(tooltip.style.display).toBe('none');
		unbind();
		document.elementFromPoint = originalFromPoint;
	});

	it('does not hide when Wowhead rewrites the link under the pointer', () => {
		const link = document.createElement('a');
		link.dataset.wowhead = 'spell=1';
		const icon = document.createElement('img');
		link.appendChild(icon);
		document.body.appendChild(link);

		const hide = vi.fn();
		(window as Window & { WH?: { Tooltips?: { hide?: () => void } } }).WH = {
			Tooltips: { hide }
		};

		const originalFromPoint = document.elementFromPoint;
		document.elementFromPoint = () => icon;

		const unbind = bindWowheadTooltipDismiss();
		icon.dispatchEvent(
			new PointerEvent('pointerout', {
				bubbles: true,
				relatedTarget: null,
				clientX: 12,
				clientY: 12
			})
		);

		expect(hide).not.toHaveBeenCalled();
		unbind();
		document.elementFromPoint = originalFromPoint;
	});

	it('strips native title attributes so the browser tip does not stack', () => {
		const link = document.createElement('a');
		link.dataset.wowhead = 'spell=1';
		link.title = 'Grasping Depths';
		document.body.appendChild(link);

		const unbind = bindWowheadTooltipDismiss();
		link.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));

		expect(link.hasAttribute('title')).toBe(false);
		unbind();
	});

	it('keeps the tooltip while moving between a wowhead link and its icon', () => {
		const link = document.createElement('a');
		link.dataset.wowhead = 'spell=1';
		const icon = document.createElement('img');
		link.appendChild(icon);
		document.body.appendChild(link);

		const hide = vi.fn();
		(window as Window & { WH?: { Tooltips?: { hide?: () => void } } }).WH = {
			Tooltips: { hide }
		};

		const unbind = bindWowheadTooltipDismiss();
		icon.dispatchEvent(new PointerEvent('pointerout', { bubbles: true, relatedTarget: link }));

		expect(hide).not.toHaveBeenCalled();
		unbind();
	});

	it('injects the Wowhead script only once', () => {
		loadWowheadTooltipsScript();
		loadWowheadTooltipsScript();

		expect(document.querySelectorAll('script[src*="tooltips.js"]')).toHaveLength(1);
	});

	it('hides extra Wowhead tooltip copies so only one primary stays visible', () => {
		const makePrimary = () => {
			const tip = document.createElement('div');
			tip.className = 'wowhead-tooltip';
			tip.setAttribute('data-visible', 'yes');
			const logo = document.createElement('div');
			logo.className = 'wowhead-tooltip-powered';
			tip.appendChild(logo);
			document.body.appendChild(tip);
			return tip;
		};

		const first = makePrimary();
		const second = makePrimary();
		const compare = document.createElement('div');
		compare.className = 'wowhead-tooltip';
		compare.setAttribute('data-visible', 'yes');
		document.body.appendChild(compare);

		hideDuplicateWowheadTooltips();

		expect(first.getAttribute('data-visible')).toBe('no');
		expect(second.getAttribute('data-visible')).toBe('yes');
		expect(compare.getAttribute('data-visible')).toBe('no');
	});
});
