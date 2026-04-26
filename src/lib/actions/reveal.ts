/**
 * Intersection-based reveal action.
 *
 * Adds `data-revealed="true"` to the element the first time it enters the
 * viewport, so CSS can transition from a pre-reveal state to the final state.
 *
 * Honors `prefers-reduced-motion`: reveals instantly without waiting for
 * intersection, and without transition (the caller's CSS should drop
 * transitions under the reduced-motion query).
 */
export function reveal(
	node: HTMLElement,
	options: { delay?: number; rootMargin?: string; threshold?: number } = {}
) {
	const { delay = 0, rootMargin = '0px 0px -10% 0px', threshold = 0.15 } = options;

	if (typeof window === 'undefined') return {};

	const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	if (delay > 0) {
		node.style.setProperty('--reveal-delay', `${delay}ms`);
	}

	if (prefersReduced || !('IntersectionObserver' in window)) {
		node.dataset.revealed = 'true';
		return {};
	}

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					node.dataset.revealed = 'true';
					observer.disconnect();
					break;
				}
			}
		},
		{ rootMargin, threshold }
	);
	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
		}
	};
}
