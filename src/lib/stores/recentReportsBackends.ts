/**
 * Recent reports: persistence backends.
 *
 * Same split as `recentCharactersBackends.ts`: each backend owns one
 * persistence medium and reports a discriminated `AddOutcome` so the
 * composition layer can react. A 401 from the API means "anonymous user,
 * don't mirror to localStorage"; a network/5xx means "API down, fall back".
 */

import { logClientError } from '$lib/utils/clientLog';

export interface RecentReport {
	code: string;
	timestamp: number;
	title: string;
	guild?: { name: string };
	owner: { name: string };
}

export type AddRecentReportOutcome =
	| { status: 'ok'; reports?: RecentReport[] }
	| { status: 'unauthorized' }
	| { status: 'unavailable' };

export interface RecentReportsBackend {
	readonly name: 'api' | 'local-storage';
	load(): Promise<RecentReport[] | null>;
	add(report: RecentReport): Promise<AddRecentReportOutcome>;
}

const STORAGE_KEY = 'recentReports';
const MAX_REPORTS = 6;

export const apiRecentReportsBackend: RecentReportsBackend = {
	name: 'api',
	async load() {
		try {
			const response = await fetch('/api/recent-reports');
			if (!response.ok) return null;
			return (await response.json()) as RecentReport[];
		} catch (error) {
			logClientError('recentReports/api', 'load failed', error);
			return null;
		}
	},
	async add(report) {
		try {
			const response = await fetch('/api/recent-reports', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(report)
			});
			if (response.ok) return { status: 'ok' };
			if (response.status === 401) return { status: 'unauthorized' };
			logClientError(
				'recentReports/api',
				`add rejected status=${response.status}`,
				new Error(`status ${response.status}`)
			);
			return { status: 'unavailable' };
		} catch (error) {
			logClientError('recentReports/api', 'add failed', error);
			return { status: 'unavailable' };
		}
	}
};

function readLocalStorage(): RecentReport[] {
	const stored = localStorage.getItem(STORAGE_KEY);
	if (!stored) return [];
	try {
		const parsed = JSON.parse(stored);
		return Array.isArray(parsed) ? (parsed as RecentReport[]) : [];
	} catch (error) {
		logClientError('recentReports/localStorage', 'parse failed', error);
		return [];
	}
}

export const localStorageRecentReportsBackend: RecentReportsBackend = {
	name: 'local-storage',
	async load() {
		if (typeof localStorage === 'undefined') return null;
		return readLocalStorage();
	},
	async add(report) {
		if (typeof localStorage === 'undefined') return { status: 'unavailable' };
		try {
			const existing = readLocalStorage().filter((r) => r.code !== report.code);
			const next = [report, ...existing].slice(0, MAX_REPORTS);
			localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
			return { status: 'ok', reports: next };
		} catch (error) {
			logClientError('recentReports/localStorage', 'save failed', error);
			return { status: 'unavailable' };
		}
	}
};
