<script lang="ts">
	import { recentCharacters, type RecentCharacter } from '$lib/stores/recentCharacters';
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { signIn } from '@auth/sveltekit/client';
	import {
		usRealmOptions,
		euRealmOptions,
		krRealmOptions,
		twRealmOptions
	} from '$lib/types/realms';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import Loader2 from '@lucide/svelte/icons/loader-2';
	import LogIn from '@lucide/svelte/icons/log-in';
	import RefreshCw from '@lucide/svelte/icons/refresh-cw';
	import { toast } from 'svelte-sonner';
	import { myWowCharacters, type MyWowCharacter } from '$lib/data/myWowCharacters';

	let characters: RecentCharacter[] = $state([]);
	let isLoading = $state(true);
	let bnetCharacters: MyWowCharacter[] = $state([]);
	let bnetLoading = $state(false);
	let bnetLoaded = $state(false);
	let bnetHasAccount = $state(false);
	let bnetHasScope = $state(false);
	let isSigningIn = $state(false);

	// Minimum level for Battle.net characters to show
	const MIN_BNET_LEVEL = 90;

	// Helper to create a unique key for a character
	function characterKey(region: string, realm: string, name: string): string {
		return `${region.toLowerCase()}-${realm.toLowerCase()}-${name.toLowerCase()}`;
	}

	function getVisibleBnetCharacters(): MyWowCharacter[] {
		return bnetCharacters
			.filter((character) => character.level >= MIN_BNET_LEVEL)
			.slice()
			.sort((a, b) => b.level - a.level);
	}

	// Only dedupe recents if the Battle.net character is level 90+
	function getBnetKeys(): Set<string> {
		return new Set(
			bnetCharacters
				.filter((character) => character.level >= MIN_BNET_LEVEL)
				.map((character) =>
					characterKey(character.region, character.realm, character.characterName)
				)
		);
	}

	// If a recent matches a Battle.net character but that character is not level 90+, hide it from both lists
	function getVisibleRecentCharacters(): RecentCharacter[] {
		// Build a map of all Battle.net characters by key
		const bnetMap = new Map<string, MyWowCharacter>();
		for (const bnetChar of bnetCharacters) {
			bnetMap.set(characterKey(bnetChar.region, bnetChar.realm, bnetChar.characterName), bnetChar);
		}
		return characters.filter((character) => {
			const key = characterKey(character.region, character.realm, character.characterName);
			const bnetChar = bnetMap.get(key);
			// If there is a Battle.net character with this key and it's not level 90+, hide it
			if (bnetChar && bnetChar.level < MIN_BNET_LEVEL) return false;
			// If there is a Battle.net character with this key and it's level 90+, dedupe (hide from recents)
			if (bnetChar && bnetChar.level >= MIN_BNET_LEVEL) return false;
			// Otherwise, show the recent
			return true;
		});
	}

	// Handler to load a Battle.net character as a recent
	function loadFromBnet(character: MyWowCharacter) {
		loadCharacter({
			characterName: character.characterName,
			realm: character.realm,
			region: character.region
		});
	}

	const unsubscribe = recentCharacters.subscribe((value) => {
		characters = value;
	});

	const unsubscribeLoading = recentCharacters.loading.subscribe((value) => {
		isLoading = value;
	});

	const unsubscribeBnet = myWowCharacters.subscribe((state) => {
		bnetCharacters = state.characters;
		bnetLoaded = state.loaded;
		bnetHasAccount = state.hasAccount;
		bnetHasScope = state.hasScope;
	});

	const unsubscribeBnetLoading = myWowCharacters.loading.subscribe((value) => {
		bnetLoading = value;
	});

	let session = $derived(page.data.session);

	onMount(async () => {
		// Load Battle.net characters first to ensure deduplication is correct on first render
		await myWowCharacters.init();
		await recentCharacters.init();
	});

	onDestroy(() => {
		unsubscribe();
		unsubscribeLoading();
		unsubscribeBnet();
		unsubscribeBnetLoading();
	});

	async function syncRecents() {
		try {
			await recentCharacters.init();
			toast.success('Recent characters synced.');
		} catch (error) {
			toast.error('Failed to sync recent characters.');
		}
	}

	async function syncBnet() {
		try {
			await myWowCharacters.refresh();
			toast.success('Battle.net roster refreshed.');
		} catch (error) {
			console.error('recentCharacters: bnet sync failed', error);
			toast.error('Failed to refresh Battle.net roster.');
		}
	}

	async function loginWithBattleNet() {
		isSigningIn = true;
		try {
			await signIn('battlenet');
		} catch (error) {
			console.error('recentCharacters: sign-in failed', error);
			toast.error('Failed to start Battle.net sign-in.');
			isSigningIn = false;
		}
	}

	function getRealmLabel(region: string, realmValue: string): string {
		const realmOptions =
			region === 'us'
				? usRealmOptions
				: region === 'eu'
					? euRealmOptions
					: region === 'kr'
						? krRealmOptions
						: twRealmOptions;

		const realm = realmOptions.find((r) => r.value === realmValue);
		return realm ? realm.label : realmValue;
	}

	interface Props {
		loadCharacter: (character: RecentCharacter) => void;
	}

	let { loadCharacter }: Props = $props();
</script>

{#if !session || (session && bnetHasAccount && getVisibleBnetCharacters().length > 0) || getVisibleRecentCharacters().length > 0}
	<Card class="recent-characters space-y-4 p-4">
		{#if !session}
			<section class="space-y-3">
				<h3 class="text-lg font-semibold">Quick Import with Battle.net</h3>
				<p class="text-muted-foreground text-sm">
					Sign in to quickly access your own characters and import without typing each one.
				</p>
				<Button
					variant="default"
					onclick={loginWithBattleNet}
					disabled={isSigningIn}
					class="w-full sm:w-auto"
				>
					{#if isSigningIn}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						Redirecting to Battle.net...
					{:else}
						<LogIn class="mr-2 h-4 w-4" />
						Quick Import with Battle.net
					{/if}
				</Button>
			</section>
		{/if}

		{#if session && bnetHasAccount && getVisibleBnetCharacters().length > 0}
			<section class="space-y-2">
				<header class="flex items-center justify-between">
					<h3 class="text-lg font-semibold">Battle.net Characters</h3>
					<Button
						variant="ghost"
						size="icon"
						class="h-7 w-7"
						title="Sync from Battle.net"
						onclick={syncBnet}
						disabled={bnetLoading}
					>
						<RefreshCw class={bnetLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
						<span class="sr-only">Sync from Battle.net</span>
					</Button>
				</header>
				{#if bnetLoading && !bnetLoaded}
					<div class="py-4 text-center">
						<Loader2 class="text-muted-foreground mx-auto h-6 w-6 animate-spin" />
						<p class="text-muted-foreground mt-2 text-sm">Loading Battle.net characters...</p>
					</div>
				{:else if !bnetHasScope}
					<p class="text-muted-foreground text-sm">
						Re-link Battle.net with the WoW profile scope to see your characters here.
					</p>
				{:else}
					<div class="space-y-2">
						{#each getVisibleBnetCharacters() as char (characterKey(char.region, char.realm, char.characterName))}
							<div class="animate-in fade-in-0 slide-in-from-top-2 duration-300">
								<Button
									variant="outline"
									class="w-full justify-between text-left"
									onclick={() => loadFromBnet(char)}
								>
									<div class="min-w-0">
										<span class="font-medium">
											{char.characterName.charAt(0).toUpperCase() + char.characterName.slice(1)}
										</span>
										<span class="text-muted">
											- {char.realmName || getRealmLabel(char.region, char.realm)}
										</span>
									</div>
									{#if typeof char.score === 'number'}
										<span
											class="shrink-0 text-sm font-semibold"
											style={char.scoreColor ? `color: ${char.scoreColor};` : ''}
										>
											{char.score.toFixed(1)}
										</span>
									{:else}
										<span class="text-muted shrink-0 text-sm">-</span>
									{/if}
								</Button>
							</div>
						{/each}
					</div>
				{/if}
			</section>
		{/if}
		{#if getVisibleRecentCharacters().length > 0}
			<section class="space-y-2">
				<header class="flex items-center justify-between">
					<h3 class="text-lg font-semibold">Recent Imports</h3>
				</header>
				<div class="space-y-2">
					{#each getVisibleRecentCharacters() as char (char.characterName + char.realm + char.region)}
						<div class="animate-in fade-in-0 slide-in-from-top-2 duration-300">
							<Button
								variant="outline"
								class="w-full justify-between text-left"
								onclick={() => loadCharacter(char)}
							>
								<div>
									<span class="font-medium">
										{char.characterName.charAt(0).toUpperCase() + char.characterName.slice(1)}
									</span>
									<span class="text-muted"> - {getRealmLabel(char.region, char.realm)}</span>
								</div>
							</Button>
						</div>
					{/each}
				</div>
			</section>
		{/if}
	</Card>
{/if}
