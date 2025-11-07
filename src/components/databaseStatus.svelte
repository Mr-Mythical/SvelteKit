<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { CheckCircle, XCircle, Loader2, Database, RefreshCw } from 'lucide-svelte';

	let testing = false;
	let testResult: any = null;
	let error: string | null = null;

	$: session = $page.data.session;

	onMount(() => {
		if (session?.user) {
			testDatabaseConnection();
		}
	});

	async function testDatabaseConnection() {
		testing = true;
		error = null;
		testResult = null;

		try {
			const response = await fetch('/api/user-db-test');
			const data = await response.json();

			if (response.ok) {
				testResult = data;
			} else {
				error = data.error || 'Test failed';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Network error';
		} finally {
			testing = false;
		}
	}
</script>

{#if session?.user}
	<Card class="mb-6">
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<Database class="h-5 w-5" />
				Database Integration Status
			</CardTitle>
			<CardDescription>
				Check if your account is properly connected to the database
			</CardDescription>
		</CardHeader>
		<CardContent class="space-y-4">
			<div class="flex items-center justify-between">
				<span class="text-sm font-medium">Connection Test</span>
				<Button 
					variant="outline" 
					size="sm" 
					on:click={testDatabaseConnection}
					disabled={testing}
					class="flex items-center gap-2"
				>
					{#if testing}
						<Loader2 class="h-4 w-4 animate-spin" />
						Testing...
					{:else}
						<RefreshCw class="h-4 w-4" />
						Test Connection
					{/if}
				</Button>
			</div>

			{#if testing}
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<Loader2 class="h-4 w-4 animate-spin" />
					Testing database connection...
				</div>
			{:else if error}
				<div class="flex items-center gap-2 text-sm text-red-600">
					<XCircle class="h-4 w-4" />
					Error: {error}
				</div>
			{:else if testResult}
				<div class="space-y-3">
					<div class="flex items-center gap-2 text-sm text-green-600">
						<CheckCircle class="h-4 w-4" />
						Database connection successful!
					</div>
					
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
						<div>
							<span class="font-medium">User ID:</span>
							<code class="ml-2 text-xs bg-muted px-1 rounded">{testResult.user.id}</code>
						</div>
						<div>
							<span class="font-medium">Battletag:</span>
							<Badge variant="secondary" class="ml-2">{testResult.user.battletag}</Badge>
						</div>
						<div>
							<span class="font-medium">Created:</span>
							<span class="ml-2 text-muted-foreground">
								{new Date(testResult.user.createdAt).toLocaleDateString()}
							</span>
						</div>
						<div>
							<span class="font-medium">Last Seen:</span>
							<span class="ml-2 text-muted-foreground">
								{new Date(testResult.user.lastSeenAt).toLocaleString()}
							</span>
						</div>
						<div>
							<span class="font-medium">Recent Items:</span>
							<Badge variant="outline" class="ml-2">{testResult.recents}</Badge>
						</div>
						<div>
							<span class="font-medium">Status:</span>
							<Badge variant={testResult.user.isActive ? "default" : "destructive"} class="ml-2">
								{testResult.user.isActive ? "Active" : "Inactive"}
							</Badge>
						</div>
					</div>

					{#if testResult.recentItems?.length > 0}
						<div>
							<h4 class="text-sm font-medium mb-2">Recent Activity:</h4>
							<ul class="text-xs space-y-1">
								{#each testResult.recentItems.slice(0, 5) as item}
									<li class="flex items-center gap-2">
										<Badge variant="outline" class="text-xs">{item.type}</Badge>
										<span>{item.title}</span>
										{#if item.subtitle}
											<span class="text-muted-foreground">• {item.subtitle}</span>
										{/if}
									</li>
								{/each}
							</ul>
						</div>
					{/if}
				</div>
			{/if}

			<div class="text-xs text-muted-foreground pt-2 border-t">
				<p>This component helps verify that your authentication is properly integrated with the database system.</p>
			</div>
		</CardContent>
	</Card>
{/if}