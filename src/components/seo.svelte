<script>
	import { page } from '$app/stores';

	export let title = '';
	export let description = '';
	export let image = '';
	export let keywords = '';
</script>

<svelte:head>
	<title>{title}</title>

	<link rel="canonical" href={'https://mrmythical.com' + $page.url.pathname} />

	<meta name="description" content={description} />
	<meta name="keywords" content={keywords} />

	<meta property="og:site_name" content="mrmythical.com" />
	<meta property="og:url" content="https://mrmythical.com{$page.url.pathname}" />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={image} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta property="twitter:domain" content="mrmythical.com" />
	<meta property="twitter:url" content="https://mrmythical.com{$page.url.pathname}" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />

	{@html `
      <script type="application/ld+json">{
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "${title}",
        "url": "https://mrmythical.com{$page.url.pathname}",
        "logo": "${image}"
      }</script>
    `}
</svelte:head>
