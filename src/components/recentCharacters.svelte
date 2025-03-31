<!-- RecentCharacters.svelte -->
<script lang="ts">
	import { recentCharacters, type RecentCharacter } from '$lib/utils/recentCharacters';
	import { onMount, onDestroy } from 'svelte';

	// Optionally, subscribe to the store
	let characters: RecentCharacter[] = [];
	const unsubscribe = recentCharacters.subscribe((value) => {
		characters = value;
	});
	
	// Clean up if necessary (for components that might be destroyed)
	onDestroy(() => {
		unsubscribe();
	});

	// Function to load character data when a recent character is clicked.
	// Assume you have functions fetchRuns() and fetchWowSummary() imported.
	export let loadCharacter: (character: RecentCharacter) => void;
</script>

{#if characters.length}
	<div class="recent-characters">
		<h3>Recent Characters</h3>
		{#each characters as char}
			<button on:click={() => loadCharacter(char)} class="recent-character-button">
				{char.characterName.charAt(0).toUpperCase() + char.characterName.slice(1)} - 
				{char.realm.charAt(0).toUpperCase() + char.realm.slice(1).replace('-', ' ')} 
				({char.region})
			</button>
		{/each}
	</div>
{/if}