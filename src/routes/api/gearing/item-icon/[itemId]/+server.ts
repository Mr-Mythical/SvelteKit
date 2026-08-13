import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

type Preview = { icon: string; name?: string; tooltip?: string };

const previewCache = new Map<number, Preview>();
const MAX_PREVIEW_CACHE = 2048;

function cachePreview(itemId: number, preview: Preview): void {
	if (previewCache.size >= MAX_PREVIEW_CACHE) {
		const oldest = previewCache.keys().next().value;
		if (oldest != null) previewCache.delete(oldest);
	}
	previewCache.set(itemId, preview);
}

async function resolvePreview(itemId: number): Promise<Preview | null> {
	const cached = previewCache.get(itemId);
	if (cached) return cached;
	try {
		const res = await fetch(`https://nether.wowhead.com/tooltip/item/${itemId}?dataEnv=1`, {
			headers: { Accept: 'application/json' }
		});
		if (!res.ok) return null;
		const text = await res.text();
		const jsonStart = text.indexOf('{');
		const jsonEnd = text.lastIndexOf('}');
		if (jsonStart < 0 || jsonEnd <= jsonStart) return null;
		const data = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as {
			icon?: string;
			name?: string;
			tooltip?: string;
		};
		const icon = typeof data.icon === 'string' ? data.icon.trim() : '';
		if (!icon) return null;
		const preview: Preview = {
			icon,
			name: typeof data.name === 'string' ? data.name : undefined,
			tooltip: typeof data.tooltip === 'string' ? data.tooltip : undefined
		};
		cachePreview(itemId, preview);
		return preview;
	} catch {
		return null;
	}
}

/**
 * GET /api/gearing/item-icon/[itemId]
 * Returns `{ icon, name?, tooltip? }` from Wowhead (server-side; avoids browser CORS).
 */
export const GET: RequestHandler = async ({ params, setHeaders }) => {
	const itemId = Number(params.itemId);
	if (!Number.isFinite(itemId) || itemId <= 0) {
		return json({ error: 'Bad item id' }, { status: 400 });
	}

	const preview = await resolvePreview(itemId);
	if (!preview) {
		return json({ error: 'Icon not found' }, { status: 404 });
	}

	setHeaders({
		'cache-control': 'public, max-age=86400, stale-while-revalidate=604800',
		// Bust stale clients that cached the icon-only response before tooltips were added.
		'x-gearing-icon-api': '2'
	});
	return json(preview);
};
