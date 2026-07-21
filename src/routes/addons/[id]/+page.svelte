<script lang="ts">
	import SEO from '../../../components/seo.svelte';
	import Footer from '../../../components/layout/footer.svelte';
	import ValidationSection from '../../../components/addons/validationSection.svelte';
	import { Button } from '$lib/components/ui/button';
	import { DISCORD_URL } from '$lib/data/addons';

	let { data } = $props();

	const addon = $derived(data.addon);
	const validation = $derived(data.validation);
</script>

<SEO
	title={addon.seoTitle}
	description={addon.seoDescription}
	image="https://mrmythical.com/Logo.png"
	keywords={addon.seoKeywords}
/>

<main class="home">
	<header class="page-header">
		<p class="page-eyebrow">
			<a href="/addons" class="crumb-link">WoW addons</a>
			<span class="crumb-sep" aria-hidden="true">/</span>
			{addon.name}
		</p>
		<h1 class="page-title">{addon.title}</h1>
		<p class="page-subhead">{addon.headline}</p>
		<p class="page-lede">{addon.blurb}</p>
		<div class="header-actions">
			<Button
				href={addon.links.curseforge}
				target="_blank"
				rel="noopener noreferrer"
				variant="default"
			>
				Download on CurseForge
			</Button>
			<Button href={addon.links.wago} target="_blank" rel="noopener noreferrer" variant="outline">
				Get it on Wago
			</Button>
			{#if addon.links.github}
				<a class="tool-link" href={addon.links.github} target="_blank" rel="noopener noreferrer">
					View source on GitHub
					<svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true" fill="none">
						<path
							d="M3 2l5 4-5 4"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</a>
			{/if}
		</div>
	</header>

	<section class="tools">
		<article class="tool-row">
			<div class="tool-copy">
				<p class="tool-eyebrow">About this WoW addon</p>
				<h2 class="tool-title">What {addon.name} does</h2>
				<p class="tool-body">{addon.description}</p>
			</div>
			<div class="tool-side">
				<p class="side-label">Get the addon</p>
				<div class="side-actions">
					<a
						class="addon-link"
						href={addon.links.curseforge}
						target="_blank"
						rel="noopener noreferrer">Download on CurseForge</a
					>
					<a
						class="addon-link addon-link--muted"
						href={addon.links.wago}
						target="_blank"
						rel="noopener noreferrer">Get it on Wago</a
					>
					{#if addon.links.github}
						<a
							class="addon-link addon-link--muted"
							href={addon.links.github}
							target="_blank"
							rel="noopener noreferrer">GitHub</a
						>
					{/if}
				</div>
			</div>
		</article>

		<article class="tool-row">
			<div class="tool-copy">
				<p class="tool-eyebrow">Features</p>
				<h2 class="tool-title">What you get in game</h2>
				<p class="tool-body">The main things this addon adds to World of Warcraft.</p>
			</div>
			<div class="tool-side">
				<ul class="feature-list">
					{#each addon.features as feature (feature)}
						<li>{feature}</li>
					{/each}
				</ul>
			</div>
		</article>

		{#if addon.commands?.length}
			<article class="tool-row">
				<div class="tool-copy">
					<p class="tool-eyebrow">Commands</p>
					<h2 class="tool-title">How to open {addon.name}</h2>
					<p class="tool-body">Slash commands once the addon is installed.</p>
				</div>
				<div class="tool-side">
					<ul class="command-list">
						{#each addon.commands as command (command)}
							<li><code>{command}</code></li>
						{/each}
					</ul>
				</div>
			</article>
		{/if}

		{#if validation}
			<article class="tool-row tool-row--validation">
				<ValidationSection data={validation} specs={data.validationSpecs} />
			</article>
		{/if}

		{#if addon.limitations?.length}
			<article class="tool-row">
				<div class="tool-copy">
					<p class="tool-eyebrow">Limits</p>
					<h2 class="tool-title">What {addon.name} does not do</h2>
					<p class="tool-body">Read this before you trust a close upgrade call.</p>
				</div>
				<div class="tool-side">
					<ul class="feature-list feature-list--muted">
						{#each addon.limitations as item (item)}
							<li>{item}</li>
						{/each}
					</ul>
				</div>
			</article>
		{/if}

		<article class="tool-row tool-row--addons">
			<div class="tool-copy">
				<p class="tool-eyebrow">More WoW addons</p>
				<h2 class="tool-title">Other Mr. Mythical addons</h2>
				<p class="tool-body">More Mythic+ and gearing tools from the same set.</p>
				<a href="/addons" class="tool-link">
					Browse all WoW addons
					<svg viewBox="0 0 12 12" width="10" height="10" aria-hidden="true" fill="none">
						<path
							d="M3 2l5 4-5 4"
							stroke="currentColor"
							stroke-width="1.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</a>
			</div>
			<ul class="addon-list">
				{#each data.others as other (other.id)}
					<li class="addon-item">
						<a class="addon-copy" href={`/addons/${other.id}`}>
							<p class="addon-name">{other.name}</p>
							<p class="addon-tagline">{other.headline}</p>
						</a>
						<div class="addon-links">
							<a href={`/addons/${other.id}`} class="addon-link">{other.ctaLabel}</a>
						</div>
					</li>
				{/each}
			</ul>
		</article>
	</section>

	<section class="discord" aria-labelledby="discord-heading">
		<div class="discord-copy">
			<p class="tool-eyebrow">Community</p>
			<h2 id="discord-heading" class="tool-title">Questions about {addon.name}?</h2>
			<p class="tool-body">Bug reports and feedback welcome on Discord.</p>
		</div>
		<div class="discord-actions">
			<Button href={DISCORD_URL} target="_blank" rel="noopener noreferrer" variant="default">
				Join the Discord
			</Button>
		</div>
	</section>
</main>

<Footer />

<style>
	.home {
		max-width: 1200px;
		margin: 0 auto;
		padding: 32px 24px 80px;
		display: flex;
		flex-direction: column;
		gap: 40px;
	}

	@media (max-width: 720px) {
		.home {
			padding: 16px 16px 48px;
			gap: 28px;
		}
	}

	.page-header {
		display: flex;
		flex-direction: column;
		gap: 6px;
		max-width: 72ch;
		padding-bottom: clamp(8px, 1.5vw, 16px);
	}

	.page-eyebrow {
		font-family: var(--font-body);
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: hsl(var(--link));
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
	}

	.crumb-link {
		color: inherit;
		text-decoration: none;
		border-bottom: 1px solid hsl(var(--primary));
		padding-bottom: 1px;
	}

	.crumb-link:hover {
		border-bottom-color: currentColor;
	}

	.crumb-sep {
		opacity: 0.55;
		letter-spacing: 0;
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

	.page-subhead {
		font-family: var(--font-heading);
		font-size: clamp(1.15rem, 2vw, 1.35rem);
		font-weight: 700;
		line-height: 1.25;
		letter-spacing: -0.01em;
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

	.header-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 10px 14px;
		margin-top: 10px;
	}

	.tools {
		display: flex;
		flex-direction: column;
	}

	.tool-row {
		display: grid;
		grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
		gap: clamp(24px, 4vw, 56px);
		padding: 36px 0;
		border-top: 1px solid hsl(var(--border));
		align-items: start;
	}

	.tool-row--addons {
		grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.25fr);
	}

	.tool-row--validation {
		grid-template-columns: 1fr;
	}

	@media (max-width: 800px) {
		.tool-row,
		.tool-row--addons {
			grid-template-columns: 1fr;
			gap: 20px;
			padding: 28px 0;
		}
	}

	.tool-copy,
	.tool-side {
		display: flex;
		flex-direction: column;
		gap: 10px;
		min-width: 0;
	}

	.tool-eyebrow {
		font-family: var(--font-body);
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: hsl(var(--link));
		margin: 0;
	}

	.tool-title {
		font-family: var(--font-heading);
		font-size: clamp(1.5rem, 2.4vw, 1.777rem);
		font-weight: 700;
		line-height: 1.15;
		letter-spacing: -0.015em;
		color: hsl(var(--foreground));
		margin: 0;
	}

	.tool-body {
		font-family: var(--font-body);
		font-size: 1rem;
		line-height: 1.55;
		color: hsl(var(--foreground));
		margin: 0;
		max-width: 56ch;
	}

	.tool-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin-top: 8px;
		font-family: var(--font-body);
		font-size: 0.9375rem;
		font-weight: 500;
		color: hsl(var(--foreground));
		text-decoration: none;
		border-bottom: 1px solid hsl(var(--primary));
		padding-bottom: 2px;
		width: fit-content;
		transition: color 150ms cubic-bezier(0.25, 1, 0.5, 1);
	}

	.tool-link:hover {
		color: hsl(var(--link));
		border-bottom-color: hsl(var(--link));
	}

	.side-label {
		font-family: var(--font-body);
		font-size: 0.75rem;
		font-weight: 500;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	.side-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px 14px;
	}

	.feature-list,
	.command-list,
	.addon-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
	}

	.feature-list {
		border-top: 1px solid hsl(var(--border));
	}

	.feature-list li {
		font-family: var(--font-body);
		font-size: 0.9375rem;
		line-height: 1.5;
		color: hsl(var(--foreground));
		padding: 12px 0;
		border-bottom: 1px solid hsl(var(--border));
	}

	.feature-list--muted li {
		color: hsl(var(--muted-foreground));
	}

	.command-list {
		border-top: 1px solid hsl(var(--border));
	}

	.command-list li {
		padding: 10px 0;
		border-bottom: 1px solid hsl(var(--border));
	}

	.command-list code {
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		font-size: 0.875rem;
		color: hsl(var(--foreground));
	}

	.addon-list {
		border-top: 1px solid hsl(var(--border));
	}

	.addon-item {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 12px 20px;
		align-items: center;
		padding: 14px 0;
		border-bottom: 1px solid hsl(var(--border));
	}

	.addon-copy {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
		text-decoration: none;
		color: inherit;
	}

	.addon-copy:hover .addon-name {
		color: hsl(var(--link));
	}

	.addon-name {
		font-family: var(--font-heading);
		font-size: 1.0625rem;
		font-weight: 700;
		letter-spacing: -0.01em;
		line-height: 1.2;
		color: hsl(var(--foreground));
		margin: 0;
		transition: color 150ms cubic-bezier(0.25, 1, 0.5, 1);
	}

	.addon-tagline {
		font-family: var(--font-body);
		font-size: 0.875rem;
		line-height: 1.45;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	.addon-links {
		display: flex;
		flex-wrap: wrap;
		gap: 8px 14px;
		justify-content: flex-end;
	}

	.addon-link {
		font-family: var(--font-body);
		font-size: 0.8125rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		text-decoration: none;
		border-bottom: 1px solid hsl(var(--primary));
		padding-bottom: 1px;
		transition: color 150ms cubic-bezier(0.25, 1, 0.5, 1);
	}

	.addon-link--muted {
		font-weight: 500;
		color: hsl(var(--muted-foreground));
		border-bottom-color: hsl(var(--border));
	}

	.addon-link:hover {
		color: hsl(var(--link));
		border-bottom-color: hsl(var(--link));
	}

	@media (max-width: 560px) {
		.addon-item {
			grid-template-columns: 1fr;
			gap: 8px;
		}

		.addon-links {
			justify-content: flex-start;
		}
	}

	.discord {
		display: grid;
		grid-template-columns: minmax(0, 1.4fr) auto;
		gap: clamp(20px, 3vw, 40px);
		align-items: center;
		padding: 28px 0;
		border-top: 1px solid hsl(var(--border));
		border-bottom: 1px solid hsl(var(--border));
	}

	.discord-copy {
		display: flex;
		flex-direction: column;
		gap: 10px;
		min-width: 0;
	}

	.discord-actions {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 12px;
	}

	@media (max-width: 720px) {
		.discord {
			grid-template-columns: 1fr;
			gap: 16px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.tool-link,
		.addon-link,
		.addon-name {
			transition: none;
		}
	}
</style>
