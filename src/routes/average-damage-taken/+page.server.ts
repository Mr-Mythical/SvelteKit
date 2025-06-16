import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { formSchema } from './schema.js';

export const load: PageServerLoad = async () => {
    const form = await superValidate(zod(formSchema));
    
    return {
        form
    };
};

export const actions: Actions = {
    default: async (event) => {
        const form = await superValidate(event, zod(formSchema));
        
        if (!form.valid) {
            return fail(400, {
                form
            });
        }

        // Form is valid, return the data
        return {
            form
        };
    }
};
