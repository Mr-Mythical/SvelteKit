<script>
    import { page } from '$app/stores';
  
    export let title = "";
    export let description = "";
    export let image = "";
    export let keywords = "";
  </script>
  
  <svelte:head>
    <!-- Basic Metadata -->
    <title>{title}</title>
    <meta name="description" content="{description}" />
    <meta name="keywords" content="{keywords}" />
    
    <!-- Open Graph Metadata -->
    <meta property="og:site_name" content="mrmythical.com" />
    <meta property="og:url" content="https://www.mrmythical.com{$page.url.pathname}" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="{title}" />
    <meta property="og:description" content="{description}" />
    <meta property="og:image" content="{image}" />
  
    <!-- Twitter Metadata -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta property="twitter:domain" content="mrmythical.com" />
    <meta property="twitter:url" content="https://www.mrmythical.com{$page.url.pathname}" />
    <meta name="twitter:title" content="{title}" />
    <meta name="twitter:description" content="{description}" />
    <meta name="twitter:image" content="{image}" />
  
    <!-- JSON-LD Structured Data -->
    {@html `
      <script type="application/ld+json">{
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "${title}",
        "url": "https://www.mrmythical.com{$page.url.pathname}",
        "logo": "${image}"
      }</script>
    `}
  </svelte:head>
  