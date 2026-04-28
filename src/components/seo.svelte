<script lang="ts">
	import { page } from '$app/state';

	interface Props {
		title?: string;
		description?: string;
		image?: string;
		keywords?: string;
		schemas?: Record<string, unknown>[];
	}

	let { title = '', description = '', image = '', keywords = '', schemas = [] }: Props = $props();

	const base = 'https://mrmythical.com';
	let fullUrl = $derived(base + page.url.pathname);
	let segments = $derived(page.url.pathname.split('/').filter(Boolean));
	let breadcrumbList = $derived({
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: segments.map((seg, idx) => ({
			'@type': 'ListItem',
			position: idx + 1,
			item: {
				'@id': base + '/' + segments.slice(0, idx + 1).join('/'),
				name: seg
			}
		}))
	});
	let webPage = $derived({
		'@context': 'https://schema.org',
		'@type': 'WebPage',
		name: title,
		description,
		url: fullUrl,
		isPartOf: { '@type': 'WebSite', name: 'mrmythical.com', url: base }
	});
	let organization = $derived({
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: 'Mr. Mythical',
		url: base,
		logo: image
	});
	let website = $derived({
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: title,
		url: fullUrl,
		logo: image,
		potentialAction: {
			'@type': 'SearchAction',
			target: base + '/rating-calculator?score={search_term_string}',
			'query-input': 'required name=search_term_string'
		}
	});
</script>

<svelte:head>
	<title>{title}</title>

	<link rel="canonical" href={'https://mrmythical.com' + page.url.pathname} />

	<meta name="description" content={description} />
	<meta name="keywords" content={keywords} />

	<meta property="og:site_name" content="mrmythical.com" />
	<meta property="og:url" content="https://mrmythical.com{page.url.pathname}" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={image} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta property="twitter:domain" content="mrmythical.com" />
	<meta property="twitter:url" content="https://mrmythical.com{page.url.pathname}" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />

	{@html `<script type="application/ld+json">${JSON.stringify(website)}</script>`}
	{@html `<script type="application/ld+json">${JSON.stringify(organization)}</script>`}
	{@html `<script type="application/ld+json">${JSON.stringify(webPage)}</script>`}
	{@html `<script type="application/ld+json">${JSON.stringify(breadcrumbList)}</script>`}
	{#if schemas && schemas.length}
		{#each schemas as s}
			{@html `<script type="application/ld+json">${JSON.stringify(s)}</script>`}
		{/each}
	{/if}
</svelte:head>
