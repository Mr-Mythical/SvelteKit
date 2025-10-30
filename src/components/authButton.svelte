<script lang="ts">
	import { page } from '$app/stores';
	import Button from '$lib/components/ui/button/button.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import User from 'lucide-svelte/icons/user';
	import LogOut from 'lucide-svelte/icons/log-out';
	import { signIn, signOut } from '@auth/sveltekit/client';

	$: session = $page.data.session;
</script>

{#if session?.user}
	<!-- User is logged in -->
	<DropdownMenu.Root>
		<DropdownMenu.Trigger asChild let:builder>
			<Button builders={[builder]} variant="outline" size="default" class="flex items-center gap-2">
				<User class="h-4 w-4" />
				<span class="hidden sm:inline">{session.user.battletag || session.user.name}</span>
			</Button>
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" class="w-56">
			<DropdownMenu.Label class="font-normal">
				<div class="flex flex-col space-y-1">
					<p class="text-sm font-medium leading-none">
						{session.user.battletag || session.user.name}
					</p>
					<p class="text-xs leading-none text-muted-foreground">Battle.net Account</p>
				</div>
			</DropdownMenu.Label>
			<DropdownMenu.Separator />
			<DropdownMenu.Item
				on:click={() => signOut()}
				class="cursor-pointer text-red-600 dark:text-red-400"
			>
				<LogOut class="mr-2 h-4 w-4" />
				<span>Sign out</span>
			</DropdownMenu.Item>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{:else}
	<!-- User is not logged in -->
	<Button on:click={() => signIn('battlenet')} variant="default" size="default">
		<User class="mr-2 h-4 w-4" />
		<span>Sign in with Battle.net</span>
	</Button>
{/if}
