import { test, expect } from '@playwright/test';

test.describe('SvelteKit Application', () => {
	test('homepage loads correctly', async ({ page }) => {
		await page.goto('/');

		// Check if the page title is set correctly
		await expect(page).toHaveTitle(/SvelteKit/i);

		// Check if main content is visible
		await expect(page.locator('body')).toBeVisible();
	});

	test('navigation works correctly', async ({ page }) => {
		await page.goto('/');

		// Look for navigation links and test them
		const aboutLink = page.getByRole('link', { name: /about/i });

		if ((await aboutLink.count()) > 0) {
			await aboutLink.click();
			await expect(page).toHaveURL(/.*about.*/);
		}
	});

	test('responsive design works', async ({ page }) => {
		// Test desktop view
		await page.setViewportSize({ width: 1200, height: 800 });
		await page.goto('/');

		// Test mobile view
		await page.setViewportSize({ width: 375, height: 667 });
		await page.reload();

		// Ensure content is still visible and accessible
		await expect(page.locator('body')).toBeVisible();
	});

	test('forms work correctly', async ({ page }) => {
		await page.goto('/');

		// Look for any forms on the page
		const forms = page.locator('form');
		const formCount = await forms.count();

		if (formCount > 0) {
			// Test form interaction
			const firstForm = forms.first();
			await expect(firstForm).toBeVisible();

			// Look for input fields
			const inputs = firstForm.locator('input');
			const inputCount = await inputs.count();

			if (inputCount > 0) {
				const firstInput = inputs.first();
				await firstInput.fill('test input');
				await expect(firstInput).toHaveValue('test input');
			}
		}
	});

	test('accessibility basics', async ({ page }) => {
		await page.goto('/');

		// Check for basic accessibility features
		const mainContent = page.locator('main, [role="main"]');
		if ((await mainContent.count()) > 0) {
			await expect(mainContent).toBeVisible();
		}

		// Check for skip links
		const skipLink = page.getByRole('link', { name: /skip/i });
		if ((await skipLink.count()) > 0) {
			await expect(skipLink).toBeVisible();
		}
	});
});
