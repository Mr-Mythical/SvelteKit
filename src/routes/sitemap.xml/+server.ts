export const GET = async () => {
	const baseUrl = 'https://mrmythical.com';

	const routes = [
		'/',
		'/rating-calculator',
		'/raid',
		'/raid/boss/plexus-sentinel',
		'/raid/boss/loomithar',
		'/raid/boss/soulbinder-naazindhri',
		'/raid/boss/forgeweaver-araz',
		'/raid/boss/the-soul-hunters',
		'/raid/boss/fractillus',
		'/raid/boss/nexus-king-salhadaar',
		'/raid/boss/dimensius-the-all-devouring',
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
