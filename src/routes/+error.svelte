<script lang="ts">
	import { page } from '$app/state';
	import SEO from '../components/seo.svelte';
	import Footer from '../components/layout/footer.svelte';
	import { PAGE_SEO } from '$lib/data/seoCopy';

	const is404 = $derived(page.status === 404);
	const seo = $derived(is404 ? PAGE_SEO.notFound : PAGE_SEO.error);
	const heading = $derived(is404 ? 'Page not found.' : 'Something went wrong.');
	const body = $derived(
		is404
			? 'That URL is missing. Try one of the tools below.'
			: (page.error?.message ?? 'The page failed to load.')
	);
</script>

<SEO title={seo.title} description={seo.description} robots="noindex" />

<main class="container mx-auto max-w-3xl px-4 py-12">
	<p class="text-muted-foreground mb-2 text-sm font-semibold tracking-wide uppercase">
		{page.status}
	</p>
	<h1 class="mb-4 text-3xl font-bold">{heading}</h1>
	<p class="text-muted-foreground mb-8">{body}</p>
	<nav class="flex flex-col gap-3" aria-label="Helpful links">
		<a class="text-link font-semibold" href="/">Home</a>
		<a class="text-link font-semibold" href="/gearing">Farm priority</a>
		<a class="text-link font-semibold" href="/rating-calculator">Mythic+ calculator</a>
		<a class="text-link font-semibold" href="/addons">Addons</a>
	</nav>
</main>

<Footer />
