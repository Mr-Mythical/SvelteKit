<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { ImportIcon, CheckCircle, AlertCircle, Loader2 } from 'lucide-svelte';

	// Import functions (these would need to be exposed via API routes in a real implementation)
	// import { hasOldRecentsData, getOldRecentsPreview, importOldRecentsData } from '$lib/db/migration.js';

	let hasOldData = false;
	let importing = false;
	let importCompleted = false;
	let preview = {
		characters: 0,
		reports: 0,
		characterNames: [] as string[],
		reportTitles: [] as string[]
	};
	let importResults: any = null;

	$: session = $page.data.session;
	$: userId = session?.user?.id;

	onMount(async () => {
		checkForOldData();
	});

	function checkForOldData() {
		// Check if user has old localStorage data
		if (typeof localStorage === 'undefined') return;

		const hasCharacters = localStorage.getItem('recentCharacters') !== null;
		const hasReports = localStorage.getItem('recentReports') !== null;
		hasOldData = hasCharacters || hasReports;

		if (hasOldData) {
			getPreview();
		}
	}

	function getPreview() {
		if (typeof localStorage === 'undefined') return;

		try {
			// Check characters
			const storedChars = localStorage.getItem('recentCharacters');
			if (storedChars) {
				const chars = JSON.parse(storedChars);
				preview.characters = chars.length;
				preview.characterNames = chars.map((c: any) => `${c.characterName} (${c.realm})`);
			}

			// Check reports
			const storedReports = localStorage.getItem('recentReports');
			if (storedReports) {
				const reports = JSON.parse(storedReports);
				preview.reports = reports.length;
				preview.reportTitles = reports.map((r: any) => r.title);
			}
		} catch (error) {
			console.error('Error getting preview:', error);
		}
	}

	async function importData() {
		if (!userId) return;

		importing = true;
		try {
			// This would need to be implemented as an API route
			const response = await fetch('/api/import-old-recents', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId })
			});

			if (response.ok) {
				importResults = await response.json();
				importCompleted = true;
				hasOldData = false; // Hide the import option
			} else {
				throw new Error('Import failed');
			}
		} catch (error) {
			console.error('Import error:', error);
			alert('Failed to import data. Please try again.');
		} finally {
			importing = false;
		}
	}
</script>

{#if hasOldData && !importCompleted && session?.user}
	<Card class="mb-6 border-blue-200 bg-blue-50">
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<ImportIcon class="h-5 w-5" />
				Import Your Recent Activity
			</CardTitle>
			<CardDescription>
				We found recent characters and reports saved in your browser. Import them to your account to
				keep your history across devices.
			</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
				{#if preview.characters > 0}
					<div class="space-y-2">
						<div class="flex items-center gap-2">
							<Badge variant="secondary">{preview.characters}</Badge>
							<span class="text-sm font-medium">Recent Characters</span>
						</div>
						<ul class="space-y-1 text-xs text-muted-foreground">
							{#each preview.characterNames.slice(0, 3) as name}
								<li>• {name}</li>
							{/each}
							{#if preview.characterNames.length > 3}
								<li class="text-xs">... and {preview.characterNames.length - 3} more</li>
							{/if}
						</ul>
					</div>
				{/if}

				{#if preview.reports > 0}
					<div class="space-y-2">
						<div class="flex items-center gap-2">
							<Badge variant="secondary">{preview.reports}</Badge>
							<span class="text-sm font-medium">Recent Reports</span>
						</div>
						<ul class="space-y-1 text-xs text-muted-foreground">
							{#each preview.reportTitles.slice(0, 3) as title}
								<li>• {title}</li>
							{/each}
							{#if preview.reportTitles.length > 3}
								<li class="text-xs">... and {preview.reportTitles.length - 3} more</li>
							{/if}
						</ul>
					</div>
				{/if}
			</div>

			<div class="flex gap-2">
				<Button on:click={importData} disabled={importing} class="flex items-center gap-2">
					{#if importing}
						<Loader2 class="h-4 w-4 animate-spin" />
						Importing...
					{:else}
						<ImportIcon class="h-4 w-4" />
						Import to Account
					{/if}
				</Button>
				<Button variant="outline" on:click={() => (hasOldData = false)}>Skip for Now</Button>
			</div>

			<p class="text-xs text-muted-foreground">
				This will copy your browser-saved recent activity to your account. Your browser data will
				remain unchanged.
			</p>
		</CardContent>
	</Card>
{/if}

{#if importCompleted && importResults}
	<Card class="mb-6 border-green-200 bg-green-50">
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<CheckCircle class="h-5 w-5 text-green-600" />
				Import Completed Successfully
			</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="space-y-2">
				<p class="text-sm">
					Imported <strong>{importResults.charactersImported}</strong> characters and
					<strong>{importResults.reportsImported}</strong> reports to your account.
				</p>
				{#if importResults.errors?.length > 0}
					<div class="mt-2">
						<p class="flex items-center gap-1 text-sm text-orange-600">
							<AlertCircle class="h-4 w-4" />
							Some items couldn't be imported:
						</p>
						<ul class="mt-1 text-xs text-muted-foreground">
							{#each importResults.errors.slice(0, 3) as error}
								<li>• {error}</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
		</CardContent>
	</Card>
{/if}
