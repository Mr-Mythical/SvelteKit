<script lang="ts">
    import { Card } from "$lib/components/ui/card";
</script>

<div class="mb-6 space-y-8 animate-pulse">
    <div class="mb-6 text-center">
        <div class="h-8 w-96 mx-auto bg-muted rounded-lg"></div>
        <div class="h-4 w-48 mx-auto mt-2 bg-muted rounded-lg"></div>
        <div class="mt-4 flex justify-center gap-4">
            <div class="h-10 w-32 bg-muted rounded-lg"></div>
            <div class="h-10 w-32 bg-muted rounded-lg"></div>
        </div>
    </div>

    <div class="space-y-8">
        <div class="h-[400px] bg-muted rounded-lg"></div>

        <div class="mt-8">
            <div class="h-8 w-96 mx-auto bg-muted rounded-lg mb-6"></div>
            <Card class="mt-6">
                <div class="p-6 space-y-4">
                    <div class="h-10 bg-muted rounded-lg"></div>
                    <div class="space-y-3">
                        {#each Array(5) as _}
                            <div class="h-16 bg-muted rounded-lg"></div>
                        {/each}
                    </div>
                </div>
            </Card>
        </div>
    </div>
</div>