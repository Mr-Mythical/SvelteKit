module.exports = {
	root: true,
	env: {
		browser: true,
		es2021: true,
		node: true
	},
	parserOptions: {
		ecmaVersion: 2021,
		sourceType: 'module'
	},
	extends: ['eslint:recommended', 'plugin:svelte/recommended', 'prettier'],
	plugins: ['svelte', 'prettier'],
	overrides: [
		{
			files: ['**/*.svelte'],
			parser: 'svelte-eslint-parser'
		}
	],
	rules: {
		'prettier/prettier': 'error'
		// Add custom rules if needed, e.g., "no-console": "warn"
	}
};
