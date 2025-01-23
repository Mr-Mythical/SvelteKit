import { z } from 'zod';

const regionSchema = z.enum(['us', 'eu', 'tw', 'kr', 'cn']);

export const formSchema = z.object({
	region: regionSchema,
	characterName: z.string().min(1).max(20),
	realm: z.string().min(1).max(20)
});

export type FormSchema = typeof formSchema;
