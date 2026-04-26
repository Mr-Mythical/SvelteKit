import { describe, expect, it } from 'vitest';
import { extractWarcraftLogsReportCode } from '$lib/data/warcraftlogs';

describe('extractWarcraftLogsReportCode', () => {
	it('extracts raw report code', () => {
		expect(extractWarcraftLogsReportCode('k2yZ8HzKgBRxt9NX')).toBe('k2yZ8HzKgBRxt9NX');
	});

	it('extracts report code from URL with query string', () => {
		expect(
			extractWarcraftLogsReportCode(
				'https://www.warcraftlogs.com/reports/k2yZ8HzKgBRxt9NX?fight=last'
			)
		).toBe('k2yZ8HzKgBRxt9NX');
	});

	it('extracts report code from URL with hash parameters', () => {
		expect(
			extractWarcraftLogsReportCode(
				'https://www.warcraftlogs.com/reports/k2yZ8HzKgBRxt9NX#fight=last&type=damage-done'
			)
		).toBe('k2yZ8HzKgBRxt9NX');
	});

	it('extracts report code from host-only URL', () => {
		expect(
			extractWarcraftLogsReportCode('warcraftlogs.com/reports/k2yZ8HzKgBRxt9NX?fight=5')
		).toBe('k2yZ8HzKgBRxt9NX');
	});

	it('returns null for invalid input', () => {
		expect(extractWarcraftLogsReportCode('not a report url')).toBeNull();
	});
});
