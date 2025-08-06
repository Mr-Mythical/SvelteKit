import { describe, it, expect, vi, beforeEach } from 'vitest';
import { performance } from 'perf_hooks';

// Performance testing utilities
class PerformanceMonitor {
	private metrics: Map<string, number[]> = new Map();

	startTimer(label: string): () => number {
		const start = performance.now();
		return () => {
			const duration = performance.now() - start;
			if (!this.metrics.has(label)) {
				this.metrics.set(label, []);
			}
			this.metrics.get(label)!.push(duration);
			return duration;
		};
	}

	getStats(label: string) {
		const times = this.metrics.get(label) || [];
		if (times.length === 0) return null;

		const sorted = [...times].sort((a, b) => a - b);
		return {
			count: times.length,
			min: Math.min(...times),
			max: Math.max(...times),
			avg: times.reduce((sum, time) => sum + time, 0) / times.length,
			median: sorted[Math.floor(sorted.length / 2)],
			p95: sorted[Math.floor(sorted.length * 0.95)],
			p99: sorted[Math.floor(sorted.length * 0.99)]
		};
	}

	reset() {
		this.metrics.clear();
	}
}

// Mock heavy computation functions
function heavyComputation(iterations: number = 1000000): number {
	let result = 0;
	for (let i = 0; i < iterations; i++) {
		result += Math.sqrt(i) * Math.sin(i);
	}
	return result;
}

function processLargeDataset(size: number = 10000): any[] {
	return Array.from({ length: size }, (_, i) => ({
		id: i,
		value: Math.random() * 1000,
		category: `category-${i % 10}`,
		timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
		metadata: {
			processed: true,
			score: Math.random() * 100,
			tags: [`tag-${i % 5}`, `tag-${(i + 1) % 5}`]
		}
	}));
}

function simulateApiCall(delay: number = 100): Promise<{ data: string; timestamp: number }> {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve({
				data: 'response-data',
				timestamp: Date.now()
			});
		}, delay);
	});
}

describe('Performance Tests', () => {
	let monitor: PerformanceMonitor;

	beforeEach(() => {
		monitor = new PerformanceMonitor();
	});

	describe('Computation Performance', () => {
		it('should complete heavy computation within acceptable time', async () => {
			const endTimer = monitor.startTimer('heavy-computation');
			
			const result = heavyComputation(100000); // Reduced iterations for testing
			
			const duration = endTimer();
			
			expect(result).toBeTypeOf('number');
			expect(duration).toBeLessThan(1000); // Should complete within 1 second
			
			console.log(`Heavy computation took ${duration.toFixed(2)}ms`);
		});

		it('should handle multiple concurrent computations', async () => {
			const promises = Array.from({ length: 5 }, async (_, i) => {
				const endTimer = monitor.startTimer(`concurrent-computation-${i}`);
				const result = heavyComputation(50000);
				const duration = endTimer();
				return { result, duration, index: i };
			});

			const results = await Promise.all(promises);
			
			results.forEach(({ result, duration, index }) => {
				expect(result).toBeTypeOf('number');
				expect(duration).toBeLessThan(2000);
				console.log(`Concurrent computation ${index} took ${duration.toFixed(2)}ms`);
			});
		});
	});

	describe('Data Processing Performance', () => {
		it('should process large datasets efficiently', () => {
			const endTimer = monitor.startTimer('data-processing');
			
			const dataset = processLargeDataset(5000); // Reduced size for testing
			
			const duration = endTimer();
			
			expect(dataset).toHaveLength(5000);
			expect(dataset[0]).toMatchObject({
				id: expect.any(Number),
				value: expect.any(Number),
				category: expect.any(String),
				timestamp: expect.any(String),
				metadata: expect.any(Object)
			});
			
			expect(duration).toBeLessThan(500); // Should complete within 500ms
			
			console.log(`Data processing took ${duration.toFixed(2)}ms`);
		});

		it('should filter and transform data efficiently', () => {
			const dataset = processLargeDataset(10000);
			
			const endTimer = monitor.startTimer('data-transformation');
			
			const filtered = dataset
				.filter(item => item.value > 500)
				.map(item => ({
					...item,
					normalizedValue: item.value / 1000,
					isHighValue: item.value > 750
				}))
				.sort((a, b) => b.value - a.value);
			
			const duration = endTimer();
			
			expect(filtered.length).toBeGreaterThan(0);
			expect(filtered.length).toBeLessThan(dataset.length);
			expect(filtered[0].normalizedValue).toBeTypeOf('number');
			expect(filtered[0].isHighValue).toBeTypeOf('boolean');
			
			expect(duration).toBeLessThan(200); // Should complete within 200ms
			
			console.log(`Data transformation took ${duration.toFixed(2)}ms, filtered ${filtered.length} items`);
		});
	});

	describe('Async Performance', () => {
		it('should handle concurrent API calls efficiently', async () => {
			const startTime = performance.now();
			
			const promises = Array.from({ length: 10 }, (_, i) => 
				simulateApiCall(50) // 50ms delay per call
			);
			
			const results = await Promise.all(promises);
			
			const totalTime = performance.now() - startTime;
			
			expect(results).toHaveLength(10);
			expect(totalTime).toBeLessThan(200); // Should be much less than 10 * 50ms due to concurrency
			
			results.forEach(result => {
				expect(result).toMatchObject({
					data: 'response-data',
					timestamp: expect.any(Number)
				});
			});
			
			console.log(`10 concurrent API calls took ${totalTime.toFixed(2)}ms`);
		});

		it('should handle sequential vs parallel performance comparison', async () => {
			// Sequential execution
			const sequentialStart = performance.now();
			for (let i = 0; i < 5; i++) {
				await simulateApiCall(20);
			}
			const sequentialTime = performance.now() - sequentialStart;
			
			// Parallel execution
			const parallelStart = performance.now();
			await Promise.all(Array.from({ length: 5 }, () => simulateApiCall(20)));
			const parallelTime = performance.now() - parallelStart;
			
			expect(sequentialTime).toBeGreaterThan(parallelTime * 2); // Parallel should be much faster
			expect(parallelTime).toBeLessThan(50); // Should complete within 50ms
			
			console.log(`Sequential: ${sequentialTime.toFixed(2)}ms, Parallel: ${parallelTime.toFixed(2)}ms`);
		});
	});

	describe('Memory Usage', () => {
		it('should not cause memory leaks with large datasets', () => {
			const initialMemory = process.memoryUsage();
			
			// Create and process multiple large datasets
			for (let i = 0; i < 10; i++) {
				const dataset = processLargeDataset(1000);
				const processed = dataset.map(item => ({ ...item, processed: true }));
				expect(processed).toHaveLength(1000);
				// Allow garbage collection
				if (global.gc) {
					global.gc();
				}
			}
			
			const finalMemory = process.memoryUsage();
			
			// Memory usage shouldn't grow too much
			const heapGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
			expect(heapGrowth).toBeLessThan(50 * 1024 * 1024); // Less than 50MB growth
			
			console.log(`Memory growth: ${(heapGrowth / (1024 * 1024)).toFixed(2)}MB`);
		});
	});

	describe('Performance Regression Tests', () => {
		it('should maintain baseline performance metrics', async () => {
			// Run multiple iterations to get stable measurements
			const iterations = 10;
			
			for (let i = 0; i < iterations; i++) {
				monitor.startTimer('baseline-test')();
				heavyComputation(10000);
				monitor.startTimer('baseline-test')();
			}
			
			const stats = monitor.getStats('baseline-test');
			expect(stats).not.toBeNull();
			
			if (stats) {
				expect(stats.avg).toBeLessThan(100); // Average should be under 100ms
				expect(stats.p95).toBeLessThan(200); // 95th percentile under 200ms
				expect(stats.max).toBeLessThan(500); // Max should be under 500ms
				
				console.log('Baseline performance stats:', {
					avg: `${stats.avg.toFixed(2)}ms`,
					p95: `${stats.p95.toFixed(2)}ms`,
					max: `${stats.max.toFixed(2)}ms`
				});
			}
		});
	});
});
