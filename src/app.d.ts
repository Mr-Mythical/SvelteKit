// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { Session } from '@auth/core/types';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session?: Session;
			getSession?: () => Promise<Session | null>;
		}
		interface PageData {
			session?: Session;
		}
		// interface PageState {}
		interface Platform {
			env: {
				COUNTER: DurableObjectNamespace;
			};
			context: {
				waitUntil: (promise: Promise<any>) => void;
			};
			caches: CacheStorage & { default: Cache };
		}
	}
}

export async function post(context) {
	const counter = context.platform.env.COUNTER.idFromName('A');
}
