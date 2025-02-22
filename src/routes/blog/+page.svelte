<script lang="ts">
	import Header from '../../components/header.svelte';
	import SEO from '../../components/seo.svelte';
	import Footer from '../../components/footer.svelte';
	import Button from '$lib/components/ui/button/button.svelte';

	const blogPosts = [
		{
			title: 'Understanding the Mythic+ Score System in World of Warcraft',
			summary:
				'Learn how the Mythic+ score is calculated, including key levels, breakpoints, and time bonuses. Maximize your score with our tips and tools.',
			slug: 'how-mythic-score-works'
		}
	];
</script>

<SEO
	title="Blog Posts"
	description="Overview of Mr. Mythical Blog Posts"
	image="https://mrmythical.com/Logo.png"
	keywords="Mythic Plus, Mythic+, World of Warcraft, WoW tools, Raiding, Mythic raiding, Healer tools"
/>

<Header />

<main class="container mx-auto px-4 py-8">
	<h1 class="mb-6 text-2xl font-bold">Blog Posts</h1>

	<ul class="space-y-6">
		{#each blogPosts as post}
			<li class="rounded bg-card p-4 shadow">
                <a 
                href={`/blog/${post.slug}`}>
				<h2 class="mb-2 text-xl font-bold">{post.title}</h2>
				<p>{post.summary}</p>
				<Button class="mt-4">
					Read More
				</Button>
            </a>
			</li>
		{/each}
	</ul>
</main>

<Footer />
