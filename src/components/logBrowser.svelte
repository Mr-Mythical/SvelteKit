<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	// Make sure all Select components are imported correctly as per your $lib/components/ui/select/index.ts
	import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select'; //
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { bosses as bossList } from '$lib/types/bossData';
	import { classSpecAbilities } from '$lib/types/classData';

	export let loading = false;

	// For Select.Root, we need to manage an object for the selected item,
	// or handle the change event to update selectedBossId.
	// selectedBossId will store the actual numeric ID.
	let selectedBossId: number | undefined = undefined;

	// This will hold the object { value: number, label: string } for the Select component
	let selectedBossObject: { value: number; label: string } | undefined = undefined;

	let minDuration: number | undefined = undefined;
	let maxDuration: number | undefined = undefined;
	let selectedHealerSpecs: string[] = [];

	const dispatch = createEventDispatcher();

	const healerOptions: { value: string; label: string }[] = [];
	for (const className in classSpecAbilities) {
		// @ts-ignore
		const specs = classSpecAbilities[className];
		for (const specName in specs) {
			if (['Restoration', 'Preservation', 'Mistweaver', 'Holy', 'Discipline'].includes(specName)) {
				healerOptions.push({ value: `${className}-${specName}`, label: `${className} - ${specName}` });
			}
		}
	}
	healerOptions.sort((a,b) => a.label.localeCompare(b.label));

	function handleSearch() {
		dispatch('search', {
			bossId: selectedBossId,
			minDuration: minDuration,
			maxDuration: maxDuration,
			healerSpecs: selectedHealerSpecs.length > 0 ? selectedHealerSpecs : undefined,
		});
	}

	function handleHealerSpecChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		selectedHealerSpecs = Array.from(target.selectedOptions, option => option.value);
	}

	// Handler for when the selected boss changes
	function handleBossChange(selected: { value: number; label?: string } | undefined) {
		if (selected) {
			selectedBossObject = { value: selected.value, label: selected.label ?? '' }; // Ensure label is always a string
			selectedBossId = selected.value;
		} else {
			selectedBossObject = undefined;
			selectedBossId = undefined;
		}
	}

</script>

<Card class="w-full">
	<CardHeader>
		<CardTitle>Browse Raid Logs</CardTitle>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
			<div>
				<Label for="boss-select">Boss</Label>
                <Select
                    selected={selectedBossObject}
                    onSelectedChange={handleBossChange}
                >
					<SelectTrigger id="boss-select" class="w-full mt-1">
						<SelectValue placeholder="Any Boss" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={undefined} label="Any Boss" class="italic text-muted-foreground">Any Boss</SelectItem>
						{#each bossList as boss (boss.id)}
                            <SelectItem value={boss.id} label={boss.name}>{boss.name}</SelectItem>
						{/each}
					</SelectContent>
				</Select>
			</div>

			<div>
				<Label for="min-duration">Min Duration (sec)</Label>
				<Input id="min-duration" type="number" placeholder="e.g., 180" bind:value={minDuration} class="w-full mt-1" />
			</div>
			<div>
				<Label for="max-duration">Max Duration (sec)</Label>
				<Input id="max-duration" type="number" placeholder="e.g., 600" bind:value={maxDuration} class="w-full mt-1" />
			</div>

			<div>
				<Label for="healer-specs-select">Healer Composition</Label>
				<select
					id="healer-specs-select"
					multiple
					class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
					on:change={handleHealerSpecChange}
					aria-label="Select one or more healer specializations"
				>
					{#each healerOptions as healer (healer.value)}
						<option value={healer.value}>{healer.label}</option>
					{/each}
				</select>
				<p class="text-xs text-muted-foreground mt-1">Hold Ctrl/Cmd to select multiple. Filters for logs containing ALL selected specs.</p>
			</div>
		</div>

		<Button on:click={handleSearch} disabled={loading} class="w-full md:w-auto mt-4">
			{#if loading}
				Searching...
			{:else}
				Search Logs
			{/if}
		</Button>
	</CardContent>
</Card>