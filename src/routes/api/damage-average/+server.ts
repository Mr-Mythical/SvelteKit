import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bxlzygqaozlmeefqmdqw.supabase.co';
const supabaseKey = env.SUPABASE_KEY;
if (!supabaseKey) {
	throw new Error('SUPABASE_KEY is not defined in environment variables.');
}
const supabase = createClient(supabaseUrl, supabaseKey);

export const GET: RequestHandler = async ({ url }) => {
	try {
		const bossId = url.searchParams.get('bossId');

		if (!bossId) {
			return json({ error: 'No bossId provided' }, { status: 400 });
		}

		const { data, error } = await supabase
			.from('damage_averages')
			.select('time_seconds, avg_damage, std_dev, count, confidence_interval, encounter_id')
			.eq('encounter_id', parseInt(bossId))
			.order('time_seconds', { ascending: true });

		if (error) {
			throw new Error(error.message);
		}

		// Ensure data is an array
		if (!Array.isArray(data)) {
			console.error('Unexpected data format:', data);
			return json([]); // Return empty array if data is invalid
		}

		type RowData = {
			time_seconds: number;
			avg_damage: number;
			std_dev: number;
			count: number;
			confidence_interval: number;
			encounter_id: number;
		};

		const processedData = (data as RowData[]).map((row) => ({
			time_seconds: row.time_seconds,
			avg: row.avg_damage,
			std: row.std_dev,
			n: row.count,
			ci: row.confidence_interval,
			encounter_id: row.encounter_id
		}));

		return json(processedData);
	} catch (error) {
		console.error('Server error:', error);
		return json({ error: (error as Error).message }, { status: 500 });
	}
};
