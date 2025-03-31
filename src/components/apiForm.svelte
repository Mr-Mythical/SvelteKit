<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button/';
	import { formSchema, type FormSchema } from '../routes/rating-calculator/schema';
	import { type Infer, type SuperValidated, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';
	import * as Select from '$lib/components/ui/select/index.js';
	import { apiPopup } from '../stores';
	import { dungeonData } from '../stores';
	import { dungeonCount } from '$lib/types/dungeons';
	import type { RaiderIoRun } from '$lib/types/apiTypes';
	import { wowSummaryStore } from '../stores';
	import RealmCombobox from './realmCombobox .svelte';
	import { usRealmOptions, euRealmOptions } from '$lib/types/realms';

	export let data: SuperValidated<Infer<FormSchema>>;

	$: currentRealmOptions = $formData.region === 'eu' ? euRealmOptions : usRealmOptions;

	const form = superForm(data, {
		validators: zodClient(formSchema),
		onUpdated: ({ form: f }) => {
			if (f.valid) {
				toast.success(`You submitted ${JSON.stringify(f.data, null, 2)}`);
				const { region, realm, characterName } = f.data;
				fetchRuns(characterName, region, realm);
				fetchWowSummary(characterName, region, realm);
			} else {
				toast.error('Please fix the errors in the form.');
			}
		}
	});

	const { form: formData, enhance } = form;

	$: selectedRegion = $formData.region
		? {
				label: $formData.region,
				value: $formData.region
			}
		: undefined;

	async function fetchRuns(characterName: string, region: string, realm: string) {
		resetRuns();

		const url =
			`/api/raiderio?name=${encodeURIComponent(characterName)}` +
			`&region=${encodeURIComponent(region)}` +
			`&realm=${encodeURIComponent(realm)}`;
		const response = await fetch(url);

		if (response.ok) {
			const data = await response.json();
			if (data.runs?.length) {
				const mappedRuns = data.runs.slice(0, dungeonCount).map((run: RaiderIoRun) => ({
					dungeon: run.dungeon,
					short_name: run.short_name || '',
					mythic_level: run.mythic_level || 0,
					par_time_ms: run.par_time_ms || 0,
					num_keystone_upgrades: run.num_keystone_upgrades || 0,
					score: run.score || 0
				}));
				while (mappedRuns.length < dungeonCount) {
					mappedRuns.push({
						dungeon: '',
						short_name: '',
						mythic_level: 0,
						par_time_ms: 0,
						num_keystone_upgrades: 0,
						score: 0
					});
				}
				dungeonData.set({ runs: mappedRuns });
				toast.success('Runs fetched successfully.');
			} else {
				toast.error('No runs found for this character.');
			}
			apiPopup.set(false);
		} else {
			console.error('Error fetching Raider.io data:', response.status);
			toast.error('Failed to fetch data from Raider.io');
		}
	}

	async function fetchWowSummary(characterName: string, region: string, realm: string) {
		const url = `/api/blizzard?name=${characterName}&region=${region}&realm=${realm}`;
		const response = await fetch(url);

		if (response.ok) {
			const summaryData = await response.json();
			console.log('Fetched WoW Full Data:', summaryData);
			wowSummaryStore.set(summaryData);
		} else {
			console.error('Error fetching WoW character summary:', response.status);
		}
	}

	function resetRuns() {
		const emptyRuns = Array.from({ length: dungeonCount }, () => ({
			dungeon: '',
			short_name: '',
			mythic_level: 0,
			par_time_ms: 0,
			num_keystone_upgrades: 0,
			score: 0
		}));
		dungeonData.set({ runs: emptyRuns });
	}
</script>

{#if $apiPopup}
	<form
		method="POST"
		action="/rating-calculator"
		class="fixed left-0 top-0 z-10 flex h-full w-full items-center justify-center bg-black bg-opacity-50"
		use:enhance
	>
		<Card.Root>
			<Card.Header>
				<Card.Title>Import Character</Card.Title>
				<p class="text-sm text-muted-foreground">
					Powered by <a href="https://raider.io">Raider.io</a>
				</p>
			</Card.Header>
			<Card.Content>
				<Form.Field {form} name="region">
					<Form.Control let:attrs>
						<Form.Label>Region</Form.Label>
						<Select.Root
							selected={selectedRegion}
							onSelectedChange={(v) => {
								v && ($formData.region = v.value);
							}}
						>
							<Select.Trigger {...attrs}>
								<Select.Value placeholder="Select a region" />
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="us" label="us" />
								<Select.Item value="eu" label="eu" />
								<Select.Item value="tw" label="tw" />
								<Select.Item value="kr" label="kr" />
								<Select.Item value="cn" label="cn" />
							</Select.Content>
						</Select.Root>
						<input hidden bind:value={$formData.region} name={attrs.name} />
					</Form.Control>
					<Form.Description>The region you play on.</Form.Description>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="characterName">
					<Form.Control let:attrs>
						<Form.Label>Character</Form.Label>
						<Input {...attrs} bind:value={$formData.characterName} />
					</Form.Control>
					<Form.Description>Your characters name.</Form.Description>
					<Form.FieldErrors />
				</Form.Field>
				<Form.Field {form} name="realm">
					<Form.Control let:attrs>
						<Form.Label>Realm</Form.Label>
						<RealmCombobox
							options={currentRealmOptions}
							selectedValue={$formData.realm}
							triggerId="realm-combobox"
							onSelect={(newValue) => {
								$formData.realm = newValue;
							}}
						/>
						<input hidden bind:value={$formData.realm} name={attrs.name} />
					</Form.Control>
					<Form.Description>The realm your character is on.</Form.Description>
					<Form.FieldErrors />
				</Form.Field>
			</Card.Content>
			<Card.Footer>
				<Button class="my-2 mr-5 w-44 text-lg" on:click={() => ($apiPopup = !$apiPopup)}
					>Close</Button
				>
				<Form.Button class="my-2 w-44 text-lg">Submit</Form.Button>
			</Card.Footer>
		</Card.Root>
	</form>
{/if}
