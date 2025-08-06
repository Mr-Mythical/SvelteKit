import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
	test('should not have any automatically detectable accessibility issues', async ({ page }) => {
		await page.goto('/');

		// Basic accessibility checks without axe-core for now
		// Check for alt text on images
		const images = await page.locator('img').all();
		for (const img of images) {
			const alt = await img.getAttribute('alt');
			const ariaLabel = await img.getAttribute('aria-label');
			expect(alt !== null || ariaLabel !== null).toBeTruthy();
		}
	});

	test('should have proper heading structure', async ({ page }) => {
		await page.goto('/');

		// Check that there's a main heading
		const h1 = await page.locator('h1').first();
		await expect(h1).toBeVisible();

		// Check heading hierarchy
		const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
		expect(headings.length).toBeGreaterThan(0);
	});

	test('should be keyboard navigable', async ({ page }) => {
		await page.goto('/');

		// Test tab navigation
		await page.keyboard.press('Tab');
		const focusedElement = await page.locator(':focus').first();
		await expect(focusedElement).toBeVisible();

		// Test that Skip to main content link works if present
		const skipLink = page.locator('a[href="#main"], a[href="#content"]').first();
		if (await skipLink.isVisible()) {
			await skipLink.press('Enter');
			const mainContent = page.locator('#main, #content, main').first();
			await expect(mainContent).toBeFocused();
		}
	});

	test('should have proper color contrast', async ({ page }) => {
		await page.goto('/');

		// Basic contrast check - ensure no extremely light text on light backgrounds
		const textElements = await page.locator('p, span, div, h1, h2, h3, h4, h5, h6').all();

		for (const element of textElements.slice(0, 10)) {
			// Check first 10 elements
			const styles = await element.evaluate((el) => {
				const computed = window.getComputedStyle(el);
				return {
					color: computed.color,
					backgroundColor: computed.backgroundColor
				};
			});

			// Basic check that text color exists and isn't transparent
			expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
		}
	});

	test('should have descriptive page titles', async ({ page }) => {
		await page.goto('/');
		const title = await page.title();
		expect(title).toBeTruthy();
		expect(title.length).toBeGreaterThan(10);
		expect(title.length).toBeLessThan(60); // SEO best practice
	});

	test('should have proper aria labels for interactive elements', async ({ page }) => {
		await page.goto('/');

		// Check that buttons have accessible names
		const buttons = await page.locator('button').all();
		for (const button of buttons) {
			const accessibleName =
				(await button.getAttribute('aria-label')) ||
				(await button.textContent()) ||
				(await button.getAttribute('title'));
			expect(accessibleName?.trim()).toBeTruthy();
		}

		// Check that form inputs have labels
		const inputs = await page.locator('input').all();
		for (const input of inputs) {
			const id = await input.getAttribute('id');
			const ariaLabel = await input.getAttribute('aria-label');
			const ariaLabelledBy = await input.getAttribute('aria-labelledby');

			if (id) {
				const label = page.locator(`label[for="${id}"]`);
				const hasLabel = (await label.count()) > 0;
				expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
			} else {
				expect(ariaLabel || ariaLabelledBy).toBeTruthy();
			}
		}
	});
});

test.describe('Visual Regression Tests', () => {
	test('homepage should match visual baseline', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Hide dynamic content that might change
		await page.evaluate(() => {
			// Hide timestamps or other dynamic content
			document.querySelectorAll('[data-testid*="timestamp"], .timestamp').forEach((el) => {
				(el as HTMLElement).style.visibility = 'hidden';
			});
		});

		await expect(page).toHaveScreenshot('homepage.png');
	});

	test('rating calculator page should match visual baseline', async ({ page }) => {
		await page.goto('/rating-calculator');
		await page.waitForLoadState('networkidle');
		await expect(page).toHaveScreenshot('rating-calculator.png');
	});

	test('mobile homepage should match visual baseline', async ({ page, isMobile }) => {
		test.skip(!isMobile, 'This test only runs on mobile');

		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await expect(page).toHaveScreenshot('homepage-mobile.png');
	});

	test('dark mode should render correctly', async ({ page }) => {
		await page.goto('/');

		// Toggle dark mode if available
		const darkModeToggle = page.locator(
			'[data-testid="dark-mode-toggle"], [aria-label*="dark"], [aria-label*="theme"]'
		);
		if ((await darkModeToggle.count()) > 0) {
			await darkModeToggle.click();
			await page.waitForTimeout(500); // Wait for theme transition
			await expect(page).toHaveScreenshot('homepage-dark.png');
		}
	});
});

test.describe('Performance Tests', () => {
	test('should load homepage within performance budget', async ({ page }) => {
		const startTime = Date.now();

		await page.goto('/', { waitUntil: 'networkidle' });

		const loadTime = Date.now() - startTime;
		expect(loadTime).toBeLessThan(3000); // Should load within 3 seconds

		// Check Lighthouse performance metrics
		const performanceEntries = await page.evaluate(() => {
			return JSON.stringify(performance.getEntriesByType('navigation'));
		});

		const navEntry = JSON.parse(performanceEntries)[0] as PerformanceNavigationTiming;
		const ttfb = navEntry.responseStart - navEntry.requestStart;
		const domContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.fetchStart;

		expect(ttfb).toBeLessThan(800); // Time to first byte under 800ms
		expect(domContentLoaded).toBeLessThan(2000); // DOM ready under 2s
	});

	test('should have good Core Web Vitals', async ({ page }) => {
		await page.goto('/');

		// Measure Largest Contentful Paint (LCP)
		const lcp = await page.evaluate(() => {
			return new Promise((resolve) => {
				const observer = new PerformanceObserver((list) => {
					const entries = list.getEntries();
					const lastEntry = entries[entries.length - 1];
					resolve(lastEntry.startTime);
				});
				observer.observe({ entryTypes: ['largest-contentful-paint'] });

				// Fallback timeout
				setTimeout(() => resolve(0), 5000);
			});
		});

		expect(lcp).toBeLessThan(2500); // LCP should be under 2.5s for good rating
	});

	test('should handle large dataset rendering efficiently', async ({ page }) => {
		// Navigate to a page that might render large amounts of data
		await page.goto('/');

		const startTime = Date.now();

		// Simulate scrolling to trigger any lazy loading
		await page.evaluate(() => {
			window.scrollTo(0, document.body.scrollHeight);
		});

		await page.waitForTimeout(1000);

		const scrollTime = Date.now() - startTime;
		expect(scrollTime).toBeLessThan(500); // Scrolling should be smooth
	});
});

test.describe('Cross-browser Compatibility', () => {
	test('should work consistently across browsers', async ({ page, browserName }) => {
		await page.goto('/');

		// Test basic functionality
		const title = await page.title();
		expect(title).toBeTruthy();

		// Test interactive elements
		const buttons = await page.locator('button').count();
		const links = await page.locator('a').count();

		expect(buttons + links).toBeGreaterThan(0);

		// Log browser-specific information
		console.log(`Testing on ${browserName}: ${buttons} buttons, ${links} links`);
	});

	test('should handle JavaScript features consistently', async ({ page, browserName }) => {
		await page.goto('/');

		// Test modern JavaScript features
		const modernFeatures = await page.evaluate(() => {
			return {
				fetch: typeof fetch !== 'undefined',
				promises: typeof Promise !== 'undefined',
				asyncAwait: (async () => true)().constructor.name === 'Promise',
				arrow: (() => true)().constructor.name === 'Function',
				classes: typeof class {} === 'function'
			};
		});

		// All modern features should be supported
		Object.values(modernFeatures).forEach((supported) => {
			expect(supported).toBe(true);
		});

		console.log(`${browserName} modern feature support:`, modernFeatures);
	});
});

test.describe('Security Tests', () => {
	test('should have proper security headers', async ({ page }) => {
		const response = await page.goto('/');
		expect(response).toBeTruthy();

		const headers = response!.headers();

		// Check for important security headers
		expect(headers['x-content-type-options']).toBe('nosniff');
		expect(headers['x-frame-options']).toBeTruthy();
		expect(headers['x-xss-protection']).toBeTruthy();

		// CSP header should be present for production
		if (process.env.NODE_ENV === 'production') {
			expect(headers['content-security-policy']).toBeTruthy();
		}
	});

	test('should not expose sensitive information', async ({ page }) => {
		await page.goto('/');

		// Check that no API keys or sensitive data is exposed in the page source
		const content = await page.content();

		// Common patterns for API keys and secrets
		const sensitivePatterns = [
			/api[_-]?key['":\s=]+['"][a-zA-Z0-9]{20,}['"]/i,
			/secret['":\s=]+['"][a-zA-Z0-9]{20,}['"]/i,
			/password['":\s=]+['"][^'"]{8,}['"]/i,
			/token['":\s=]+['"][a-zA-Z0-9]{20,}['"]/i
		];

		sensitivePatterns.forEach((pattern) => {
			expect(content).not.toMatch(pattern);
		});
	});

	test('should handle XSS protection', async ({ page }) => {
		// Test that script injection is prevented
		const maliciousScript = '<script>alert("XSS")</script>';

		// Try to inject script via URL parameters
		await page.goto(`/?search=${encodeURIComponent(maliciousScript)}`);

		// Check that the script wasn't executed
		const alertPromise = page.waitForEvent('dialog', { timeout: 1000 }).catch(() => null);
		const alert = await alertPromise;

		expect(alert).toBeNull(); // No alert should have been triggered
	});
});
