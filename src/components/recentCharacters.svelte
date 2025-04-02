<!-- RecentCharacters.svelte -->
<script lang="ts">
    import { recentCharacters, type RecentCharacter } from '$lib/utils/recentCharacters';
    import { onDestroy } from 'svelte';
    import { usRealmOptions, euRealmOptions, krRealmOptions, twRealmOptions } from '$lib/types/realms';
    import { Card } from '$lib/components/ui/card';
    import { Button } from '$lib/components/ui/button';

    let characters: RecentCharacter[] = [];
    const unsubscribe = recentCharacters.subscribe((value) => {
        characters = value;
    });

    onDestroy(() => {
        unsubscribe();
    });

    // Function to get the realm label based on the region and realm value
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
        return realm ? realm.label : realmValue; // Fallback to value if label is not found
    }

    export let loadCharacter: (character: RecentCharacter) => void;
</script>

{#if characters.length}
    <Card class="recent-characters p-4 space-y-4">
        <h3 class="text-lg font-semibold">Recent Characters</h3>
        <div class="space-y-2">
            {#each characters as char}
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
            {/each}
        </div>
    </Card>
{/if}