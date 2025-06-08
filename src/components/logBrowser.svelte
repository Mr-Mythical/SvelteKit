<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { bosses as bossList } from '$lib/types/bossData';
	import { classSpecAbilities } from '$lib/types/classData';
	import { Checkbox } from "$lib/components/ui/checkbox";

	export let loading = false;

	let selectedBossId: number | undefined = undefined;

	let selectedBossObject: { value: number; label: string } | undefined = undefined;

	let minDuration: number | undefined = undefined;
	let maxDuration: number | undefined = undefined;
	let selectedHealerSpecs: string[] = [];

	const dispatch = createEventDispatcher();

	const healerOptions: { value: string; label: string }[] = [];
	for (const className in classSpecAbilities) {
		const specs = classSpecAbilities[className as keyof typeof classSpecAbilities];
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
			minDuration: minDuration ? minDuration * 60 : undefined,
			maxDuration: maxDuration ? maxDuration * 60 : undefined,
			healerSpecs: selectedHealerSpecs.length > 0 ? selectedHealerSpecs : undefined,
		});
	}

	function handleHealerSpecChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		selectedHealerSpecs = Array.from(target.selectedOptions, option => option.value);
	}

	function handleBossChange(selected: { value: number; label?: string } | undefined) {
		if (selected) {
			selectedBossObject = { value: selected.value, label: selected.label ?? '' };
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
				<Label for="min-duration">Min Duration (min)</Label>
				<Input 
					id="min-duration" 
					type="number" 
					placeholder="e.g., 3" 
					bind:value={minDuration} 
					class="w-full mt-1" 
				/>
			</div>
			<div>
				<Label for="max-duration">Max Duration (min)</Label>
				<Input 
					id="max-duration" 
					type="number" 
					placeholder="e.g., 10" 
					bind:value={maxDuration} 
					class="w-full mt-1" 
				/>
			</div>

			<div>
				<Label for="healer-specs">Healer Composition</Label>
				<div class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
					{#each healerOptions as healer (healer.value)}
						<div class="flex items-center space-x-2">
							<Checkbox
								id={healer.value}
								checked={selectedHealerSpecs.includes(healer.value)}
								onCheckedChange={(checked) => {
									if (checked) {
										selectedHealerSpecs = [...selectedHealerSpecs, healer.value];
									} else {
										selectedHealerSpecs = selectedHealerSpecs.filter(spec => spec !== healer.value);
									}
								}}
							/>
							<label
								for={healer.value}
								class="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
							>
								{healer.label}
							</label>
						</div>
					{/each}
				</div>
				<p class="text-xs text-muted-foreground mt-1">Select one or more healer specializations. Filters for logs containing ALL selected specs.</p>
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