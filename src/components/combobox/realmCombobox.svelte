<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { cn } from '$lib/utils.js';
	import { tick } from 'svelte';

	interface Props {
		options?: Array<{ value: string; label: string }>;
		selectedValue?: string;
		onSelect: (value: string) => void;
		triggerId?: string;
	}

	let { options = [], selectedValue = '', onSelect, triggerId = '' }: Props = $props();

	let open = $state(false);

	let selectedLabel = $derived(
		options.find((o) => o.value === selectedValue)?.label ?? 'Select a realm...'
	);

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

<Popover.Root bind:open>
	<Popover.Trigger
		id={triggerId}
		role="combobox"
		aria-expanded={open}
		aria-haspopup="listbox"
		aria-labelledby={`${triggerId}-label`}
		class={cn(
			'border-input bg-background ring-offset-background focus:ring-ring inline-flex h-10 w-full items-center justify-between rounded-md border px-3 py-2 text-sm whitespace-nowrap focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'
		)}
	>
		<span id={`${triggerId}-label`}>{selectedLabel}</span>
		<ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
		<span class="sr-only">Toggle dropdown</span>
	</Popover.Trigger>

	<Popover.Content class="p-0">
		<div class="scrollable-dropdown">
			<Command.Root>
				<Command.Input placeholder="Search realm..." aria-label="Search realm" />
				<Command.Empty>No realm found.</Command.Empty>
				<Command.Group>
					{#each options as option}
						<Command.Item
							value={option.label}
							onSelect={() => {
								handleSelect(option.value);
							}}
							class={cn(
								'flex cursor-pointer items-center p-2 select-none',
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
		max-height: 300px;
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
