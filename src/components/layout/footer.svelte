<script lang="ts">
	const currentYear = new Date().getFullYear();

	const product = [
		{ href: '/rating-calculator', label: 'Calculator' },
		{ href: '/raid', label: 'Raid' }
	];

	const site = [
		{ href: '/about', label: 'About' },
		{ href: '/privacy', label: 'Privacy' },
		{ href: '/cookie', label: 'Cookies' }
	];

	const community = [
		{ href: 'https://github.com/Mr-Mythical/SvelteKit', label: 'GitHub', external: true },
		{ href: 'https://www.patreon.com/MrMythical', label: 'Patreon', external: true },
		{ href: 'https://discord.gg/hvREYuvJ6w', label: 'Discord', external: true }
	];
</script>

<footer class="site-footer">
	<div class="inner">
		<div class="cols">
			<div class="col col--brand">
				<p class="brand">Mr. Mythical</p>
				<p class="col-label">Mythic+ and raid tools for World of Warcraft</p>
			</div>

			<nav class="col" aria-label="Tools">
				<p class="col-label">Tools</p>
				<ul>
					{#each product as link (link.href)}
						<li><a href={link.href}>{link.label}</a></li>
					{/each}
				</ul>
			</nav>

			<nav class="col" aria-label="Site">
				<p class="col-label">Site</p>
				<ul>
					{#each site as link (link.href)}
						<li><a href={link.href}>{link.label}</a></li>
					{/each}
				</ul>
			</nav>

			<nav class="col" aria-label="Community">
				<p class="col-label">Community</p>
				<ul>
					{#each community as link (link.href)}
						<li>
							<a
								href={link.href}
								target={link.external ? '_blank' : undefined}
								rel={link.external ? 'noopener noreferrer' : undefined}
							>
								{link.label}
							</a>
						</li>
					{/each}
				</ul>
			</nav>
		</div>

		<div class="legal">
			<p class="legal-line">
				© {currentYear} Mr. Mythical. Data via
				<a href="https://www.warcraftlogs.com" target="_blank" rel="noopener noreferrer"
					>Warcraft Logs</a
				>
				and <a href="https://raider.io" target="_blank" rel="noopener noreferrer">Raider.io</a>.
			</p>
			<p class="legal-disclaimer">
				World of Warcraft is a trademark of Blizzard Entertainment. This site is not affiliated with
				or endorsed by Blizzard.
			</p>
		</div>
	</div>
</footer>

<style>
	.site-footer {
		margin-top: 80px;
		border-top: 1px solid hsl(var(--border));
		background: hsl(var(--background));
	}

	@media (max-width: 720px) {
		.site-footer {
			margin-top: 56px;
		}
	}

	.inner {
		max-width: 1400px;
		margin: 0 auto;
		padding: 40px 24px 32px;
		display: flex;
		flex-direction: column;
		gap: 32px;
	}

	@media (max-width: 720px) {
		.inner {
			padding: 32px 16px 24px;
		}
	}

	.cols {
		display: grid;
		grid-template-columns: 1.4fr repeat(3, minmax(0, 1fr));
		gap: 32px;
	}

	@media (max-width: 720px) {
		.cols {
			grid-template-columns: 1fr 1fr;
			gap: 24px;
		}

		.col--brand {
			grid-column: 1 / -1;
		}
	}

	.col {
		display: flex;
		flex-direction: column;
		gap: 12px;
		min-width: 0;
	}

	.brand {
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: 1.125rem;
		color: hsl(var(--foreground));
		margin: 0;
		letter-spacing: -0.01em;
	}

	.col-label {
		font-family: var(--font-body);
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	.col ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.col a {
		font-family: var(--font-body);
		font-size: 0.875rem;
		color: hsl(var(--foreground));
		text-decoration: none;
		transition: color 150ms cubic-bezier(0.25, 1, 0.5, 1);
		border-radius: 4px;
	}

	.col a:hover {
		color: hsl(var(--link));
	}

	.col a:focus-visible {
		outline: 2px solid hsl(var(--ring));
		outline-offset: 3px;
	}

	.legal {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding-top: 24px;
		border-top: 1px solid hsl(var(--border));
	}

	.legal-line,
	.legal-disclaimer {
		font-family: var(--font-body);
		font-size: 0.75rem;
		line-height: 1.5;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	.legal-line a {
		color: hsl(var(--muted-foreground));
		text-decoration: underline;
		text-underline-offset: 2px;
		text-decoration-color: hsl(var(--border));
		transition: color 150ms cubic-bezier(0.25, 1, 0.5, 1);
	}

	.legal-line a:hover {
		color: hsl(var(--link));
		text-decoration-color: hsl(var(--link));
	}

	.legal-line a:focus-visible {
		outline: 2px solid hsl(var(--ring));
		outline-offset: 2px;
		border-radius: 2px;
	}

	@media (prefers-reduced-motion: reduce) {
		.col a,
		.legal-line a {
			transition: none;
		}
	}
</style>
