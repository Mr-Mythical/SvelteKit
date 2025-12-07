import { z } from 'zod';

export const formSchema = z.object({
	bossId: z.string({
		required_error: 'Please select a boss'
	}),
	difficulty: z.string().optional(),
	fightFilter: z.enum(['kills_wipes', 'kills_no_deaths', 'kills_all']).default('kills_wipes')
});

export type FormSchema = typeof formSchema;
