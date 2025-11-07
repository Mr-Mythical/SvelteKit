import { sequence } from '@sveltejs/kit/hooks';
import { handle as authHandle } from './auth';
import type { Handle } from '@sveltejs/kit';

// First handle auth
const handleAuth: Handle = authHandle;

// Add session to locals
const handleSession: Handle = async ({ event, resolve }) => {
	event.locals.getSession = async () => {
		const response = await fetch(`${event.url.origin}/auth/session`, {
			headers: {
				cookie: event.request.headers.get('cookie') || ''
			}
		});
		if (response.ok) {
			return await response.json();
		}
		return null;
	};
	
	return resolve(event);
};

export const handle = sequence(handleAuth, handleSession);