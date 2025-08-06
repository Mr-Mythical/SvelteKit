import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import DungeonCombobox from '../dungeonCombobox.svelte';

describe('DungeonCombobox', () => {
	const mockDungeons = [
		{ value: 'dungeon1', label: 'Mythic+ Dungeon 1', short_name: 'MD1' },
		{ value: 'dungeon2', label: 'Mythic+ Dungeon 2', short_name: 'MD2' },
		{ value: 'dungeon3', label: 'Raid Dungeon 1', short_name: 'RD1' }
	];

	afterEach(() => {
		cleanup();
	});

	it('should render with placeholder text when no selection', () => {
		const mockOnSelect = vi.fn();

		render(DungeonCombobox, {
			props: {
				dungeons: mockDungeons,
				selectedValue: '',
				onSelect: mockOnSelect,
				triggerId: 'test-trigger-1'
			}
		});

		// Use getAllByText to handle multiple elements (desktop and mobile versions)
		const elements = screen.getAllByText('Select a dungeon...');
		expect(elements.length).toBeGreaterThan(0);
	});

	it('should display selected dungeon label', () => {
		const mockOnSelect = vi.fn();

		render(DungeonCombobox, {
			props: {
				dungeons: mockDungeons,
				selectedValue: 'dungeon1',
				onSelect: mockOnSelect,
				triggerId: 'test-trigger-2'
			}
		});

		expect(screen.getByText('Mythic+ Dungeon 1')).toBeDefined();
	});

	it('should render combobox role', () => {
		const mockOnSelect = vi.fn();

		render(DungeonCombobox, {
			props: {
				dungeons: mockDungeons,
				selectedValue: '',
				onSelect: mockOnSelect,
				triggerId: 'test-trigger-3'
			}
		});

		const trigger = screen.getByRole('combobox');
		expect(trigger).toBeDefined();
		expect(trigger.getAttribute('id')).toBe('test-trigger-3');
	});

	it('should handle empty dungeons array gracefully', () => {
		const mockOnSelect = vi.fn();

		render(DungeonCombobox, {
			props: {
				dungeons: [],
				selectedValue: '',
				onSelect: mockOnSelect,
				triggerId: 'test-trigger-4'
			}
		});

		const elements = screen.getAllByText('Select a dungeon...');
		expect(elements.length).toBeGreaterThan(0);
	});
});
