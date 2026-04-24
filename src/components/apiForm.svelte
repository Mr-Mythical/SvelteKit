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
import { apiPopup } from '../stores';
import RealmCombobox from './realmCombobox .svelte';
import {
usRealmOptions,
euRealmOptions,
krRealmOptions,
twRealmOptions
} from '$lib/types/realms';
import { fetchRuns, fetchWowSummary } from '$lib/utils/characterData';
import { recentCharacters } from '$lib/utils/recentCharacters';
import { page } from '$app/stores';
import { goto } from '$app/navigation';

interface Props {
data: SuperValidated<Infer<FormSchema>>;
}

let { data }: Props = $props();

const form = superForm(data, {
validators: zod4Client(formSchema),
onUpdated: async ({ form: f }) => {
if (f.valid) {
toast.success(`Character imported successfully!`);
const { region, realm, characterName } = f.data;

fetchRuns(characterName, region, realm);
fetchWowSummary(characterName, region, realm);

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
console.error('Failed to add character to recent list:', error);
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
{$formData.region || 'Select a region'}
</Select.Trigger>
<Select.Content>
<Select.Item value="us" label="us" />
<Select.Item value="eu" label="eu" />
<Select.Item value="tw" label="tw" />
<Select.Item value="kr" label="kr" />
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
<Input {...props} bind:value={$formData.characterName} />
{/snippet}
</Form.Control>
<Form.Description>Your characters name.</Form.Description>
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
<Card.Footer>
<Button class="my-2 mr-5 w-44 text-lg" onclick={() => ($apiPopup = !$apiPopup)}
>Close</Button
>
<Form.Button class="my-2 w-44 text-lg">Submit</Form.Button>
</Card.Footer>
</Card.Root>
</form>
{/if}
