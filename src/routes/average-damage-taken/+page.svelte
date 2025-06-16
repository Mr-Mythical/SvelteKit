<script lang="ts">
    import AverageChart from '../../components/averageChart.svelte';
    import Header from '../../components/header.svelte';
    import SEO from '../../components/seo.svelte';
    import Footer from '../../components/footer.svelte';
    import { bosses } from '$lib/types/bossData';
    import { formSchema, type FormSchema } from './schema';
    import * as Form from "$lib/components/ui/form";
    import * as Select from "$lib/components/ui/select";
    import { type Infer, type SuperValidated, superForm } from 'sveltekit-superforms';
    import { zodClient } from 'sveltekit-superforms/adapters';
    import { toast } from "svelte-sonner";

    export let data: SuperValidated<Infer<FormSchema>>;

    const form = superForm(data, {
        validators: zodClient(formSchema),
        dataType: 'json',  // Add this line
        onUpdated: ({ form: f }) => {
            if (f.valid) {
                toast.success(`Selected boss: ${selectedEncounter?.label}`);
            } else {
                toast.error('Please fix the errors in the form.');
            }
        }
    });

    const { form: formData, enhance } = form;

    const encounters = bosses.map(boss => ({
        value: boss.id.toString(),
        label: `${boss.name} Mythic`
    }));

    let selectedEncounter = encounters[0];

    $: selectedBoss = $formData.bossId
        ? {
            label: encounters.find(e => e.value === $formData.bossId)?.label || '',
            value: $formData.bossId
        }
        : undefined;
</script>

<SEO
    title="Average Damage Taken - Mr. Mythical"
    description="Analyze raid damage patterns with average damage metrics, standard deviation ranges, and confidence intervals. Identify critical moments and improve team survivability using progression log data."
    image="https://mrmythical.com/Logo.png"
    keywords="WoW damage analysis, average damage taken, raid survivability, damage patterns, standard deviation, confidence interval, progression logs"
/>

<Header />
<main class="container mx-auto px-4 py-8">
    <section class="mb-12 text-center">
        <h1 class="mb-4 text-4xl font-bold">Average Damage Taken</h1>
        <p class="mb-6 text-lg">
            Analyze damage patterns across different raid encounters
        </p>
    </section>

    <div class="grid grid-cols-1 gap-8">
        <div class="flex justify-center">
            <form method="POST" use:enhance class="w-[300px]">
                <Form.Field {form} name="bossId">
                    <Form.Control let:attrs>
                        <Form.Label>Select Boss</Form.Label>
                        <Select.Root
                            selected={selectedBoss}
                            onSelectedChange={(v) => {
                                v && ($formData.bossId = v.value);
                                selectedEncounter = encounters.find(e => e.value === v?.value) ?? encounters[0];
                            }}
                        >
                            <Select.Trigger {...attrs}>
                                <Select.Value placeholder="Select a boss" />
                            </Select.Trigger>
                            <Select.Content>
                                {#each encounters as encounter}
                                    <Select.Item 
                                        value={encounter.value} 
                                        label={encounter.label}
                                    />
                                {/each}
                            </Select.Content>
                        </Select.Root>
                        <input hidden bind:value={$formData.bossId} name={attrs.name} />
                    </Form.Control>
                    <Form.Description>Select a boss to view damage patterns.</Form.Description>
                    <Form.FieldErrors />
                </Form.Field>
            </form>
        </div>

        <div class="rounded-lg border bg-card p-4">
            {#if $formData.bossId}
                {#key $formData.bossId}
                    <AverageChart 
                        encounterId={parseInt($formData.bossId)} 
                        encounterName={selectedEncounter?.label || ''} 
                    />
                {/key}
            {/if}
        </div>
    </div>

    <div class="3xl:mx-[35rem] 4xl:mx-[45rem] m-8 rounded-lg bg-card p-6 md:mx-16 lg:mx-40 xl:mx-80 2xl:mx-96">
        <h2 class="mb-6 pb-2 text-2xl font-semibold text-foreground">Understanding The Visualization</h2>

        <div class="metric-group mb-6">
            <h3 class="mb-2 text-xl font-medium text-foreground">Average Damage (Blue Line)</h3>
            <p class="text-foreground">
                The blue line highlights the average damage taken by players at each second across all
                analyzed fights. This serves as a baseline to identify consistent damage patterns and critical
                moments during encounters.
            </p>
        </div>

        <div class="mb-6">
            <h3 class="mb-2 text-xl font-medium text-foreground">Standard Deviation Range (Blue Area)</h3>
            <p class="text-foreground">
                The light blue area shows the range within one standard deviation (±1), where 68% of actual
                damage values fall. A wider blue band often indicates:
            </p>
            <ul class="list-inside list-disc text-foreground">
                <li>Mechanics with variable outcomes (e.g., avoidable abilities some players miss)</li>
                <li>Random elements (e.g., bosses targeting random players)</li>
                <li>Differences in player skill or damage mitigation</li>
            </ul>
        </div>

        <div class="mb-6">
            <h3 class="mb-2 text-xl font-medium text-foreground">95% Confidence Interval (Red Area)</h3>
            <p class="text-foreground">
                The red shaded region reflects our confidence in the average estimate. A narrow band
                indicates:
            </p>
            <ul class="list-inside list-disc text-foreground">
                <li>Reliable data from many logs</li>
                <li>Consistent execution across encounters</li>
            </ul>
            <p class="text-foreground">Wider bands suggest variability or areas needing more data.</p>
        </div>

        <div class="mb-6">
            <h3 class="mb-2 text-xl font-medium text-foreground">Source & Selection</h3>
            <p class="list-inside list-disc text-foreground">
                Data comes from public progression logs (first successful kills).
            </p>
        </div>
    </div>
</main>
<Footer />

<style>
    :global(.list-item) {
        transition: background-color 0.2s ease;
    }
</style>
