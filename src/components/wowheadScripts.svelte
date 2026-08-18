<script lang="ts">
	import { onMount } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import {
		bindWowheadTooltipDismiss,
		configureWowheadTooltips,
		hideWowheadTooltips,
		loadWowheadTooltipsScript
	} from '$lib/ui/wowheadTooltips';

	afterNavigate(() => hideWowheadTooltips());

	onMount(() => {
		configureWowheadTooltips({
			colorLinks: true,
			iconizeLinks: true,
			renameLinks: true
		});
		loadWowheadTooltipsScript();
		const unbind = bindWowheadTooltipDismiss();
		return () => {
			unbind();
			hideWowheadTooltips();
		};
	});
</script>

<style>
	:global {
		.wowhead-tooltip:not(.wowhead-tooltip-inline) {
			pointer-events: none !important;
		}

		.wowhead-tooltip:not(.wowhead-tooltip-inline):not([data-visible='yes']) {
			display: none !important;
			visibility: hidden !important;
			opacity: 0 !important;
		}

		/* Compare/secondary copy has no powered-by logo. Never show it. */
		.wowhead-tooltip:not(.wowhead-tooltip-inline):not(:has(.wowhead-tooltip-powered)) {
			display: none !important;
			visibility: hidden !important;
			opacity: 0 !important;
		}

		html:not(:has(a[data-wowhead]:hover)):not(:has(a[href*='wowhead.com']:hover)) {
			.wowhead-tooltip:not(.wowhead-tooltip-inline),
			.wowhead-tooltip-powered {
				display: none !important;
				visibility: hidden !important;
				opacity: 0 !important;
			}
		}

		/* Wowhead switches to an element-anchored tip when the link is not inline. */
		a[data-wowhead].icontinyl {
			display: inline !important;
		}
	}
</style>
