<script lang="ts">
	import { recentCharacters, type RecentCharacter } from '$lib/utils/recentCharacters';
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import {
		usRealmOptions,
		euRealmOptions,
		krRealmOptions,
		twRealmOptions
	} from '$lib/types/realms';
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import Loader2 from 'lucide-svelte/icons/loader-2';

	let characters: RecentCharacter[] = [];
	let isLoading = true;

	const unsubscribe = recentCharacters.subscribe((value) => {
		characters = value;
	});

	const unsubscribeLoading = recentCharacters.loading.subscribe((value) => {
		isLoading = value;
	});

	$: session = $page.data.session;

	onMount(async () => {
		// Initialize by loading from API
		await recentCharacters.init();
	});

	onDestroy(() => {
		unsubscribe();
		unsubscribeLoading();
	});

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

	export let loadCharacter: (character: RecentCharacter) => void;
</script>

<Card class="recent-characters space-y-4 p-4">
	<h3 class="text-lg font-semibold">Recent Characters</h3>
	<div class="space-y-2">
		{#if isLoading && session}
			<div class="py-4 text-center">
				<Loader2 class="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
				<p class="mt-2 text-sm text-muted-foreground">Loading recent characters...</p>
			</div>
		{:else if !session}
			<div class="py-4 text-center text-muted-foreground">
				<p class="text-sm">Login to sync recent characters across devices</p>
			</div>
		{:else if characters.length === 0}
			<div class="py-4 text-center text-muted-foreground">
				<p class="text-sm">No recent character searches yet</p>
			</div>
		{:else}
			{#each characters as char (char.characterName + char.realm + char.region)}
				<div class="animate-in fade-in-0 slide-in-from-top-2 duration-300">
					<Button
						variant="outline"
						class="w-full justify-between text-left"
						on:click={() => loadCharacter(char)}
					>
						<div>
							<span class="font-medium">
								{char.characterName.charAt(0).toUpperCase() + char.characterName.slice(1)}
							</span>
							<span class="text-muted"> - {getRealmLabel(char.region, char.realm)}</span>
						</div>
						<span class="text-sm text-muted">({char.region.toUpperCase()})</span>
					</Button>
				</div>
			{/each}
		{/if}
	</div>
</Card>
