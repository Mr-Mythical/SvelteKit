<script lang="ts">
	import KeystoneTable from '../../components/calculator/keystoneTable.svelte';
	import ScoreExplanation from '../../components/calculator/scoreExplanation.svelte';
	import ApiForm from '../../components/calculator/apiForm.svelte';
	import SEO from '../../components/seo.svelte';
	import Footer from '../../components/layout/footer.svelte';
	import { Toaster } from 'svelte-sonner';
	import type { PageData } from './$types.js';
	import * as Accordion from '$lib/components/ui/accordion';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const defaultDescription =
		'Try the interactive m+ calculator to see which keystones you need for your desired Mythic+ score in WoW. Import your character and plan your runs!';
	const defaultKeywords =
		'mythic+ calculator, mythic rating calculator, mythic score calculator, mythic+ score calculator, mythic plus rating calculator, mythic+ rating calculator, mythic plus calculator, mythic planner, mythic dungeon planner, m+ calculator';

	const base = 'https://mrmythical.com';
	const faqItems = [
		{
			question: 'How is Mythic+ score calculated?',
			answer:
				'Mythic+ score is calculated based on your best 8 keystone runs. Each run contributes a score based on the keystone level and completion time (timers give bonus points). Higher levels and faster completions yield more score.'
		},
		{
			question: 'What does a keystone upgrade do?',
			answer:
				'A keystone upgrade increases the level of a keystone run, making it harder but rewarding more score and higher ilvl loot. You earn upgrades by completing runs in time. The calculator shows you the exact levels needed to hit your score target.'
		},
		{
			question: 'Can I import my character into the calculator?',
			answer:
				'Yes! Click the "Import Character" button in the calculator to import your World of Warcraft character. Your current best runs will auto-populate, then you can adjust your setups and see exactly what levels you need.'
		},
		{
			question: 'How do I share my calculator setup with friends?',
			answer:
				'Once you set your desired keystones in the calculator, click "Share Current Setup" to copy your URL or just copy it directly from the URL bar. You can copy and share this link with your team—they\'ll see the exact same dungeon and keystone level configuration.'
		},
		{
			question: "What's the difference between rating and score?",
			answer:
				'Rating and score are often used interchangeably in Mythic+. Both refer to the numerical value earned from your keystone runs. Higher scores reflect better performance and higher keystone levels completed.'
		},
		{
			question: 'Does the calculator account for affix bonuses?',
			answer:
				'Yes. The calculator uses the exact WoW formula including base score increments for each keystone level and affix breakpoint bonuses at levels 4, 7, 10, and 12.'
		},
		{
			question: 'Can I use the API to query specific scores?',
			answer:
				'Yes! The calculator exposes a public API at /api/calculate-runs?score=XXXX that returns the exact keystone levels needed for any target score as JSON.'
		},
		{
			question: 'Can I generate a shareable link for a specific score?',
			answer:
				'Visit /rating-calculator?score=XXXX (replace XXXX with your target score) to see the exact keystones needed. The page automatically generates optimized dungeons and includes the breakdown in the URL—perfect for sharing with your guild.'
		}
	];

	const appSchema = {
		'@context': 'https://schema.org',
		'@type': 'SoftwareApplication',
		name: 'Mythic+ Score Calculator',
		applicationCategory: 'Calculator',
		operatingSystem: 'Web',
		url: base + '/rating-calculator',
		description: data.seoDescription ?? defaultDescription,
		offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
	};

	const faqSchema = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqItems.map((item) => ({
			'@type': 'Question',
			name: item.question,
			acceptedAnswer: { '@type': 'Answer', text: item.answer }
		}))
	};
</script>

<SEO
	title={data.seoTitle ?? 'Mythic+ Score Calculator - MrMythical'}
	description={data.seoDescription ?? defaultDescription}
	image="https://mrmythical.com/Logo.png"
	keywords={data.seoKeywords ?? defaultKeywords}
	schemas={[appSchema, faqSchema]}
/>
<main class="container mx-auto px-4 py-8">
	<header class="page-header">
		<p class="page-eyebrow">Score calculator</p>
		<h1 class="page-title">Mythic+ score calculator.</h1>
		<p class="page-lede">
			Calculate the keystones to reach your target Mythic+ score, plan dungeon runs, and
			share your setup by URL.
		</p>
	</header>
	<KeystoneTable />
	<ScoreExplanation />
	<ApiForm data={data.form} />
	<section class="mt-12">
		<h2 class="mb-6 text-2xl font-bold">Frequently Asked Questions</h2>
		<Accordion.Root type="multiple" value={[]} class="w-full">
			{#each faqItems as item, i (i)}
				<Accordion.Item value={`faq-${i}`}>
					<Accordion.Trigger>{item.question}</Accordion.Trigger>
					<Accordion.Content>{item.answer}</Accordion.Content>
				</Accordion.Item>
			{/each}
		</Accordion.Root>
	</section>
	<Toaster richColors />
</main>
<Footer />

<style>
	.page-header {
		display: flex;
		flex-direction: column;
		gap: 6px;
		max-width: 72ch;
		padding-bottom: clamp(20px, 3vw, 32px);
	}

	.page-eyebrow {
		font-family: var(--font-body);
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: hsl(var(--link));
		margin: 0;
	}

	.page-title {
		font-family: var(--font-heading);
		font-size: clamp(1.75rem, 4vw, 2.5rem);
		font-weight: 700;
		line-height: 1.08;
		letter-spacing: -0.02em;
		color: hsl(var(--foreground));
		margin: 0;
	}

	.page-lede {
		font-family: var(--font-body);
		font-size: 0.9375rem;
		line-height: 1.45;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}
</style>
