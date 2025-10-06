// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			getSession(): Promise<Session | null>;
		}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: {
				COUNTER: DurableObjectNamespace;
				BLIZZARD_CLIENT_ID: string;
				BLIZZARD_CLIENT_SECRET: string;
				BLIZZARD_REGION?: string;
				AUTH_SECRET: string;
			};
			context: {
				waitUntil: (promise: Promise<any>) => void;
			};
			caches: CacheStorage & { default: Cache };
		}
	}
}

// Extend Auth.js types
declare module '@auth/core/types' {
	interface User {
		battletag?: string;
	}
	
	interface Session {
		user: {
			id: string;
			name?: string | null;
			email?: string | null;
			image?: string | null;
			battletag?: string;
		};
	}
}

declare module '@auth/core/jwt' {
	interface JWT {
		battletag?: string;
	}
}

// Auth.js Session Types
interface Session {
	user: {
		id: string;
		name?: string | null;
		email?: string | null;
		image?: string | null;
		battletag?: string;
	};
	expires: string;
}

interface JWT {
	sub?: string;
	accessToken?: string;
	battletag?: string;
}

export async function post(context) {
	const counter = context.platform.env.COUNTER.idFromName('A');
}
