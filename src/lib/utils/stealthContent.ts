export function createStealthyContent() {
	// Dynamically create content to avoid static analysis
	const baseElements = {
		d: 'div',
		a: 'a',
		i: 'img'
	};

	const domains = ['shop', 'restedxp', 'com'].join('.');

	const path = ['ref', 'Braunerr'].join('/');

	return {
		url: `https://${domains}/${path}/`,
		createElement: (type: keyof typeof baseElements) => document.createElement(baseElements[type])
	};
}

// Function to dynamically modify links after page load to avoid detection
export function enhanceContentVisibility() {
	// Wait for page to fully load, then modify any blocked elements
	setTimeout(() => {
		const elements = document.querySelectorAll('[data-content-type="showcase"]');
		elements.forEach((element) => {
			if (element && window.getComputedStyle(element).display === 'none') {
				// Element is hidden, try to make it visible
				const htmlElement = element as HTMLElement;
				htmlElement.style.display = 'block';
				htmlElement.style.visibility = 'visible';
				htmlElement.style.opacity = '1';
			}
		});
	}, 1000);
}

// Check if content is being blocked and provide alternative
export function checkContentBlocking(): boolean {
	const testElement = document.createElement('div');
	testElement.className = 'advertisement banner-ad';
	testElement.style.position = 'absolute';
	testElement.style.left = '-9999px';
	document.body.appendChild(testElement);

	const isBlocked = window.getComputedStyle(testElement).display === 'none';
	document.body.removeChild(testElement);

	return isBlocked;
}
