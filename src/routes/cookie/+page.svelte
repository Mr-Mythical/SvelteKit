<script lang="ts">
	import Header from '../../components/header.svelte';
	import SEO from '../../components/seo.svelte';
	import Footer from '../../components/footer.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
</script>

<SEO
	title="Cookie Policy - MrMythical.com"
	description="This Cookie Policy explains how
MrMythical.com uses cookies for advertising through Google AdSense."
	image="https://mrmythical.com/Logo.png"
/>

<Header />

<main>
	<article class="container mx-auto p-4 md:px-16 lg:px-52 xl:px-80">
		<h1 class="mb-2 text-2xl font-bold">Cookie Policy</h1>
		<p class="mb-4 text-sm italic">Updated: 1-Oct-2025</p>

		<h2 class="mb-4 mt-4 text-xl font-bold">What are Cookies?</h2>
		<p>
			Cookies are small text files stored on your device when a website is loaded in your browser.
			These cookies help us make the website function properly, enhance security, improve user
			experience, and understand how the website performs.
		</p>

		<h2 class="mb-4 mt-4 text-xl font-bold">How We Use Cookies</h2>
		<p>
			We use third-party cookies through Google AdSense for advertising purposes. These cookies help
			serve relevant ads, measure ad performance, and prevent fraud. We do not use cookies for
			analytics or tracking beyond advertising.
		</p>

		<h2 class="mb-4 mt-4 text-xl font-bold">Managing Cookie Preferences</h2>

		<p>
			You can opt out of personalized advertising by visiting Google's Ad Settings page or using
			tools like the Network Advertising Initiative opt-out. Advertising cookies can be managed
			through your browser settings.
		</p>
		<br />
		<p>
			You can also manage cookies through your browser settings. Different browsers provide
			different methods to block and delete cookies used by websites. You can change the settings of
			your browser to block/delete the cookies. Listed below are the links to the support documents
			on how to manage and delete cookies from the major web browsers.
		</p>
		<ul class="ml-6 list-disc">
			<li>
				<Button
					class="p-0 text-[1.03rem] font-bold text-link"
					variant="link"
					href="https://support.google.com/accounts/answer/32050"
					target="_blank"
				>
					Chrome
				</Button>
			</li>
			<li>
				<Button
					class="p-0 text-[1.03rem] font-bold text-link"
					variant="link"
					href="https://support.apple.com/en-in/guide/safari/sfri11471/mac"
					target="_blank"
				>
					Safari
				</Button>
			</li>
			<li>
				<Button
					class="p-0 text-[1.03rem] font-bold text-link"
					variant="link"
					href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox"
					target="_blank"
				>
					Firefox
				</Button>
			</li>
			<li>
				<Button
					class="p-0 text-[1.03rem] font-bold text-link"
					variant="link"
					href="https://support.microsoft.com/en-us/topic/how-to-delete-cookie-files-in-internet-explorer-bca9446f-d873-78de-77ba-d42645fa52fc"
					target="_blank"
				>
					Internet Explorer
				</Button>
			</li>
		</ul>

		<h2 class="mb-4 mt-4 text-xl font-bold">Third-Party Policies</h2>
		<ul class="ml-6 list-disc">
			<li>
				<Button
					class="p-0 text-[1.03rem] font-bold text-link"
					variant="link"
					href="https://policies.google.com/technologies/ads"
					target="_blank"
				>
					Google Advertising Privacy Policy
				</Button>
			</li>
		</ul>

		<h2 class="mb-4 mt-4 text-xl font-bold">Contact</h2>
		<p>
			If you have questions about our cookie policy, contact us at:
			<Button
				class="p-0 text-[1.03rem] font-bold text-link"
				variant="link"
				href="mailto:mythical@mrmythical.com"
				>mythical@mrmythical.com
			</Button>
		</p>
	</article>
</main>

<Footer />
