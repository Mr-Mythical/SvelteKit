import { describe, expect, it } from 'vitest';
import * as FormExports from '$lib/components/ui/form';

describe('ui form index exports', () => {
	it('exposes canonical and alias exports', () => {
		expect(FormExports).toHaveProperty('Field');
		expect(FormExports).toHaveProperty('Control');
		expect(FormExports).toHaveProperty('Label');
		expect(FormExports).toHaveProperty('Button');
		expect(FormExports).toHaveProperty('FieldErrors');
		expect(FormExports).toHaveProperty('Description');
		expect(FormExports).toHaveProperty('Fieldset');
		expect(FormExports).toHaveProperty('Legend');
		expect(FormExports).toHaveProperty('ElementField');

		expect(FormExports.FormField).toBe(FormExports.Field);
		expect(FormExports.FormControl).toBe(FormExports.Control);
		expect(FormExports.FormLabel).toBe(FormExports.Label);
		expect(FormExports.FormButton).toBe(FormExports.Button);
		expect(FormExports.FormDescription).toBe(FormExports.Description);
		expect(FormExports.FormFieldErrors).toBe(FormExports.FieldErrors);
		expect(FormExports.FormFieldset).toBe(FormExports.Fieldset);
		expect(FormExports.FormLegend).toBe(FormExports.Legend);
		expect(FormExports.FormElementField).toBe(FormExports.ElementField);
	});
});
