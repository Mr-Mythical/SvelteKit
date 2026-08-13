<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { cn } from '$lib/utils.js';
	import { tick } from 'svelte';

	interface Props {
		options?: Array<{ value: string; label: string }>;
		selectedValue?: string;
		onSelect: (value: string) => void;
		triggerId?: string;
		class?: string;
		placeholder?: string;
	}

	let {
		options = [],
		selectedValue = '',
		onSelect,
		triggerId = '',
		class: className = '',
		placeholder = 'Select a realm...'
	}: Props = $props();

	let open = $state(false);

	const selectedOption = $derived(options.find((o) => o.value === selectedValue));
	const selectedLabel = $derived(selectedOption?.label ?? placeholder);
	const hasValue = $derived(Boolean(selectedOption));

	function closeAndFocusTrigger(id: string) {
		open = false;
		tick().then(() => {
			document.getElementById(id)?.focus();
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
		data-placeholder={!hasValue ? '' : undefined}
		class={cn(
			"border-input data-placeholder:text-muted-foreground dark:bg-input/30 dark:hover:bg-input/50 focus-visible:border-ring focus-visible:ring-ring/50 flex h-8 w-full items-center justify-between gap-1.5 rounded-lg border bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
			className
		)}
	>
		<span id={`${triggerId}-label`} class={cn('truncate', !hasValue && 'text-muted-foreground')}>
			{selectedLabel}
		</span>
		<ChevronDownIcon class="text-muted-foreground pointer-events-none size-4" aria-hidden="true" />
		<span class="sr-only">Toggle dropdown</span>
	</Popover.Trigger>

	<Popover.Content class="w-72 p-0" align="start">
		<div class="scrollable-dropdown">
			<Command.Root>
				<Command.Input placeholder="Search realm..." aria-label="Search realm" />
				<Command.Empty>No realm found.</Command.Empty>
				<Command.Group>
					{#each options as option (option.value)}
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
