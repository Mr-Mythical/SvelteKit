import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const param = url.searchParams.get('t') || url.searchParams.get('destination');

	const routes = new Map([
		['Z3VpZGU=', 'aHR0cHM6Ly9zaG9wLnJlc3RlZHhwLmNvbS9yZWYvQnJhdW5lcnIv'],
		['dG9vbHM=', 'aHR0cHM6Ly9zaG9wLnJlc3RlZHhwLmNvbS9yZWYvQnJhdW5lcnIv'],
		['cmVzb3VyY2U=', 'aHR0cHM6Ly9zaG9wLnJlc3RlZHhwLmNvbS9yZWYvQnJhdW5lcnIv']
	]);

	if (param && routes.has(param)) {
		const encodedUrl = routes.get(param);
		if (encodedUrl) {
			try {
				const decodedUrl = atob(encodedUrl);
				await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));
				throw redirect(302, decodedUrl);
			} catch {
				// Fallback
			}
		}
	}

	const fallback = atob('aHR0cHM6Ly9zaG9wLnJlc3RlZHhwLmNvbS9yZWYvQnJhdW5lcnIv');
	throw redirect(302, fallback);
};
