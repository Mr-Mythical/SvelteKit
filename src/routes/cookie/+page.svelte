<script lang="ts">
	import Header from '../../components/header.svelte';
	import SEO from '../../components/seo.svelte';
	import Footer from '../../components/footer.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
</script>

<SEO
	title="Cookie Policy - MrMythical.com"
	description="This Cookie Policy explains how MrMythical.com uses cookies, including those managed through CookieYes and Google Analytics."
	image="https://mrmythical.com/Logo.png"
/>

<Header />

<main>
	<article class="container mx-auto p-4 md:px-16 lg:px-52 xl:px-80">
		<h1 class="mb-2 text-2xl font-bold">Cookie Policy</h1>
		<p class="mb-4 text-sm italic">Updated: 17-Jun-2025</p>

		<h2 class="mb-4 mt-4 text-xl font-bold">What are Cookies?</h2>
		<p>
			Cookies are small text files stored on your device when a website is loaded in your browser.
			These cookies help us make the website function properly, enhance security, improve user
			experience, and understand how the website performs.
		</p>

		<h2 class="mb-4 mt-4 text-xl font-bold">How We Use Cookies</h2>
		<p>
			We use first-party and third-party cookies. First-party cookies are essential for basic site
			functionality and do not collect any personal data. Third-party cookies (like Google
			Analytics) help us understand how users interact with our site so we can make improvements.
		</p>

		<h2 class="mb-4 mt-4 text-xl font-bold">Cookies in Use</h2>

		<div class="cky-audit-table-element"></div>

		<h2 class="mb-4 mt-4 text-xl font-bold">Managing Cookie Preferences</h2>

		<Button>
			<span class="cky-banner-element">Cookie Settings</span>
		</Button>
		<br />

		<p>
			You can change your cookie preferences any time by clicking the above button. This will let
			you revisit the cookie consent banner and change your preferences or withdraw your consent
			right away.
		</p>
		<br />
		<p>
			In addition to this, different browsers provide different methods to block and delete cookies
			used by websites. You can change the settings of your browser to block/delete the cookies.
			Listed below are the links to the support documents on how to manage and delete cookies from
			the major web browsers.
		</p>
		<ul class="ml-6 list-disc">
			<li>
				<Button
					class="text-link p-0 text-[1.03rem] font-bold"
					variant="link"
					href="https://support.google.com/accounts/answer/32050"
					target="_blank"
				>
					Chrome
				</Button>
			</li>
			<li>
				<Button
					class="text-link p-0 text-[1.03rem] font-bold"
					variant="link"
					href="https://support.apple.com/en-in/guide/safari/sfri11471/mac"
					target="_blank"
				>
					Safari
				</Button>
			</li>
			<li>
				<Button
					class="text-link p-0 text-[1.03rem] font-bold"
					variant="link"
					href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox"
					target="_blank"
				>
					Firefox
				</Button>
			</li>
			<li>
				<Button
					class="text-link p-0 text-[1.03rem] font-bold"
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
					class="text-link p-0 text-[1.03rem] font-bold"
					variant="link"
					href="https://policies.google.com/technologies/cookies"
					target="_blank"
				>
					Google Cookies Policy
				</Button>
			</li>
			<li>
				<Button
					class="text-link p-0 text-[1.03rem] font-bold"
					variant="link"
					href="https://www.cookieyes.com/cookie-policy/"
					target="_blank"
				>
					CookieYes Policy
				</Button>
			</li>
		</ul>

		<h2 class="mb-4 mt-4 text-xl font-bold">Contact</h2>
		<p>
			If you have questions about our cookie policy, contact us at:
			<Button
				class="text-link p-0 text-[1.03rem] font-bold"
				variant="link"
				href="mailto:mythical@mrmythical.com"
				>mythical@mrmythical.com
			</Button>
		</p>
	</article>
</main>

<Footer />
