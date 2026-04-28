<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { signIn } from '@auth/sveltekit/client';
	import User from '@lucide/svelte/icons/user';
	import Key from '@lucide/svelte/icons/key';
	import Hash from '@lucide/svelte/icons/hash';
	import LogIn from '@lucide/svelte/icons/log-in';

	import type { PageData } from './$types';
	import type { Session } from '@auth/core/types';

	type AppSession = Session & {
		accessToken?: string;
		user?: { battletag?: string } & NonNullable<Session['user']>;
	};

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let session = $derived(data.session as AppSession | undefined);
	let userBattletag = $derived(session?.user?.battletag ?? null);
	let accessToken = $derived(session?.accessToken ?? null);
</script>

<svelte:head>
	<title>Profile | Mr. Mythical</title>
</svelte:head>

<div class="container mx-auto max-w-4xl px-4 py-8">
	<div class="mb-8">
		<h1 class="font-heading text-foreground mb-2 text-3xl font-bold">Profile</h1>
		<p class="text-muted-foreground">
			View your Battle.net account information and authentication details.
		</p>
	</div>

	{#if session?.user}
		<div class="grid gap-6">
			<!-- User Information Card -->
			<div class="border-border bg-card rounded-lg border p-6 shadow-sm">
				<div class="mb-4 flex items-center gap-3">
					<div class="bg-primary/10 rounded-lg p-2">
						<User class="text-primary h-5 w-5" />
					</div>
					<h2 class="text-card-foreground text-xl font-semibold">Account Information</h2>
				</div>

				<div class="grid gap-4 md:grid-cols-2">
					<div class="space-y-2">
						<div class="text-muted-foreground flex items-center gap-2 text-sm font-medium">
							<User class="h-4 w-4" />
							Battle.net ID
						</div>
						<p class="bg-muted/50 text-card-foreground rounded-md px-3 py-2 text-lg font-semibold">
							{userBattletag || session.user.name || 'Unknown'}
						</p>
					</div>

					<div class="space-y-2">
						<div class="text-muted-foreground flex items-center gap-2 text-sm font-medium">
							<Hash class="h-4 w-4" />
							User ID
						</div>
						<p
							class="bg-muted/50 text-card-foreground rounded-md px-3 py-2 font-mono text-sm break-all"
						>
							{session.user.id}
						</p>
					</div>
				</div>
			</div>

			<!-- API Access Card -->
			{#if accessToken}
				<div class="border-border bg-card rounded-lg border p-6 shadow-sm">
					<div class="mb-4 flex items-center gap-3">
						<div class="bg-accent/10 rounded-lg p-2">
							<Key class="text-accent-foreground h-5 w-5" />
						</div>
						<h2 class="text-card-foreground text-xl font-semibold">API Access</h2>
					</div>

					<div class="space-y-2">
						<div class="text-muted-foreground flex items-center gap-2 text-sm font-medium">
							<Key class="h-4 w-4" />
							Access Token
						</div>
						<div class="bg-muted/50 rounded-md p-3">
							<p class="text-card-foreground font-mono text-xs break-all">
								{accessToken.substring(0, 40)}...
							</p>
							<p class="text-muted-foreground mt-2 text-xs">
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
			<div class="bg-muted/50 mx-auto mb-6 w-fit rounded-full p-4">
				<User class="text-muted-foreground h-12 w-12" />
			</div>
			<h2 class="text-foreground mb-2 text-2xl font-semibold">Sign In Required</h2>
			<p class="text-muted-foreground mx-auto mb-6 max-w-md">
				Please sign in with your Battle.net account to view your profile information and access API
				features.
			</p>
			<Button
				onclick={() => signIn('battlenet')}
				class="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg"
			>
				<LogIn class="mr-2 h-4 w-4" />
				Sign in with Battle.net
			</Button>
		</div>
	{/if}
</div>
