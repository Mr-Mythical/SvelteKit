<script lang="ts">
	import KeystoneTable from '../../components/keystoneTable.svelte';
	import ScoreExplanation from '../../components/scoreExplanation.svelte';
	import ApiForm from '../../components/apiForm.svelte';
	import SEO from '../../components/seo.svelte';
	import Footer from '../../components/footer.svelte';
	import { Toaster } from 'svelte-sonner';
	import type { PageData } from './$types.js';
	import * as Accordion from '$lib/components/ui/accordion';

	export let data: PageData;

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
	<div class="mb-6 text-center">
		<h1 class="mb-2 text-4xl font-bold">Mythic+ Score Calculator</h1>
		<p class="text-lg text-muted-foreground">
			Calculate the required keystones to reach your desired World of Warcraft Mythic+ score, plan
			dungeon runs, and optimize your m+ score with this interactive score calculator. Import your
			character, set score goals, and share your setup with shareable URLs.
		</p>
	</div>
	<KeystoneTable />
	<ScoreExplanation />
	<ApiForm data={data.form} />
	<section class="mt-12">
		<h2 class="mb-6 text-2xl font-bold">Frequently Asked Questions</h2>
		<Accordion.Root value="" class="w-full">
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
