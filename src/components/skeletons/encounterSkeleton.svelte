<script lang="ts">
	import { Card } from '$lib/components/ui/card';
</script>

<div class="mb-6 animate-pulse space-y-8">
	<div class="mb-6 text-center">
		<div class="mx-auto h-8 w-96 rounded-lg bg-muted"></div>
		<div class="mx-auto mt-2 h-4 w-48 rounded-lg bg-muted"></div>
		<div class="mt-4 flex justify-center gap-4">
			<div class="h-10 w-32 rounded-lg bg-muted"></div>
			<div class="h-10 w-32 rounded-lg bg-muted"></div>
		</div>
	</div>

	<div class="space-y-8">
		<div class="h-[400px] rounded-lg bg-muted"></div>

		<div class="mt-8">
			<div class="mx-auto mb-6 h-8 w-96 rounded-lg bg-muted"></div>
			<Card class="mt-6">
				<div class="space-y-4 p-6">
					<div class="h-10 rounded-lg bg-muted"></div>
					<div class="space-y-3">
						{#each Array(5) as _}
							<div class="h-16 rounded-lg bg-muted"></div>
						{/each}
					</div>
				</div>
			</Card>
		</div>
	</div>
</div>
