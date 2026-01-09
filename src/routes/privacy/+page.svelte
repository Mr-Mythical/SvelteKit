<script lang="ts">
	import SEO from '../../components/seo.svelte';
	import Footer from '../../components/footer.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
</script>

<SEO
	title="Privacy Policy for Mr. Mythical WoW Tools"
	description="Learn how MrMythical.com respects your privacy and uses cookies for advertising."
	image="https://mrmythical.com/Logo.png"
/>

<main class="container mx-auto px-4 py-8">
	<article class="mx-auto max-w-4xl">
		<h1 class="mb-2 text-4xl font-bold">Privacy Policy</h1>
		<p class="mb-4 text-sm italic">Updated: 1-Oct-2025</p>

		<p>
			At MrMythical.com, we respect your privacy and are committed to protecting it. This Privacy
			Policy explains what data we (and the third-party tools we use) collect, how it’s used, and
			how you can control it. We do not collect personal data directly from users, but we use Google
			AdSense for advertising which may use cookies.
		</p>

		<h2 class="mb-4 mt-4 text-xl font-bold">What Data Is Collected</h2>
		<p>
			MrMythical.com does not collect any personal information such as names, email addresses, or
			account details. However, we use Google AdSense for advertising, which may use cookies to
			serve relevant ads and measure ad performance.
		</p>

		<h2 class="mb-4 mt-4 text-xl font-bold">How This Information Is Used</h2>
		<p>This information is used to:</p>

		<ul class="ml-6 list-disc">
			<li>Serve relevant advertisements to users</li>
			<li>Measure ad performance and effectiveness</li>
			<li>Prevent fraud and abuse in advertising</li>
		</ul>
		<p>We do not use this information for personal profiling or tracking across other websites.</p>

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
			MrMythical.com uses cookies through Google AdSense for advertising purposes. These cookies
			help serve relevant ads and measure campaign performance. You can view detailed information in
			our <Button class="p-0 text-[1.03rem] font-bold text-link" variant="link" href="/cookie">
				Cookie Policy
			</Button> and manage your preferences at any time.
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
