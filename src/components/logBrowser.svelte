<script lang="ts">
	import { run } from 'svelte/legacy';

	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { bosses as bossList } from '$lib/types/bossData';
	import { classSpecAbilities } from '$lib/types/classData';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Separator } from '$lib/components/ui/separator';


	interface Props {
		loading?: boolean;
		initialBossId?: number | undefined;
		initialHealerSpecs?: string[];
		onsearch?: (detail: {
			bossId?: number;
			minDuration?: number;
			maxDuration?: number;
			healerSpecs?: string[];
		}) => void;
	}

	let { loading = false, initialBossId = undefined, initialHealerSpecs = [], onsearch }: Props = $props();

	let selectedBossId: number | undefined = $state(initialBossId);
	let selectedBossLabel = $derived(
		selectedBossId ? (bossList.find((b) => b.id === selectedBossId)?.name ?? '') : ''
	);
	let minDuration: number | undefined = $state(undefined);
	let maxDuration: number | undefined = $state(undefined);
	let selectedHealerSpecs: string[] = $state(initialHealerSpecs);

	const healerOptions: { value: string; label: string }[] = [];
	for (const className in classSpecAbilities) {
		const specs = classSpecAbilities[className as keyof typeof classSpecAbilities];
		for (const specName in specs) {
			if (['Restoration', 'Preservation', 'Mistweaver', 'Holy', 'Discipline'].includes(specName)) {
				healerOptions.push({
					value: `${className}-${specName}`,
					label: `${className} - ${specName}`
				});
			}
		}
	}
	healerOptions.sort((a, b) => a.label.localeCompare(b.label));

	function handleSearch() {
		onsearch?.({
			bossId: selectedBossId,
			minDuration: minDuration ? minDuration * 60 : undefined,
			maxDuration: maxDuration ? maxDuration * 60 : undefined,
			healerSpecs: selectedHealerSpecs.length > 0 ? selectedHealerSpecs : undefined
		});
	}

	function handleBossChange(value: string) {
		if (!value) {
			selectedBossId = undefined;
		} else {
			selectedBossId = Number(value);
		}
	}

	run(() => {
		if (initialBossId || initialHealerSpecs.length > 0) {
			handleSearch();
		}
	});
</script>

<Card class="w-full">
	<CardHeader>
		<CardTitle>Browse Raid Logs</CardTitle>
		<CardDescription
			>Search through logs to find specific boss fights and healer compositions</CardDescription
		>
	</CardHeader>
	<CardContent class="space-y-6">
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<div class="space-y-2">
				<Label for="boss-select">Boss</Label>
				<Select.Root
					type="single"
					value={selectedBossId != null ? String(selectedBossId) : ''}
					onValueChange={handleBossChange}
				>
					<Select.Trigger id="boss-select" class="w-full">
						{selectedBossLabel || 'Any Boss'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="" label="Any Boss" class="italic text-muted-foreground">
							Any Boss
						</Select.Item>
						{#each bossList as boss (boss.id)}
							<Select.Item value={String(boss.id)} label={boss.name}>{boss.name}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<div class="space-y-2">
				<Label for="min-duration">Min Duration</Label>
				<div class="flex items-center space-x-2">
					<Input
						id="min-duration"
						type="number"
						placeholder="3"
						bind:value={minDuration}
						class="w-full"
					/>
					<span class="whitespace-nowrap text-sm text-muted-foreground">minutes</span>
				</div>
			</div>

			<div class="space-y-2">
				<Label for="max-duration">Max Duration</Label>
				<div class="flex items-center space-x-2">
					<Input
						id="max-duration"
						type="number"
						placeholder="10"
						bind:value={maxDuration}
						class="w-full"
					/>
					<span class="whitespace-nowrap text-sm text-muted-foreground">minutes</span>
				</div>
			</div>
		</div>

		<Separator />
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<Label class="text-base">Healer Composition</Label>
				<Button variant="ghost" size="sm" onclick={() => (selectedHealerSpecs = [])}>
					Clear Selection
				</Button>
			</div>

			<div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
				{#each healerOptions as healer (healer.value)}
					<div class="flex items-center space-x-2">
						<Checkbox
							id={healer.value}
							checked={selectedHealerSpecs.includes(healer.value)}
							onCheckedChange={(checked: boolean) => {
								if (checked) {
									selectedHealerSpecs = [...selectedHealerSpecs, healer.value];
								} else {
									selectedHealerSpecs = selectedHealerSpecs.filter((spec) => spec !== healer.value);
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
			<p class="text-sm text-muted-foreground">
				{selectedHealerSpecs.length
					? `Selected: ${selectedHealerSpecs.length} healer${selectedHealerSpecs.length > 1 ? 's' : ''}`
					: 'Select healers to filter by composition'}
			</p>
		</div>

		<div class="flex justify-end">
			<Button onclick={handleSearch} disabled={loading} class="min-w-[120px]">
				{#if loading}
					<span class="mr-2 inline-block animate-spin">⟳</span>
					Searching...
				{:else}
					Search Logs
				{/if}
			</Button>
		</div>
	</CardContent>
</Card>
