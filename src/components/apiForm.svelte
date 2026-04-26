<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button/';
	import { formSchema, type FormSchema } from '../routes/rating-calculator/schema';
	import { type Infer, type SuperValidated, superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';
	import * as Select from '$lib/components/ui/select/index.js';
	import { apiPopup, dungeonData, wowSummaryStore } from '../stores';
	import RealmCombobox from './realmCombobox.svelte';
	import {
		euRealmOptions,
		krRealmOptions,
		twRealmOptions,
		usRealmOptions
	} from '$lib/types/realms';
	import { fetchRuns, fetchWowSummary, emptyDungeonRuns } from '$lib/data/characterData';
	import type { BlizzardCharacterFull } from '$lib/types/blizzardFull';
	import { recentCharacters } from '$lib/stores/recentCharacters';
	import { logClientError } from '$lib/utils/clientLog';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	interface Props {
		data: SuperValidated<Infer<FormSchema>>;
	}

	let { data }: Props = $props();

	// svelte-ignore state_referenced_locally
	const form = superForm(data, {
		validators: zod4Client(formSchema),
		onUpdated: async ({ form: f }) => {
			if (f.valid) {
				toast.success('Character imported successfully!');
				const { region, realm, characterName } = f.data;

				dungeonData.set({ runs: emptyDungeonRuns() });
				fetchRuns(region, realm, characterName).then((runsResult) => {
					if (runsResult.kind === 'ok') {
						dungeonData.set({ runs: runsResult.runs });
						toast.success('Runs fetched successfully.');
						apiPopup.set(false);
					} else if (runsResult.kind === 'empty') {
						toast.error('No runs found for this character.');
						apiPopup.set(false);
					} else {
						logClientError('apiForm', 'Failed to fetch Raider.io runs', runsResult.status);
						toast.error('Failed to fetch data from Raider.io');
					}
				});
				fetchWowSummary<BlizzardCharacterFull>(region, realm, characterName).then((summaryResult) => {
					if (summaryResult.kind === 'ok') {
						wowSummaryStore.set(summaryResult.summary);
					} else {
						logClientError(
							'apiForm',
							'Failed to fetch WoW character summary',
							summaryResult.status
						);
					}
				});

				if (typeof window !== 'undefined') {
					const currentUrl = new URL(window.location.href);
					currentUrl.searchParams.delete('runs');
					currentUrl.searchParams.delete('score');
					currentUrl.searchParams.set('char', characterName);
					currentUrl.searchParams.set('region', region);
					currentUrl.searchParams.set('realm', realm);

					goto(currentUrl.pathname + currentUrl.search, { replaceState: true, noScroll: true });
				}

				if ($page?.data?.session?.user) {
					try {
						await recentCharacters.add({ region, realm, characterName });
					} catch (error) {
						logClientError('apiForm', 'Failed to add character to recent list', error);
					}
				}

				$apiPopup = false;
			} else {
				toast.error('Please fix the errors in the form.');
			}
		}
	});

	const { form: formData, enhance } = form;

	let currentRealmOptions = $derived(
		$formData.region === 'eu'
			? euRealmOptions
			: $formData.region === 'tw'
				? twRealmOptions
				: $formData.region === 'kr'
					? krRealmOptions
					: usRealmOptions
	);
</script>

{#if $apiPopup}
	<form
		method="POST"
		action="/rating-calculator"
		class="api-scrim fixed inset-0 z-50 flex items-center justify-center p-4"
		use:enhance
		aria-label="Import character"
	>
		<Card.Root class="api-dialog w-full max-w-md rounded-lg" size="sm">
			<Card.Header class="api-dialog-head border-b">
				<Card.Title class="api-dialog-title">Import character</Card.Title>
				<p class="api-dialog-copy">
					Powered by <a class="api-link" href="https://raider.io">Raider.io</a>
				</p>
			</Card.Header>

			<Card.Content class="api-dialog-content">
				<Form.Field {form} name="region">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Region</Form.Label>
							<Select.Root
								type="single"
								value={$formData.region}
								onValueChange={(v) => {
									if (v) $formData.region = v as typeof $formData.region;
								}}
							>
								<Select.Trigger {...props}>
									{$formData.region ? $formData.region.toUpperCase() : 'Select region'}
								</Select.Trigger>
								<Select.Content>
									<Select.Item value="us" label="US" />
									<Select.Item value="eu" label="EU" />
									<Select.Item value="tw" label="TW" />
									<Select.Item value="kr" label="KR" />
								</Select.Content>
							</Select.Root>
							<input hidden bind:value={$formData.region} name={props.name} />
						{/snippet}
					</Form.Control>
					<Form.Description>The region you play on.</Form.Description>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="characterName">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Character</Form.Label>
							<Input {...props} bind:value={$formData.characterName} placeholder="Character name" />
						{/snippet}
					</Form.Control>
					<Form.Description>Your character name.</Form.Description>
					<Form.FieldErrors />
				</Form.Field>

				<Form.Field {form} name="realm">
					<Form.Control>
						{#snippet children({ props })}
							<Form.Label>Realm</Form.Label>
							<RealmCombobox
								options={currentRealmOptions}
								selectedValue={$formData.realm}
								triggerId="realm-combobox"
								onSelect={(newValue) => {
									$formData.realm = newValue;
								}}
							/>
							<input hidden bind:value={$formData.realm} name={props.name} />
						{/snippet}
					</Form.Control>
					<Form.Description>The realm your character is on.</Form.Description>
					<Form.FieldErrors />
				</Form.Field>
			</Card.Content>

			<Card.Footer class="api-dialog-footer">
				<Button class="api-dialog-button" variant="outline" onclick={() => ($apiPopup = !$apiPopup)}>
					Close
				</Button>
				<Form.Button class="api-dialog-button api-dialog-submit">Import</Form.Button>
			</Card.Footer>
		</Card.Root>
	</form>
{/if}

<style>
	.api-scrim {
		background-color: hsl(24 100% 2% / 0.62);
		backdrop-filter: saturate(0.85);
	}

	:global(.api-dialog) {
		max-height: calc(100vh - 32px);
		overflow: auto;
		border-radius: 8px;
	}

	:global(.api-dialog-title) {
		font-family: var(--font-heading);
		font-size: 1.375rem;
		font-weight: 700;
		line-height: 1.15;
		letter-spacing: 0;
	}

	:global(.api-dialog-copy) {
		font-family: var(--font-body);
		font-size: 0.875rem;
		line-height: 1.45;
		color: hsl(var(--muted-foreground));
		margin: 0;
	}

	:global(.api-link) {
		color: hsl(var(--link));
		font-weight: 500;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	:global(.api-dialog-content) {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding-block: 18px;
	}

	:global(.api-dialog-footer) {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		background: hsl(var(--background));
	}

	:global(.api-dialog-button) {
		min-width: 120px;
		min-height: 44px;
		border-radius: 6px;
		font-family: var(--font-body);
		font-size: 0.9375rem;
		font-weight: 500;
	}

	:global(.api-dialog-submit) {
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
	}

	@media (max-width: 520px) {
		:global(.api-dialog-footer) {
			flex-direction: column-reverse;
		}

		:global(.api-dialog-button) {
			width: 100%;
		}
	}
</style>