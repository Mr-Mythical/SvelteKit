import { z } from 'zod';

export const formSchema = z.object({
	bossId: z.string({
		required_error: 'Please select a boss'
	})
});

export type FormSchema = typeof formSchema;
