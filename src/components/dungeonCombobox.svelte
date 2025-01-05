<script lang="ts">
	import Check from 'lucide-svelte/icons/check';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import { tick } from 'svelte';

	export let dungeons: Array<{ value: string; label: string }> = [];
	export let selectedValue: string = '';
	export let onSelect: (value: string) => void;
	export let triggerId: string = ''; // New prop for unique ID

	let open = false;

	$: selectedLabel =
		dungeons.find((d) => d.value === selectedValue)?.label ?? 'Select a dungeon...';

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
      class="w-full justify-between"
      id={triggerId}
    >
      <span id={`${triggerId}-label`}>{selectedLabel}</span>
      <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
      <span class="sr-only">Toggle dropdown</span>
    </Button>
	</Popover.Trigger>

	<Popover.Content class="p-0">
		<Command.Root>
			<Command.Input placeholder="Search dungeon..." aria-label="Search dungeon" />
			<Command.Empty>No dungeon found.</Command.Empty>
			<Command.Group>
				{#each dungeons as dungeon}
					<Command.Item
						value={dungeon.value}
						onSelect={(selectedValue) => handleSelect(selectedValue)}
						class={cn(
							'flex cursor-pointer select-none items-center p-2',
							selectedValue === dungeon.value ? 'bg-secondary' : ''
						)}
					>
						<Check
							class={cn('mr-2 h-4 w-4', selectedValue !== dungeon.value && 'text-transparent')}
							aria-hidden="true"
						/>
						{dungeon.label}
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
