import { bosses } from '$lib/types/bossData';

export const GET = () => {
	const baseUrl = 'https://mrmythical.com';
	const bossRoutes = bosses.map((boss) => `/raid/boss/${boss.slug}`);

	const routes = [
		'/',
		'/rating-calculator',
		'/rating-calculator?score=1500',
		'/rating-calculator?score=2000',
		'/rating-calculator?score=2500',
		'/rating-calculator?score=3000',
		'/rating-calculator?score=3400',
		'/raid',
		'/raid/boss',
		...bossRoutes,
		'/about',
		'/privacy',
		'/cookie'
	];

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${routes
				.map(
					(route) => `
        <url>
          <loc>${baseUrl}${route}</loc>
          <lastmod>${new Date().toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>${route === '/' ? '1.0' : '0.8'}</priority>
        </url>`
				)
				.join('')}
    </urlset>`;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml'
		}
	});
};
