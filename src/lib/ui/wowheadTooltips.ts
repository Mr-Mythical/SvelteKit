type WowheadWindow = Window & {
	Tooltips?: { hide?: () => void };
	WH?: { Tooltip?: { hide?: () => void }; Tooltips?: { hide?: () => void } };
	$WowheadPower?: { hideTooltip?: () => void };
	whTooltips?: Record<string, unknown>;
	__mrMythicalWowheadScript?: 'pending' | 'loaded';
};

const WOWHEAD_SCRIPT_SRC = 'https://wow.zamimg.com/js/tooltips.js';

const tooltipSelectors = [
	'#wowhead-tooltip',
	'#wowhead-tooltip-container',
	'#wh-tooltip',
	'.wowhead-tooltip',
	'.wowhead-tooltip-powered',
	'.wh-tooltip',
	'[id^="wowhead-tooltip"]',
	'[id^="wh-tooltip"]'
];

export function configureWowheadTooltips(options: Record<string, unknown>): void {
	if (typeof window === 'undefined') return;
	const wowheadWindow = window as WowheadWindow;
	wowheadWindow.whTooltips = {
		...(wowheadWindow.whTooltips ?? {}),
		...options
	};
}

/**
 * Load Wowhead's tooltip script once. Putting it in svelte:head runs it on SSR
 * parse and again on hydrate, which creates two stacked tooltip copies.
 */
export function loadWowheadTooltipsScript(): void {
	if (typeof window === 'undefined') return;
	const wowheadWindow = window as WowheadWindow;
	if (wowheadWindow.__mrMythicalWowheadScript) return;
	wowheadWindow.__mrMythicalWowheadScript = 'pending';

	if (wowheadWindow.WH && wowheadWindow.$WowheadPower) {
		wowheadWindow.__mrMythicalWowheadScript = 'loaded';
		return;
	}

	const existing = wowheadWindow.document.querySelector<HTMLScriptElement>(
		`script[src="${WOWHEAD_SCRIPT_SRC}"]`
	);
	if (existing) {
		if (wowheadWindow.WH) wowheadWindow.__mrMythicalWowheadScript = 'loaded';
		else
			existing.addEventListener('load', () => {
				wowheadWindow.__mrMythicalWowheadScript = 'loaded';
			});
		return;
	}

	const script = wowheadWindow.document.createElement('script');
	script.src = WOWHEAD_SCRIPT_SRC;
	script.async = true;
	script.addEventListener('load', () => {
		wowheadWindow.__mrMythicalWowheadScript = 'loaded';
	});
	wowheadWindow.document.head.appendChild(script);
}

function asElement(target: EventTarget | null): Element | null {
	if (target instanceof Element) return target;
	if (target instanceof Text) return target.parentElement;
	return null;
}

/** True when the pointer is on a Wowhead item/spell link (or one of its children). */
export function isWowheadTrigger(target: EventTarget | null): boolean {
	const element = asElement(target);
	if (!element) return false;
	const anchor = element.closest('a');
	if (!anchor) return false;
	if (anchor.hasAttribute('data-wowhead')) return true;
	const href = anchor.getAttribute('href') ?? '';
	try {
		const parsedUrl = new URL(href, window.location.href);
		const hostname = parsedUrl.hostname.toLowerCase();
		return hostname === 'wowhead.com' || hostname.endsWith('.wowhead.com');
	} catch {
		return false;
	}
}

function isInlineTooltip(element: HTMLElement): boolean {
	return element.classList.contains('wowhead-tooltip-inline');
}

function isPrimaryTooltip(element: HTMLElement): boolean {
	return Boolean(element.querySelector('.wowhead-tooltip-powered'));
}

function hideTooltipNode(element: HTMLElement): void {
	element.style.pointerEvents = 'none';
	element.style.display = 'none';
	element.style.visibility = 'hidden';
	element.setAttribute('data-visible', 'no');
}

function hideTooltipElements(wowheadWindow: WowheadWindow): void {
	for (const element of wowheadWindow.document.querySelectorAll<HTMLElement>(
		tooltipSelectors.join(',')
	)) {
		if (isInlineTooltip(element)) continue;
		hideTooltipNode(element);
	}
}

function hideTooltipApis(wowheadWindow: WowheadWindow): void {
	wowheadWindow.Tooltips?.hide?.();
	wowheadWindow.WH?.Tooltip?.hide?.();
	wowheadWindow.WH?.Tooltips?.hide?.();
	wowheadWindow.$WowheadPower?.hideTooltip?.();
}

export function hideWowheadTooltips(): void {
	if (typeof window === 'undefined') return;

	const wowheadWindow = window as WowheadWindow;
	hideTooltipApis(wowheadWindow);
	hideTooltipElements(wowheadWindow);
}

/**
 * Wowhead always builds a primary tip plus an unused compare tip, and a
 * double script init creates a second primary. Keep the newest primary only.
 */
export function hideDuplicateWowheadTooltips(): void {
	if (typeof window === 'undefined') return;

	const tips = [...document.querySelectorAll<HTMLElement>('.wowhead-tooltip')].filter(
		(element) => !isInlineTooltip(element)
	);

	const primaries = tips.filter(isPrimaryTooltip);
	const visiblePrimaries = primaries.filter(
		(element) => element.getAttribute('data-visible') === 'yes'
	);
	for (const extra of visiblePrimaries.slice(0, -1)) hideTooltipNode(extra);

	for (const extra of tips) {
		if (!isPrimaryTooltip(extra)) hideTooltipNode(extra);
	}
}

function pointerIsOnWowheadTrigger(event: PointerEvent): boolean {
	if (isWowheadTrigger(event.relatedTarget)) return true;
	if (typeof document.elementFromPoint !== 'function') return false;
	return isWowheadTrigger(document.elementFromPoint(event.clientX, event.clientY));
}

/**
 * Wowhead can show a tooltip after the pointer has already left (async fetch).
 * Hide as soon as the pointer leaves a trigger, and when the tab blurs.
 */
export function bindWowheadTooltipDismiss(): () => void {
	if (typeof window === 'undefined') return () => {};

	const onPointerOver = (event: PointerEvent) => {
		const anchor = asElement(event.target)?.closest('a');
		if (anchor && isWowheadTrigger(anchor)) {
			anchor.removeAttribute('title');
			requestAnimationFrame(hideDuplicateWowheadTooltips);
		}
	};

	const onPointerOut = (event: PointerEvent) => {
		if (!isWowheadTrigger(event.target)) return;
		if (pointerIsOnWowheadTrigger(event)) return;
		hideWowheadTooltips();
	};

	const onWindowBlur = () => hideWowheadTooltips();
	const onVisibility = () => {
		if (document.visibilityState !== 'visible') hideWowheadTooltips();
	};

	document.addEventListener('pointerover', onPointerOver, true);
	document.addEventListener('pointerout', onPointerOut, true);
	window.addEventListener('blur', onWindowBlur);
	document.addEventListener('visibilitychange', onVisibility);

	return () => {
		document.removeEventListener('pointerover', onPointerOver, true);
		document.removeEventListener('pointerout', onPointerOut, true);
		window.removeEventListener('blur', onWindowBlur);
		document.removeEventListener('visibilitychange', onVisibility);
	};
}
