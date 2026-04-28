<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
	import * as Command from '$lib/components/ui/command/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { cn } from '$lib/utils.js';
	import { tick } from 'svelte';

	interface Props {
		dungeons?: Array<{ value: string; label: string; short_name: string }>;
		selectedValue?: string;
		onSelect: (value: string) => void;
		triggerId?: string;
	}

	let { dungeons = [], selectedValue = '', onSelect, triggerId = '' }: Props = $props();

	let open = $state(false);

	let selected = $derived(dungeons.find((d) => d.value === selectedValue));
	let selectedLabel = $derived(selected?.label ?? 'Select a dungeon...');

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
			'border-input bg-background ring-offset-background focus:ring-ring inline-flex h-8 w-full items-center justify-between rounded-md border px-3 py-2 text-sm whitespace-nowrap focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:h-10 md:px-4 md:text-base'
		)}
	>
		<span id={`${triggerId}-label`}>
			<span class="hidden md:inline">{selectedLabel}</span>
			<span class="md:hidden">{selected?.short_name ?? selectedLabel}</span>
		</span>
		<ChevronsUpDown
			class="ml-1 h-3 w-3 shrink-0 opacity-50 md:ml-2 md:h-4 md:w-4"
			aria-hidden="true"
		/>
		<span class="sr-only">Toggle dropdown</span>
	</Popover.Trigger>

	<Popover.Content class="w-[200px] p-0 md:w-[250px]">
		<Command.Root>
			<Command.Input
				placeholder="Search dungeon..."
				aria-label="Search dungeon"
				class="h-8 px-2 text-sm md:h-9 md:px-3"
			/>
			<Command.Empty class="p-2 text-sm">No dungeon found.</Command.Empty>
			<Command.Group>
				{#each dungeons as dungeon}
					<Command.Item
						value={dungeon.value}
						onSelect={() => handleSelect(dungeon.value)}
						class={cn(
							'flex cursor-pointer items-center px-2 py-1.5 text-sm select-none md:py-2',
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
