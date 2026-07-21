import { absoluteUrl, feedRoutes, SITE_ORIGIN } from '$lib/data/siteRoutes';

function escapeXml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&apos;');
}

export const GET = () => {
	const items = feedRoutes()
		.slice()
		.sort((a, b) => b.lastmod.localeCompare(a.lastmod))
		.map((route) => {
			const link = absoluteUrl(route.path);
			return `    <item>
      <title>${escapeXml(route.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(route.lastmod + 'T12:00:00.000Z').toUTCString()}</pubDate>
      <description>${escapeXml(route.description)}</description>
    </item>`;
		})
		.join('\n');

	const latest = feedRoutes().reduce(
		(max, route) => (route.lastmod > max ? route.lastmod : max),
		'1970-01-01'
	);

	const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Mr. Mythical</title>
    <link>${SITE_ORIGIN}</link>
    <description>Mythic+ and raid tools for World of Warcraft, plus free in-game addons.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date(latest + 'T12:00:00.000Z').toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_ORIGIN}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

	return new Response(rss, {
		headers: {
			'Content-Type': 'application/rss+xml; charset=utf-8',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
