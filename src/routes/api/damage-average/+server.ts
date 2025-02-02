import { json, type RequestHandler } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://bxlzygqaozlmeefqmdqw.supabase.co'
const supabaseKey = env.SUPABASE_KEY;
if (!supabaseKey) {
	throw new Error('SUPABASE_KEY is not defined in environment variables.');
}
const supabase = createClient(supabaseUrl, supabaseKey);

export const GET: RequestHandler = async () => {
	try {
		const { data, error } = await supabase
			.from('average')
			.select('time_seconds, avg_damage, std_dev, count, confidence_interval')
			.order('time_seconds', { ascending: true });

		if (error) {
			throw new Error(error.message);
		}

		type RowData = {
			time_seconds: number;
			avg_damage: number;
			std_dev: number;
			count: number;
			confidence_interval: number;
		};

		const processedData = (data as RowData[]).map((row) => ({
			time_seconds: row.time_seconds,
			avg: row.avg_damage,
			std: row.std_dev,
			n: row.count,
			ci: row.confidence_interval
		}));

		return json(processedData);
	} catch (error) {
		return json({ error: (error as Error).message }, { status: 500 });
	}
};
