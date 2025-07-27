<script lang="ts">
	import Check from 'lucide-svelte/icons/check';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import { tick } from 'svelte';

	export let dungeons: Array<{ value: string; label: string; short_name: string }> = [];
	export let selectedValue: string = '';
	export let onSelect: (value: string) => void;
	export let triggerId: string = '';

	let open = false;

	$: selected = dungeons.find((d) => d.value === selectedValue);
	$: selectedLabel = selected?.label ?? 'Select a dungeon...';

	function closeAndFocusTrigger(triggerId: string) {
		open = false;
		tick().then(() => {
			const triggerElement = document.getElementById(triggerId);
			if (triggerElement) {
				triggerElement.focus();
			}
		});
	}

	function handleSelect(currentValue: string) {
		onSelect(currentValue);
		closeAndFocusTrigger(triggerId);
	}
</script>

<Popover.Root bind:open let:ids>
	<Popover.Trigger asChild let:builder>
		<Button
			builders={[builder]}
			variant="outline"
			role="combobox"
			aria-expanded={open}
			aria-controls={ids.content}
			aria-haspopup="listbox"
			aria-labelledby={`${triggerId}-label`}
			class="w-full justify-between h-8 md:h-10 text-sm md:text-base px-3 md:px-4"
			id={triggerId}
		>
			<span id={`${triggerId}-label`}>
				<span class="hidden md:inline">{selectedLabel}</span>
				<span class="md:hidden">{selected?.short_name ?? selectedLabel}</span>
			</span>
			<ChevronsUpDown class="ml-1 md:ml-2 h-3 w-3 md:h-4 md:w-4 shrink-0 opacity-50" aria-hidden="true" />
			<span class="sr-only">Toggle dropdown</span>
		</Button>
	</Popover.Trigger>

	<Popover.Content class="p-0 w-[200px] md:w-[250px]">
		<Command.Root>
			<Command.Input 
				placeholder="Search dungeon..." 
				aria-label="Search dungeon"
				class="h-8 md:h-9 px-2 md:px-3 text-sm"
			/>
			<Command.Empty class="p-2 text-sm">No dungeon found.</Command.Empty>
			<Command.Group>
				{#each dungeons as dungeon}
					<Command.Item
						value={dungeon.value}
						onSelect={(selectedValue) => handleSelect(selectedValue)}
						class={cn(
							'flex cursor-pointer select-none items-center py-1.5 md:py-2 px-2 text-sm',
							selectedValue === dungeon.value ? 'bg-secondary' : ''
						)}
					>
						<Check
							class={cn('mr-2 h-4 w-4', selectedValue !== dungeon.value && 'text-transparent')}
							aria-hidden="true"
						/>
						<span class="hidden md:inline">{dungeon.label}</span>
						<span class="md:hidden">
							<span class="font-medium">{dungeon.short_name}</span>
							<span class="text-muted-foreground"> - {dungeon.label}</span>
						</span>
					</Command.Item>
				{/each}
			</Command.Group>
		</Command.Root>
	</Popover.Content>
</Popover.Root>

<style>
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		border: 0;
	}
</style>
