<script lang="ts">
	import { signIn, signOut } from '@auth/sveltekit/client';
	import { page } from '$app/stores';
	import { fly, fade, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import Button from '$lib/components/ui/button/button.svelte';
	import LogIn from 'lucide-svelte/icons/log-in';
	import LogOut from 'lucide-svelte/icons/log-out';
	import User from 'lucide-svelte/icons/user';
	import Loader2 from 'lucide-svelte/icons/loader-2';

	export let mobile: boolean = false;

	let isSigningIn = false;
	let isSigningOut = false;

	$: session = $page.data.session;
	$: userBattletag = session?.user ? (session.user as any).battletag : null;
	$: isLoading = isSigningIn || isSigningOut;

	// Check if we're in the middle of an OAuth flow
	$: {
		if (typeof window !== 'undefined') {
			const urlParams = new URLSearchParams(window.location.search);
			// If we have OAuth callback parameters, we're returning from Battle.net
			if (urlParams.has('code') || urlParams.has('state')) {
				isSigningIn = true;
			}
			// Reset loading state once we have a session (sign-in complete)
			if (session?.user && isSigningIn) {
				isSigningIn = false;
			}
			// Reset loading state once session is cleared (sign-out complete)
			if (!session?.user && isSigningOut) {
				isSigningOut = false;
			}
		}
	}

	async function handleSignIn() {
		isSigningIn = true;
		try {
			// Note: signIn redirects to Battle.net, so this won't return until page reload
			await signIn('battlenet');
		} catch (error) {
			console.error('Sign in error:', error);
			// Only reset loading state if there's an error (redirect failed)
			isSigningIn = false;
		}
		// Don't reset isSigningIn here - the page will redirect/reload
	}

	async function handleSignOut() {
		isSigningOut = true;
		try {
			// Note: signOut may redirect/reload, so this might not return
			await signOut();
		} catch (error) {
			console.error('Sign out error:', error);
			// Only reset loading state if there's an error
			isSigningOut = false;
		}
		// Don't reset isSigningOut here - let the session reactivity handle it
	}
</script>

{#if mobile}
	<!-- Mobile menu styling -->
	{#if session?.user}
		<div 
			class="flex flex-col gap-2 px-4 py-2 border-t border-border"
			in:fly={{ y: -10, duration: 300, easing: quintOut }}
			out:fly={{ y: -10, duration: 200 }}
		>
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<div class="relative">
					<User class="h-4 w-4" />
				</div>
				<span class="animate-fade-in">{userBattletag || session.user.name}</span>
			</div>
			<Button 
				variant="destructive" 
				size="sm" 
				on:click={handleSignOut}
				disabled={isSigningOut}
				class="w-full justify-center transition-all duration-200 hover:scale-[0.98] active:scale-95"
			>
				{#if isSigningOut}
					<Loader2 class="h-4 w-4 mr-2 animate-spin" />
					Signing out...
				{:else}
					<LogOut class="h-4 w-4 mr-2" />
					Sign Out
				{/if}
			</Button>
		</div>
	{:else}
		<div 
			class="px-4 py-2 border-t border-border"
			in:fly={{ y: 10, duration: 300, easing: quintOut }}
			out:fly={{ y: 10, duration: 200 }}
		>
			<Button 
				variant="default" 
				size="sm" 
				on:click={handleSignIn}
				disabled={isSigningIn}
				class="w-full justify-center bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white transition-all duration-200 hover:scale-[1.02] active:scale-95 hover:shadow-lg"
			>
				{#if isSigningIn}
					<Loader2 class="h-4 w-4 mr-2 animate-spin" />
					Redirecting to Battle.net...
				{:else}
					<LogIn class="h-4 w-4 mr-2" />
					Sign in with Battle.net
				{/if}
			</Button>
		</div>
	{/if}
{:else}
	<!-- Desktop styling -->
	<div class="flex items-center gap-3">
		{#if session?.user}
			<div 
				class="flex items-center gap-3"
				in:fly={{ x: 20, duration: 400, easing: quintOut }}
				out:fly={{ x: 20, duration: 200 }}
			>
				<div class="hidden md:flex items-center gap-2 text-sm">
					<div class="relative">
						<User class="h-4 w-4 text-muted-foreground" />
					</div>
					<span class="text-foreground animate-fade-in">
						<span class="text-primary font-semibold">{userBattletag || session.user.name}</span>
					</span>
				</div>
				<div class="md:hidden text-xs text-muted-foreground animate-fade-in">
					{userBattletag || session.user.name}
				</div>
				<Button 
					variant="destructive" 
					size="sm" 
					on:click={handleSignOut}
					disabled={isSigningOut}
					class="flex items-center gap-1.5 transition-all duration-200 hover:scale-[0.98] active:scale-95"
				>
					{#if isSigningOut}
						<Loader2 class="h-4 w-4 animate-spin" />
						<span class="hidden md:inline">Signing out...</span>
					{:else}
						<LogOut class="h-4 w-4" />
						<span class="hidden md:inline">Sign Out</span>
					{/if}
				</Button>
			</div>
		{:else}
			<div
				in:fly={{ x: -20, duration: 400, easing: quintOut }}
				out:fly={{ x: -20, duration: 200 }}
			>
				<Button 
					variant="default" 
					size="sm" 
					on:click={handleSignIn}
					disabled={isSigningIn}
					class="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
				>
					{#if isSigningIn}
						<Loader2 class="h-4 w-4 animate-spin" />
						<span class="hidden md:inline">Redirecting to Battle.net...</span>
						<span class="md:hidden">Redirecting...</span>
					{:else}
						<LogIn class="h-4 w-4" />
						<span class="hidden md:inline">Sign in with Battle.net</span>
						<span class="md:hidden">Sign In</span>
					{/if}
				</Button>
			</div>
		{/if}
	</div>
{/if}

<style>
	@keyframes fade-in {
		from { opacity: 0; transform: translateY(-5px); }
		to { opacity: 1; transform: translateY(0); }
	}
	
	.animate-fade-in {
		animation: fade-in 0.3s ease-out;
	}
</style>