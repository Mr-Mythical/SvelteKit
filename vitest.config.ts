import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: ['node_modules', 'dist', '.svelte-kit'],
		environment: 'jsdom',
		setupFiles: ['./src/test-setup.ts'],
		globals: true,
		watch: false,
		reporters: ['verbose', 'html', 'json'],
		outputFile: {
			html: './test-results/index.html',
			json: './test-results/results.json'
		},
		pool: 'threads',
		poolOptions: {
			threads: {
				singleThread: false
			}
		},
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov'],
			reportsDirectory: './coverage',
			include: ['src/**/*.{js,ts,svelte}'],
			exclude: [
				'coverage/**',
				'dist/**',
				'**/node_modules/**',
				'**/test-results/**',
				'**/*.d.ts',
				'**/*.config.*',
				'**/*.test.*',
				'**/*.spec.*',
				'**/mocks/**',
				'src/test-*',
				'src/**/__tests__/**',
				'src/app.html',
				'playwright.config.ts',
				'vite.config.ts',
				'svelte.config.js',
				'tailwind.config.ts'
			],
			// Current thresholds based on existing coverage
			thresholds: {
				branches: 10,
				functions: 8,
				lines: 4,
				statements: 4
			}
		}
	}
});
