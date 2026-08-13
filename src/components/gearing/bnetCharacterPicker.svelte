<script lang="ts">
	/**
	 * Battle.net roster picker for /gearing — characters only (no score, no recents).
	 */
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { signIn } from '@auth/sveltekit/client';
	import {
		usRealmOptions,
		euRealmOptions,
		krRealmOptions,
		twRealmOptions
	} from '$lib/types/realms';
	import { Button } from '$lib/components/ui/button';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import LogIn from '@lucide/svelte/icons/log-in';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import { toast } from 'svelte-sonner';
	import { myWowCharacters, type MyWowCharacter } from '$lib/data/myWowCharacters';
	import { getClassColor } from '$lib/ui/classColors';
	import { logClientError } from '$lib/clientLog';

	export type GearingRosterPick = {
		characterName: string;
		region: string;
		realm: string;
		className?: string | null;
	};

	interface Props {
		loadCharacter: (character: GearingRosterPick) => void;
		/** Disable picks while Armory load is in flight. */
		disabled?: boolean;
	}

	let { loadCharacter, disabled = false }: Props = $props();

	const MIN_LEVEL = 90;

	let characters = $state<MyWowCharacter[]>([]);
	let loaded = $state(false);
	let hasAccount = $state(false);
	let hasScope = $state(false);
	let listLoading = $state(false);
	let signingIn = $state(false);

	const session = $derived(page.data.session);
	const roster = $derived(
		characters
			.filter((c) => c.level >= MIN_LEVEL)
			.slice()
			.sort((a, b) => {
				const byLevel = b.level - a.level;
				if (byLevel !== 0) return byLevel;
				return a.characterName.localeCompare(b.characterName);
			})
	);

	const unsub = myWowCharacters.subscribe((state) => {
		characters = state.characters;
		loaded = state.loaded;
		hasAccount = state.hasAccount;
		hasScope = state.hasScope;
	});
	const unsubLoading = myWowCharacters.loading.subscribe((v) => {
		listLoading = v;
	});

	onMount(() => {
		void myWowCharacters.init();
	});

	onDestroy(() => {
		unsub();
		unsubLoading();
	});

	function characterKey(c: MyWowCharacter): string {
		return `${c.region}-${c.realm}-${c.characterName}`.toLowerCase();
	}

	function displayName(name: string): string {
		if (!name) return name;
		return name.charAt(0).toUpperCase() + name.slice(1);
	}

	function realmLabel(region: string, realmSlug: string, realmName?: string): string {
		if (realmName) return realmName;
		const options =
			region === 'us'
				? usRealmOptions
				: region === 'eu'
					? euRealmOptions
					: region === 'kr'
						? krRealmOptions
						: twRealmOptions;
		return options.find((r) => r.value === realmSlug)?.label ?? realmSlug;
	}

	async function login() {
		signingIn = true;
		try {
			await signIn('battlenet');
		} catch (error) {
			logClientError('gearing/bnetPicker', 'sign-in failed', error);
			toast.error('Failed to start Battle.net sign-in.');
			signingIn = false;
		}
	}

	async function refresh() {
		try {
			await myWowCharacters.refresh();
			toast.success('Battle.net roster refreshed.');
		} catch (error) {
			logClientError('gearing/bnetPicker', 'roster refresh failed', error);
			toast.error('Failed to refresh Battle.net roster.');
		}
	}

	function pick(char: MyWowCharacter) {
		if (disabled) return;
		loadCharacter({
			characterName: char.characterName,
			realm: char.realm,
			region: char.region,
			className: char.className
		});
	}
</script>

{#if !session}
	<div class="bnet-picker">
		<p class="bnet-picker-lead">Sign in with Battle.net to load a character from your roster.</p>
		<Button type="button" variant="default" onclick={login} disabled={signingIn}>
			{#if signingIn}
				<Loader2 class="mr-2 h-4 w-4 animate-spin" />
				Redirecting…
			{:else}
				<LogIn class="mr-2 h-4 w-4" />
				Sign in with Battle.net
			{/if}
		</Button>
	</div>
{:else}
	<div class="bnet-picker">
		<header class="bnet-picker-header">
			<p class="meta-line">Level {MIN_LEVEL}+</p>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				class="h-8 w-8"
				title="Refresh roster"
				onclick={refresh}
				disabled={listLoading || disabled}
			>
				<RefreshCw class={listLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
				<span class="sr-only">Refresh roster</span>
			</Button>
		</header>

		{#if !loaded}
			<div class="bnet-picker-empty">
				<Loader2 class="text-muted-foreground mx-auto h-5 w-5 animate-spin" />
				<p class="meta-line">Loading roster…</p>
			</div>
		{:else if !hasAccount}
			<p class="meta-line">
				No Battle.net account is linked to this session. Sign in again, or load a character manually
				below.
			</p>
			<Button type="button" variant="outline" size="sm" onclick={login} disabled={signingIn}>
				Sign in with Battle.net
			</Button>
		{:else if !hasScope}
			<p class="meta-line">Re-link Battle.net with the WoW profile scope to see your characters.</p>
			<Button type="button" variant="outline" size="sm" onclick={login} disabled={signingIn}>
				Re-link Battle.net
			</Button>
		{:else if roster.length === 0}
			<p class="meta-line">
				No level {MIN_LEVEL}+ characters found. Refresh your roster or load manually below.
			</p>
		{:else}
			<ul class="bnet-char-list">
				{#each roster as char (characterKey(char))}
					<li>
						<button type="button" class="bnet-char-btn" {disabled} onclick={() => pick(char)}>
							<span class="bnet-char-main">
								<span
									class="bnet-char-name"
									style={`color: ${getClassColor(char.className, 'inherit')};`}
								>
									{displayName(char.characterName)}
								</span>
								<span class="bnet-char-meta">
									{char.className || 'Unknown'} · Lv {char.level} ·
									{realmLabel(char.region, char.realm, char.realmName)}
									({char.region.toUpperCase()})
								</span>
							</span>
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
{/if}

<style>
	.bnet-picker {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.bnet-picker-lead {
		margin: 0;
		font-family: var(--font-body);
		font-size: 0.9375rem;
		line-height: 1.5;
		color: hsl(var(--muted-foreground));
	}

	.bnet-picker-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}

	.bnet-picker-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 16px 0;
	}

	.bnet-char-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		max-height: 280px;
		overflow-y: auto;
		border-top: 1px solid hsl(var(--border));
	}

	.bnet-char-btn {
		appearance: none;
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 12px 4px;
		border: 0;
		border-bottom: 1px solid hsl(var(--border));
		border-radius: 0;
		background: transparent;
		text-align: left;
		cursor: pointer;
		transition: background-color 150ms ease;
	}

	.bnet-char-btn:hover:not(:disabled) {
		background: hsl(var(--muted) / 0.5);
	}

	.bnet-char-btn:focus-visible {
		outline: 2px solid hsl(var(--link));
		outline-offset: -2px;
	}

	.bnet-char-btn:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.bnet-char-main {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.bnet-char-name {
		font-family: var(--font-heading);
		font-size: 0.9375rem;
		font-weight: 600;
		letter-spacing: -0.01em;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.bnet-char-meta {
		font-family: var(--font-body);
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.meta-line {
		margin: 0;
		font-family: var(--font-body);
		font-size: 0.8125rem;
		line-height: 1.45;
		color: hsl(var(--muted-foreground));
	}
</style>
