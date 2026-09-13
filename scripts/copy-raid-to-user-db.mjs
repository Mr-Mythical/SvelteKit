/**
 * Historical one-shot: copy raid analytics from an old DATABASE_URL into DATABASE_USER_URL.
 * Not used at runtime. Only needed if you must re-copy from a restored RaidData dump.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import postgres from 'postgres';

function loadEnv(path) {
	const text = readFileSync(path, 'utf8');
	const out = {};
	for (const line of text.split(/\r?\n/)) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const eq = trimmed.indexOf('=');
		if (eq === -1) continue;
		const key = trimmed.slice(0, eq).trim();
		let val = trimmed.slice(eq + 1).trim();
		if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
			val = val.slice(1, -1);
		}
		out[key] = val;
	}
	return out;
}

const env = loadEnv(resolve(process.cwd(), '.env'));
const sourceUrl = env.DATABASE_URL;
const targetUrl = env.DATABASE_USER_URL;
if (!sourceUrl || !targetUrl) {
	throw new Error('Need DATABASE_URL and DATABASE_USER_URL in .env');
}
if (sourceUrl === targetUrl) {
	throw new Error('DATABASE_URL and DATABASE_USER_URL are already the same — nothing to copy');
}

const TABLES = [
	'encounters',
	'healer_compositions',
	'damage_averages',
	'death_hotspots',
	'spec_statistics'
];

const source = postgres(sourceUrl, { max: 1, prepare: false });
const target = postgres(targetUrl, { max: 1, prepare: false });

async function count(sql, table) {
	const rows = await sql.unsafe(`SELECT COUNT(*)::int AS n FROM ${table}`);
	return rows[0].n;
}

async function main() {
	console.log('Pre-copy row counts (source → target):');
	const expected = {};
	for (const table of TABLES) {
		const s = await count(source, table);
		const t = await count(target, table);
		expected[table] = s;
		console.log(`  ${table}: ${s} → ${t}`);
	}

	// FK order: encounters first; dependents after. Truncate dependents first on target.
	await target.begin(async (tx) => {
		await tx.unsafe(`
			TRUNCATE TABLE
				healer_compositions,
				damage_averages,
				death_hotspots,
				spec_statistics,
				death_rate,
				spec_performance,
				encounters
			RESTART IDENTITY CASCADE
		`);

		for (const table of TABLES) {
			const rows = await source.unsafe(`SELECT * FROM ${table}`);
			if (rows.length === 0) {
				console.log(`Copied ${table}: 0 rows`);
				continue;
			}
			const columns = Object.keys(rows[0]);
			const BATCH = 200;
			for (let i = 0; i < rows.length; i += BATCH) {
				const batch = rows.slice(i, i + BATCH);
				await tx`INSERT INTO ${tx(table)} ${tx(batch, columns)}`;
			}

			// Reset serial sequences to max(id) when present
			if (columns.includes('id')) {
				await tx.unsafe(`
					SELECT setval(
						pg_get_serial_sequence('${table}', 'id'),
						COALESCE((SELECT MAX(id) FROM ${table}), 1),
						true
					)
				`);
			}
			console.log(`Copied ${table}: ${rows.length} rows`);
		}
	});

	console.log('Post-copy verification:');
	let ok = true;
	for (const table of TABLES) {
		const t = await count(target, table);
		const match = t === expected[table];
		console.log(`  ${table}: ${t} (expected ${expected[table]}) ${match ? 'OK' : 'MISMATCH'}`);
		if (!match) ok = false;
	}

	await source.end({ timeout: 5 });
	await target.end({ timeout: 5 });

	if (!ok) process.exit(1);
	console.log('Data copy complete.');
}

main().catch(async (err) => {
	console.error(err);
	try {
		await source.end({ timeout: 1 });
		await target.end({ timeout: 1 });
	} catch {
		/* ignore */
	}
	process.exit(1);
});
