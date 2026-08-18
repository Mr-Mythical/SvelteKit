<script lang="ts">
	import { parseGuideText, wowheadSpellDataAttr, wowheadSpellHref } from '$lib/guideText';

	interface Props {
		text: string;
		class?: string;
	}

	let { text, class: className = '' }: Props = $props();

	const tokens = $derived(parseGuideText(text));
</script>

<p class={['guide-text', className]}>
	{#each tokens as token, index (index)}
		{#if token.type === 'text'}
			{token.value}
		{:else}
			<a
				class="spell-link"
				href={wowheadSpellHref(token.id)}
				data-wowhead={wowheadSpellDataAttr(token.id)}
				data-tooltip-mode="cursor"
				target="_blank"
				rel="noopener noreferrer">{token.name}</a
			>
		{/if}
	{/each}
</p>

<style>
	.guide-text {
		font-family: var(--font-body);
		font-size: 0.9375rem;
		line-height: 1.6;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	.spell-link {
		display: inline !important;
		font-weight: 600;
		color: hsl(var(--link));
		text-decoration: none;
		border-bottom: 1px solid hsl(var(--link) / 0.35);
	}

	.spell-link:hover {
		border-bottom-color: hsl(var(--link));
	}

	.guide-text :global(.spell-link img) {
		width: 1.05em;
		height: 1.05em;
		vertical-align: -0.18em;
		margin-right: 0.2em;
	}
</style>
