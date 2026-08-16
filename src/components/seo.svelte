<script lang="ts">
	import { page } from '$app/state';
	import {
		breadcrumbListJsonLd,
		canonicalUrl,
		organizationJsonLd,
		SITE_LOGO,
		SITE_NAME,
		webPageJsonLd,
		websiteJsonLd
	} from '$lib/seo';

	interface Props {
		title?: string;
		description?: string;
		image?: string;
		keywords?: string;
		schemas?: Record<string, unknown>[];
		robots?: string;
	}

	let {
		title = '',
		description = '',
		image = SITE_LOGO,
		keywords = '',
		schemas = [],
		robots = ''
	}: Props = $props();

	const canonical = $derived(canonicalUrl(page.url.pathname, page.url.searchParams));
	const jsonLdBlocks = $derived.by(() => {
		const blocks: { key: string; json: string }[] = [
			{ key: 'website', json: JSON.stringify(websiteJsonLd()) },
			{ key: 'organization', json: JSON.stringify(organizationJsonLd()) },
			{ key: 'webpage', json: JSON.stringify(webPageJsonLd(title, description, canonical)) }
		];
		const crumbs = breadcrumbListJsonLd(page.url.pathname);
		if (crumbs) blocks.push({ key: 'breadcrumb', json: JSON.stringify(crumbs) });
		for (const [index, schema] of schemas.entries()) {
			const type = typeof schema['@type'] === 'string' ? schema['@type'] : 'schema';
			blocks.push({ key: `${type}-${index}`, json: JSON.stringify(schema) });
		}
		return blocks;
	});
</script>

<svelte:head>
	<title>{title}</title>

	<link rel="canonical" href={canonical} />

	<meta name="description" content={description} />
	{#if keywords}
		<meta name="keywords" content={keywords} />
	{/if}
	{#if robots}
		<meta name="robots" content={robots} />
	{/if}

	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:url" content={canonical} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={image} />
	<meta property="og:image:alt" content={title || SITE_NAME} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta property="twitter:domain" content="mrmythical.com" />
	<meta property="twitter:url" content={canonical} />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />

	{#each jsonLdBlocks as block (block.key)}
		{@html `<script type="application/ld+json">${block.json}</script>`}
	{/each}
</svelte:head>
