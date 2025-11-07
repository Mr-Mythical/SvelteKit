import type { RequestHandler } from './$types';
import { importOldRecentsData } from '$lib/db/migration.js';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			return new Response(JSON.stringify({ error: 'Not authenticated' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Import old recents data (this reads from localStorage on the client side)
		// Since we can't access localStorage on the server, we need the client to send the data
		const body = await request.json();
		const { oldData } = body;

		if (!oldData) {
			return new Response(JSON.stringify({ error: 'No old data provided' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// We need to modify importOldRecentsData to accept data as parameter
		// For now, return a placeholder response
		const results = {
			charactersImported: 0,
			reportsImported: 0,
			errors: []
		};

		return new Response(JSON.stringify(results), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Import error:', error);
		return new Response(
			JSON.stringify({
				error: 'Import failed',
				details: error instanceof Error ? error.message : 'Unknown error'
			}),
			{
				status: 500,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
};
