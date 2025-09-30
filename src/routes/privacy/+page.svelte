<script lang="ts">
	import Header from '../../components/header.svelte';
	import SEO from '../../components/seo.svelte';
	import Footer from '../../components/footer.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
</script>

<SEO
	title="Privacy Policy - MrMythical.com"
	description="Learn how MrMythical.com uses cookies and analytics, including information about Google Analytics and Google Consent Mode."
	image="https://mrmythical.com/Logo.png"
/>

<Header />

<main>
	<article class="container mx-auto p-4 md:px-16 lg:px-52 xl:px-80">
		<h1 class="mb-2 text-2xl font-bold">Privacy Policy</h1>
		<p class="mb-4 text-sm italic">Updated: 17-Jun-2025</p>

		<p>
			At MrMythical.com, we respect your privacy and are committed to protecting it. This Privacy
			Policy explains what data we (and the third-party tools we use) collect, how it’s used, and
			how you can control it. We do not collect personal data directly from users. However, we use
			third-party services that may collect non-personal, anonymized data through cookies. for the
			purpose of analytics and consent management.
		</p>

		<h2 class="mb-4 mt-4 text-xl font-bold">What Data Is Collected</h2>
		<p>
			MrMythical.com does not collect any personal information such as names, email addresses, or
			account details. However, we use third-party services that may collect non-personally
			identifiable information automatically through cookies and analytics tools:
		</p>
		<ul class="ml-6 list-disc">
			<li>
				<strong>Google Analytics:</strong> Tracks anonymized usage data like page views, browser type,
				and user interactions to help improve the website.
			</li>
			<li>
				<strong>Google Consent Mode:</strong> Manages your cookie consent preferences through Google's
				consent framework.
			</li>
		</ul>

		<h2 class="mb-4 mt-4 text-xl font-bold">How This Information Is Used</h2>
		<p>This anonymized data is used to:</p>

		<ul class="ml-6 list-disc">
			<li>Improve the performance and user experience of the website</li>
			<li>Monitor traffic and popular pages</li>
			<li>Ensure compliance with cookie regulations</li>
		</ul>
		<p>We do not use this information to identify or track individuals.</p>

		<h2 class="mb-4 mt-4 text-xl font-bold">Data Retention</h2>
		<p>
			Analytics data is retained for 14 months. After this periods, the data is automatically
			deleted.
		</p>

		<h2 class="mb-4 mt-4 text-xl font-bold">Your Rights</h2>
		<p>Under various data protection laws, you have the right to:</p>
		<ul class="ml-6 list-disc">
			<li>Access any data we hold about you</li>
			<li>Request deletion of your data</li>
			<li>Object to data processing</li>
			<li>Withdraw consent at any time</li>
		</ul>
		<h2 class="mb-4 mt-4 text-xl font-bold">Cookies</h2>
		<p>
			MrMythical.com uses cookies for analytics and consent management. You can view detailed
			information in our <Button
				class="p-0 text-[1.03rem] font-bold text-link"
				variant="link"
				href="/cookie"
			>
				Cookie Policy
			</Button> and manage your preferences at any time via the cookie settings banner.
		</p>

		<h2 class="mb-4 mt-4 text-xl font-bold">Contact</h2>
		<p>
			If you have questions or concerns about this privacy policy, please contact:
			<Button
				class="p-0 text-[1.03rem] font-bold text-link"
				variant="link"
				href="mailto:mythical@mrmythical.com"
			>
				mythical@mrmythical.com
			</Button>
		</p>
	</article>
</main>

<Footer />
