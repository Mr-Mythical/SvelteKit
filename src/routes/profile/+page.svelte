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

<div class="container mx-auto px-4 py-8 max-w-4xl">
	<div class="mb-8">
		<h1 class="text-3xl font-heading font-bold text-foreground mb-2">Profile</h1>
		<p class="text-muted-foreground">View your Battle.net account information and authentication details.</p>
	</div>
	
	{#if session?.user}
		<div class="grid gap-6">
			<!-- User Information Card -->
			<div class="bg-card border border-border rounded-lg p-6 shadow-sm">
				<div class="flex items-center gap-3 mb-4">
					<div class="p-2 bg-primary/10 rounded-lg">
						<User class="h-5 w-5 text-primary" />
					</div>
					<h2 class="text-xl font-semibold text-card-foreground">Account Information</h2>
				</div>
				
				<div class="grid gap-4 md:grid-cols-2">
					<div class="space-y-2">
						<div class="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<User class="h-4 w-4" />
							Battle.net ID
						</div>
						<p class="text-lg font-semibold text-card-foreground bg-muted/50 px-3 py-2 rounded-md">
							{userBattletag || session.user.name || 'Unknown'}
						</p>
					</div>
					
					<div class="space-y-2">
						<div class="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<Hash class="h-4 w-4" />
							User ID
						</div>
						<p class="text-sm font-mono text-card-foreground bg-muted/50 px-3 py-2 rounded-md break-all">
							{session.user.id}
						</p>
					</div>
				</div>
			</div>

			<!-- API Access Card -->
			{#if accessToken}
				<div class="bg-card border border-border rounded-lg p-6 shadow-sm">
					<div class="flex items-center gap-3 mb-4">
						<div class="p-2 bg-accent/10 rounded-lg">
							<Key class="h-5 w-5 text-accent-foreground" />
						</div>
						<h2 class="text-xl font-semibold text-card-foreground">API Access</h2>
					</div>
					
					<div class="space-y-2">
						<div class="text-sm font-medium text-muted-foreground flex items-center gap-2">
							<Key class="h-4 w-4" />
							Access Token
						</div>
						<div class="bg-muted/50 p-3 rounded-md">
							<p class="text-xs font-mono text-card-foreground break-all">
								{accessToken.substring(0, 40)}...
							</p>
							<p class="text-xs text-muted-foreground mt-2">
								This token can be used to make authenticated API calls to Battle.net services.
							</p>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<!-- Not Signed In State -->
		<div class="text-center py-12">
			<div class="mx-auto mb-6 p-4 bg-muted/50 rounded-full w-fit">
				<User class="h-12 w-12 text-muted-foreground" />
			</div>
			<h2 class="text-2xl font-semibold text-foreground mb-2">Sign In Required</h2>
			<p class="text-muted-foreground mb-6 max-w-md mx-auto">
				Please sign in with your Battle.net account to view your profile information and access API features.
			</p>
			<Button 
				on:click={() => signIn('battlenet')}
				class="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
			>
				<LogIn class="h-4 w-4 mr-2" />
				Sign in with Battle.net
			</Button>
		</div>
	{/if}
</div>