import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	// Get the target parameter
	const target = url.searchParams.get('target');

	// Define safe redirect targets to prevent open redirect vulnerabilities
	const allowedTargets = {
		partner: 'https://shop.restedxp.com/ref/Braunerr/',
		guide: 'https://shop.restedxp.com/ref/Braunerr/'
	};

	if (target && allowedTargets[target as keyof typeof allowedTargets]) {
		throw redirect(302, allowedTargets[target as keyof typeof allowedTargets]);
	}

	// Default fallback
	throw redirect(302, 'https://shop.restedxp.com/ref/Braunerr/');
};
