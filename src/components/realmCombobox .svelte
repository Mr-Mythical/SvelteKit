<script lang="ts">
	import Check from 'lucide-svelte/icons/check';
	import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';
	import { tick } from 'svelte';

	// Now using a more generic prop name "options"
	export let options: Array<{ value: string; label: string }> = [];
	export let selectedValue: string = '';
	export let onSelect: (value: string) => void;
	export let triggerId: string = '';

	let open = false;

	$: selectedLabel = options.find((o) => o.value === selectedValue)?.label ?? 'Select a realm...';

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
		<div class="scrollable-dropdown">
			<Command.Root>
				<Command.Input placeholder="Search realm..." aria-label="Search realm" />
				<Command.Empty>No realm found.</Command.Empty>
				<Command.Group>
					{#each options as option}
						<Command.Item
							value={option.value}
							onSelect={(selectedValue) => handleSelect(selectedValue)}
							class={cn(
								'flex cursor-pointer select-none items-center p-2',
								selectedValue === option.value ? 'bg-secondary' : ''
							)}
						>
							<Check
								class={cn('mr-2 h-4 w-4', selectedValue !== option.value && 'text-transparent')}
								aria-hidden="true"
							/>
							{option.label}
						</Command.Item>
					{/each}
				</Command.Group>
			</Command.Root>
		</div>
	</Popover.Content>
</Popover.Root>

<style>
	.scrollable-dropdown {
		max-height: 300px; /* adjust this value as needed */
		overflow-y: auto;
	}
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
