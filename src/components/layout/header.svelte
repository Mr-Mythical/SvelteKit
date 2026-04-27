<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';
	import { toggleMode } from 'mode-watcher';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import Menu from '@lucide/svelte/icons/menu';
	import X from '@lucide/svelte/icons/x';
	import AuthButton from '../authButton.svelte';

	let open = $state(false);

	const links = [
		{ href: '/', label: 'Home' },
		{ href: '/rating-calculator', label: 'Calculator' },
		{ href: '/raid', label: 'Raid' },
		{ href: '/about', label: 'About' }
	];

	const pathname = $derived(page.url.pathname);

	function isActive(href: string) {
		if (href === '/') return pathname === '/';
		return pathname === href || pathname.startsWith(href + '/');
	}

	function close() {
		open = false;
	}
</script>

<header class="site-header" class:is-open={open}>
	<div class="bar">
		<a href="/" class="brand" aria-label="Mr. Mythical home" onclick={close}>
			<img
				src={`${base}/Logo64x64.webp`}
				srcset={`${base}/Logo40x40.webp 40w, ${base}/Logo64x64.webp 64w, ${base}/Logo128x128.webp 128w`}
				sizes="32px"
				alt=""
				width="32"
				height="32"
				class="brand-mark"
				loading="eager"
				decoding="async"
			/>
			<span class="brand-name">Mr. Mythical</span>
		</a>

		<nav class="nav-desktop" aria-label="Primary">
			<ul>
				{#each links as link (link.href)}
					<li>
						<a
							href={link.href}
							class="nav-link"
							class:is-active={isActive(link.href)}
							aria-current={isActive(link.href) ? 'page' : undefined}
						>
							{link.label}
						</a>
					</li>
				{/each}
			</ul>
		</nav>

		<div class="bar-actions">
			<button
				type="button"
				class="icon-btn"
				onclick={toggleMode}
				aria-label="Toggle theme"
			>
				<span class="icon-wrap icon-sun"><Sun size={18} aria-hidden="true" /></span>
				<span class="icon-wrap icon-moon"><Moon size={18} aria-hidden="true" /></span>
			</button>

			<div class="auth-slot">
				<AuthButton />
			</div>

			<button
				type="button"
				class="icon-btn icon-btn--menu"
				onclick={() => (open = !open)}
				aria-label={open ? 'Close menu' : 'Open menu'}
				aria-expanded={open}
				aria-controls="mobile-nav"
			>
				{#if open}
					<X size={18} aria-hidden="true" />
				{:else}
					<Menu size={18} aria-hidden="true" />
				{/if}
			</button>
		</div>
	</div>

	{#if open}
		<div class="mobile" id="mobile-nav">
			<ul>
				{#each links as link (link.href)}
					<li>
						<a
							href={link.href}
							class="mobile-link"
							class:is-active={isActive(link.href)}
							aria-current={isActive(link.href) ? 'page' : undefined}
							onclick={close}
						>
							{link.label}
						</a>
					</li>
				{/each}
			</ul>
			<div class="mobile-auth">
				<AuthButton mobile />
			</div>
		</div>
	{/if}
</header>

<style>
	.site-header {
		position: sticky;
		top: 0;
		z-index: 50;
		background: hsl(var(--background));
		border-bottom: 1px solid hsl(var(--border));
	}

	.bar {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 24px;
		height: 56px;
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 24px;
	}

	@media (max-width: 720px) {
		.bar {
			padding: 0 16px;
			gap: 12px;
		}
	}

	/* ---- Brand ---- */

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		text-decoration: none;
		color: hsl(var(--foreground));
		border-radius: 6px;
		padding: 4px 6px;
		margin-left: -6px;
		min-width: 0;
	}

	.brand:focus-visible {
		outline: 2px solid hsl(var(--ring));
		outline-offset: 2px;
	}

	.brand-mark {
		width: 28px;
		height: 28px;
		border-radius: 6px;
		display: block;
		flex-shrink: 0;
	}

	.brand-name {
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: 1.125rem;
		letter-spacing: -0.01em;
		line-height: 1;
		white-space: nowrap;
	}

	/* ---- Desktop nav ---- */

	.nav-desktop {
		justify-self: center;
	}

	.nav-desktop ul {
		display: flex;
		gap: 2px;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.nav-link {
		font-family: var(--font-body);
		font-size: 0.875rem;
		font-weight: 500;
		color: hsl(var(--muted-foreground));
		text-decoration: none;
		padding: 8px 12px;
		border-radius: 6px;
		display: inline-flex;
		align-items: center;
		position: relative;
		transition: color 150ms cubic-bezier(0.25, 1, 0.5, 1);
	}

	.nav-link:hover {
		color: hsl(var(--foreground));
	}

	.nav-link.is-active {
		color: hsl(var(--foreground));
		font-weight: 700;
	}

	.nav-link.is-active::after {
		content: '';
		position: absolute;
		left: 12px;
		right: 12px;
		bottom: 2px;
		height: 2px;
		background: hsl(var(--link));
		border-radius: 2px;
	}

	.nav-link:focus-visible {
		outline: 2px solid hsl(var(--ring));
		outline-offset: 2px;
	}

	@media (max-width: 880px) {
		.nav-desktop {
			display: none;
		}
	}

	/* ---- Right cluster ---- */

	.bar-actions {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		justify-self: end;
	}

	.auth-slot {
		display: none;
	}

	@media (min-width: 880px) {
		.auth-slot {
			display: block;
			margin-left: 4px;
		}
	}

	.icon-btn {
		appearance: none;
		background: transparent;
		border: 1px solid transparent;
		width: 36px;
		height: 36px;
		border-radius: 6px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: hsl(var(--foreground));
		cursor: pointer;
		padding: 0;
		transition:
			background-color 150ms cubic-bezier(0.25, 1, 0.5, 1),
			color 150ms cubic-bezier(0.25, 1, 0.5, 1);
	}

	.icon-btn:hover {
		background: hsl(var(--secondary));
	}

	.icon-btn:focus-visible {
		outline: 2px solid hsl(var(--ring));
		outline-offset: 2px;
	}

	.icon-btn--menu {
		display: none;
	}

	@media (max-width: 880px) {
		.icon-btn--menu {
			display: inline-flex;
		}
	}

	.icon-wrap {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		line-height: 0;
	}

	.icon-moon {
		display: none;
	}

	:global(.dark) .icon-sun {
		display: none;
	}

	:global(.dark) .icon-moon {
		display: inline-flex;
	}

	/* ---- Mobile drawer ---- */

	.mobile {
		border-top: 1px solid hsl(var(--border));
		background: hsl(var(--background));
		padding: 8px 16px 16px;
	}

	.mobile ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
	}

	.mobile-link {
		font-family: var(--font-body);
		font-size: 1rem;
		font-weight: 500;
		color: hsl(var(--foreground));
		text-decoration: none;
		padding: 12px 8px;
		border-radius: 6px;
		display: block;
		border-bottom: 1px solid hsl(var(--border));
	}

	.mobile-link:last-child {
		border-bottom: none;
	}

	.mobile-link:hover,
	.mobile-link:focus-visible {
		background: hsl(var(--secondary));
		outline: none;
	}

	.mobile-link.is-active {
		font-weight: 700;
		color: hsl(var(--link));
	}

	.mobile-auth {
		margin-top: 12px;
		padding-top: 4px;
	}

	@media (min-width: 880px) {
		.mobile {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.nav-link,
		.icon-btn {
			transition: none;
		}
	}
</style>
