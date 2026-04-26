type WowheadWindow = Window & {
	Tooltips?: { hide?: () => void };
	WH?: { Tooltip?: { hide?: () => void }; Tooltips?: { hide?: () => void } };
	$WowheadPower?: { hideTooltip?: () => void };
	whTooltips?: Record<string, unknown>;
};

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

function hideTooltipElements(wowheadWindow: WowheadWindow): void {
	for (const element of wowheadWindow.document.querySelectorAll<HTMLElement>(
		tooltipSelectors.join(',')
	)) {
		element.style.pointerEvents = 'none';
		element.style.display = 'none';
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
	const hide = () => {
		hideTooltipApis(wowheadWindow);
		hideTooltipElements(wowheadWindow);
	};

	hide();
	wowheadWindow.requestAnimationFrame(hide);
	wowheadWindow.setTimeout(hide, 80);
}
