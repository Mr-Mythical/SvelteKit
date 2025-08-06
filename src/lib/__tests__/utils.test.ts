import { describe, it, expect } from 'vitest';
import { cn } from '../utils.js';

describe('utils', () => {
	describe('cn', () => {
		it('should merge class names correctly', () => {
			const result = cn('px-2', 'py-1', 'bg-red-500');
			expect(result).toBe('px-2 py-1 bg-red-500');
		});

		it('should handle conditional classes', () => {
			const isActive = true;
			const result = cn('base-class', isActive && 'active-class');
			expect(result).toBe('base-class active-class');
		});

		it('should handle undefined/null classes', () => {
			const result = cn('base-class', undefined, null, 'other-class');
			expect(result).toBe('base-class other-class');
		});

		it('should merge conflicting Tailwind classes properly', () => {
			const result = cn('px-2 px-4');
			expect(result).toBe('px-4');
		});

		it('should handle arrays and objects', () => {
			const result = cn(['px-2', 'py-1'], { 'bg-red-500': true, 'bg-blue-500': false });
			expect(result).toBe('px-2 py-1 bg-red-500');
		});
	});
});
