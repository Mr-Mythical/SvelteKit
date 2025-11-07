<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { signIn } from '@auth/sveltekit/client';
	import User from 'lucide-svelte/icons/user';
	import Key from 'lucide-svelte/icons/key';
	import Hash from 'lucide-svelte/icons/hash';
	import LogIn from 'lucide-svelte/icons/log-in';

	export let data: any;

	$: session = data.session;
	$: userBattletag = session?.user ? (session.user as any).battletag : null;
	$: accessToken = session ? (session as any).accessToken : null;
</script>

<svelte:head>
	<title>Profile | Mr. Mythical</title>
</svelte:head>

<div class="container mx-auto max-w-4xl px-4 py-8">
	<div class="mb-8">
		<h1 class="mb-2 font-heading text-3xl font-bold text-foreground">Profile</h1>
		<p class="text-muted-foreground">
			View your Battle.net account information and authentication details.
		</p>
	</div>

	{#if session?.user}
		<div class="grid gap-6">
			<!-- User Information Card -->
			<div class="rounded-lg border border-border bg-card p-6 shadow-sm">
				<div class="mb-4 flex items-center gap-3">
					<div class="rounded-lg bg-primary/10 p-2">
						<User class="h-5 w-5 text-primary" />
					</div>
					<h2 class="text-xl font-semibold text-card-foreground">Account Information</h2>
				</div>

				<div class="grid gap-4 md:grid-cols-2">
					<div class="space-y-2">
						<div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
							<User class="h-4 w-4" />
							Battle.net ID
						</div>
						<p class="rounded-md bg-muted/50 px-3 py-2 text-lg font-semibold text-card-foreground">
							{userBattletag || session.user.name || 'Unknown'}
						</p>
					</div>

					<div class="space-y-2">
						<div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
							<Hash class="h-4 w-4" />
							User ID
						</div>
						<p
							class="break-all rounded-md bg-muted/50 px-3 py-2 font-mono text-sm text-card-foreground"
						>
							{session.user.id}
						</p>
					</div>
				</div>
			</div>

			<!-- API Access Card -->
			{#if accessToken}
				<div class="rounded-lg border border-border bg-card p-6 shadow-sm">
					<div class="mb-4 flex items-center gap-3">
						<div class="rounded-lg bg-accent/10 p-2">
							<Key class="h-5 w-5 text-accent-foreground" />
						</div>
						<h2 class="text-xl font-semibold text-card-foreground">API Access</h2>
					</div>

					<div class="space-y-2">
						<div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
							<Key class="h-4 w-4" />
							Access Token
						</div>
						<div class="rounded-md bg-muted/50 p-3">
							<p class="break-all font-mono text-xs text-card-foreground">
								{accessToken.substring(0, 40)}...
							</p>
							<p class="mt-2 text-xs text-muted-foreground">
								This token can be used to make authenticated API calls to Battle.net services.
							</p>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<!-- Not Signed In State -->
		<div class="py-12 text-center">
			<div class="mx-auto mb-6 w-fit rounded-full bg-muted/50 p-4">
				<User class="h-12 w-12 text-muted-foreground" />
			</div>
			<h2 class="mb-2 text-2xl font-semibold text-foreground">Sign In Required</h2>
			<p class="mx-auto mb-6 max-w-md text-muted-foreground">
				Please sign in with your Battle.net account to view your profile information and access API
				features.
			</p>
			<Button
				on:click={() => signIn('battlenet')}
				class="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg"
			>
				<LogIn class="mr-2 h-4 w-4" />
				Sign in with Battle.net
			</Button>
		</div>
	{/if}
</div>
