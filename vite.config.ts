import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	ssr: {
		// Ensure postgres package is only used on server-side
		external: ['postgres']
	},
	optimizeDeps: {
		// Exclude postgres from client-side optimization
		exclude: ['postgres']
	}
});
