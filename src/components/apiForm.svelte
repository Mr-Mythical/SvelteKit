<script lang="ts">
	import * as Form from '$lib/components/ui/form';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button/';
	import { formSchema, type FormSchema } from '../routes/schema';
	import { browser } from '$app/environment';
	import SuperDebug, { type Infer, type SuperValidated, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';
	import * as Select from '$lib/components/ui/select/index.js';

	export let data: SuperValidated<Infer<FormSchema>>;

	const form = superForm(data, {
		validators: zodClient(formSchema),
		onUpdated: ({ form: f }) => {
			if (f.valid) {
				console.log('valid', f.data);
				toast.success(`You submitted ${JSON.stringify(f.data, null, 2)}`);
			} else {
				console.log(f.errors);
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
</script>

<form
	method="POST"
	action="/"
	class="fixed left-0 top-0 z-10 flex h-full w-full items-center justify-center bg-black bg-opacity-50"
	use:enhance
>
	<Card.Root>
		<Card.Header>
			<Card.Title>Import Character</Card.Title>
			<p class="text-sm text-muted-foreground">Powered by Raider.io</p>
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
      <Input {...attrs} bind:value={$formData.realm} />
    </Form.Control>
    <Form.Description>The realm your character is on.</Form.Description>
    <Form.FieldErrors />
  </Form.Field>
    </Card.Content>
		<Card.Footer>
			<Button class="my-2 mr-5 w-44 text-lg">Close</Button>
			<Form.Button class="my-2 w-44 text-lg">Submit</Form.Button>
		</Card.Footer>
		{#if browser}
			<SuperDebug data={$formData} />
		{/if}
	</Card.Root>
</form>
