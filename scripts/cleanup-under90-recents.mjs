import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';

const MIN_CHARACTER_LEVEL = 90;
const CONCURRENCY = 5;

function loadDotEnv() {
	const envPath = path.resolve(process.cwd(), '.env');
	if (!fs.existsSync(envPath)) return;

	const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line || line.startsWith('#')) continue;
		const eq = line.indexOf('=');
		if (eq <= 0) continue;
		const key = line.slice(0, eq).trim();
		const value = line.slice(eq + 1).trim().replace(/^['\"]|['\"]$/g, '');
		if (!(key in process.env)) process.env[key] = value;
	}
}

async function getBlizzardAccessToken() {
	const clientId = process.env.BLIZZARD_CLIENT_ID;
	const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;
	if (!clientId || !clientSecret) {
		throw new Error('Missing BLIZZARD_CLIENT_ID or BLIZZARD_CLIENT_SECRET');
	}

	const body = new URLSearchParams({ grant_type: 'client_credentials' });
	const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
	const res = await fetch('https://oauth.battle.net/token', {
		method: 'POST',
		headers: {
			Authorization: `Basic ${auth}`,
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body
	});

	if (!res.ok) {
		throw new Error(`Failed to get Blizzard token: ${res.status}`);
	}

	const data = await res.json();
	if (!data?.access_token) {
		throw new Error('Blizzard token response missing access_token');
	}
	return data.access_token;
}

function normalizeRealmSlug(realm) {
	return realm.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
}

async function fetchCharacterLevel(token, region, realm, characterName) {
	const regionLc = region.toLowerCase();
	const realmLc = normalizeRealmSlug(realm);
	const nameLc = characterName.toLowerCase();
	const summaryUrl = `https://${encodeURIComponent(regionLc)}.api.blizzard.com/profile/wow/character/${encodeURIComponent(realmLc)}/${encodeURIComponent(nameLc)}?namespace=profile-${encodeURIComponent(regionLc)}&locale=en_US`;

	const res = await fetch(summaryUrl, {
		headers: { Authorization: `Bearer ${token}` }
	});
	if (!res.ok) return null;

	const data = await res.json();
	return typeof data?.level === 'number' ? data.level : null;
}

async function run() {
	loadDotEnv();

	const databaseUrl = process.env.DATABASE_USER_URL || process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error('Missing DATABASE_USER_URL (or DATABASE_URL)');
	}

	const sql = postgres(databaseUrl, { max: 1 });
	try {
		const rows = await sql`
			select id, entity_data
			from user_recents
			where type = 'character'
		`;

		if (rows.length === 0) {
			console.log('No character recents found.');
			return;
		}

		const token = await getBlizzardAccessToken();
		const idsToDelete = [];
		let processed = 0;

		for (let i = 0; i < rows.length; i += CONCURRENCY) {
			const batch = rows.slice(i, i + CONCURRENCY);
			const checks = await Promise.all(
				batch.map(async (row) => {
					const data = row.entity_data ?? {};
					const region = typeof data.region === 'string' ? data.region : null;
					const realm = typeof data.realm === 'string' ? data.realm : null;
					const characterName =
						typeof data.characterName === 'string' ? data.characterName : null;

					if (!region || !realm || !characterName) {
						return { id: row.id, delete: false, reason: 'missing data' };
					}

					const level = await fetchCharacterLevel(token, region, realm, characterName);
					if (level !== null && level < MIN_CHARACTER_LEVEL) {
						return { id: row.id, delete: true, reason: `level ${level}` };
					}
					return { id: row.id, delete: false, reason: level === null ? 'unknown level' : `level ${level}` };
				})
			);

			for (const check of checks) {
				processed += 1;
				if (check.delete) idsToDelete.push(check.id);
			}
			console.log(`Processed ${processed}/${rows.length} recent characters...`);
		}

		if (idsToDelete.length === 0) {
			console.log('No under-90 character recents found to delete.');
			return;
		}

		await sql`delete from user_recents where id in ${sql(idsToDelete)}`;
		console.log(`Deleted ${idsToDelete.length} under-90 character recents.`);
	} finally {
		await sql.end();
	}
}

run().catch((error) => {
	console.error('Cleanup failed:', error);
	process.exit(1);
});
