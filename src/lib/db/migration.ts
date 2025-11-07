/**
 * Migration utility to import old browser-stored recents into the new database system
 * This handles the transition from localStorage-based recents to database-based recents
 */

import { addUserRecent, createCharacterRecent, createReportRecent } from './recents.js';
import { hasCompletedOldDataImport, markOldDataImportCompleted } from './users.js';

// Types from the old system
export interface OldRecentCharacter {
	region: string;
	realm: string;
	characterName: string;
}

export interface OldRecentReport {
	code: string;
	timestamp: number;
	title: string;
	guild?: { name: string };
	owner: { name: string };
}

/**
 * Import old localStorage recents data into the new database system
 * This should be called when a user first logs in after the database migration
 */
export async function importOldRecentsData(userId: string): Promise<{
	charactersImported: number;
	reportsImported: number;
	errors: string[];
}> {
	const results = {
		charactersImported: 0,
		reportsImported: 0,
		errors: [] as string[]
	};

	// Only run on the client side
	if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
		return results;
	}

	try {
		// Import recent characters
		const charactersResult = await importRecentCharacters(userId);
		results.charactersImported = charactersResult.imported;
		results.errors.push(...charactersResult.errors);

		// Import recent reports
		const reportsResult = await importRecentReports(userId);
		results.reportsImported = reportsResult.imported;
		results.errors.push(...reportsResult.errors);

		// Clear old data after successful import (optional)
		if (results.errors.length === 0) {
			clearOldRecentsData();
		}

		console.log('Old recents import completed:', results);
	} catch (error) {
		console.error('Error during recents import:', error);
		results.errors.push(
			`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`
		);
	}

	return results;
}

/**
 * Import recent characters from localStorage
 */
async function importRecentCharacters(userId: string): Promise<{
	imported: number;
	errors: string[];
}> {
	const result = { imported: 0, errors: [] as string[] };

	try {
		const stored = localStorage.getItem('recentCharacters');
		if (!stored) return result;

		const oldCharacters: OldRecentCharacter[] = JSON.parse(stored);
		if (!Array.isArray(oldCharacters)) return result;

		for (const char of oldCharacters) {
			try {
				const characterRecent = createCharacterRecent(char.characterName, char.realm, char.region, {
					importedFromLocalStorage: true,
					originalTimestamp: Date.now() // We don't have original timestamps for characters
				});

				await addUserRecent(userId, characterRecent);
				result.imported++;
			} catch (error) {
				const errorMsg = `Failed to import character ${char.characterName}-${char.realm}: ${error}`;
				console.error(errorMsg);
				result.errors.push(errorMsg);
			}
		}
	} catch (error) {
		const errorMsg = `Failed to parse recent characters: ${error}`;
		console.error(errorMsg);
		result.errors.push(errorMsg);
	}

	return result;
}

/**
 * Import recent reports from localStorage
 */
async function importRecentReports(userId: string): Promise<{
	imported: number;
	errors: string[];
}> {
	const result = { imported: 0, errors: [] as string[] };

	try {
		const stored = localStorage.getItem('recentReports');
		if (!stored) return result;

		const oldReports: OldRecentReport[] = JSON.parse(stored);
		if (!Array.isArray(oldReports)) return result;

		for (const report of oldReports) {
			try {
				const reportRecent = createReportRecent(report.code, report.title, report.guild?.name, {
					importedFromLocalStorage: true,
					originalTimestamp: report.timestamp,
					owner: report.owner,
					url: `https://www.warcraftlogs.com/reports/${report.code}`
				});

				await addUserRecent(userId, reportRecent);
				result.imported++;
			} catch (error) {
				const errorMsg = `Failed to import report ${report.code}: ${error}`;
				console.error(errorMsg);
				result.errors.push(errorMsg);
			}
		}
	} catch (error) {
		const errorMsg = `Failed to parse recent reports: ${error}`;
		console.error(errorMsg);
		result.errors.push(errorMsg);
	}

	return result;
}

/**
 * Clear old localStorage data after successful import
 * This is optional - you might want to keep the old data as backup
 */
export function clearOldRecentsData(): void {
	if (typeof localStorage === 'undefined') return;

	try {
		localStorage.removeItem('recentCharacters');
		localStorage.removeItem('recentReports');
		console.log('Old recents data cleared from localStorage');
	} catch (error) {
		console.error('Error clearing old recents data:', error);
	}
}

/**
 * Check if the user has old recents data that can be imported
 */
export function hasOldRecentsData(): boolean {
	if (typeof localStorage === 'undefined') return false;

	const hasCharacters = localStorage.getItem('recentCharacters') !== null;
	const hasReports = localStorage.getItem('recentReports') !== null;

	return hasCharacters || hasReports;
}

/**
 * Get a preview of what old data exists (for UI display)
 */
export function getOldRecentsPreview(): {
	characters: number;
	reports: number;
	characterNames: string[];
	reportTitles: string[];
} {
	const preview = {
		characters: 0,
		reports: 0,
		characterNames: [] as string[],
		reportTitles: [] as string[]
	};

	if (typeof localStorage === 'undefined') return preview;

	try {
		// Check characters
		const storedChars = localStorage.getItem('recentCharacters');
		if (storedChars) {
			const chars: OldRecentCharacter[] = JSON.parse(storedChars);
			preview.characters = chars.length;
			preview.characterNames = chars.map((c) => `${c.characterName} (${c.realm})`);
		}

		// Check reports
		const storedReports = localStorage.getItem('recentReports');
		if (storedReports) {
			const reports: OldRecentReport[] = JSON.parse(storedReports);
			preview.reports = reports.length;
			preview.reportTitles = reports.map((r) => r.title);
		}
	} catch (error) {
		console.error('Error getting old recents preview:', error);
	}

	return preview;
}

/**
 * Hook for SvelteKit to automatically import old data when user logs in
 * Add this to your auth callback or user session handler
 */
export async function autoImportOnLogin(userId: string): Promise<void> {
	// Check if user already completed import
	const alreadyImported = await hasCompletedOldDataImport(userId);
	if (alreadyImported) return;

	// Check if user has old data to import
	const hasOldData = hasOldRecentsData();
	if (!hasOldData) {
		// Mark as completed even if no data to import
		await markOldDataImportCompleted(userId);
		return;
	}

	console.log('Auto-importing old recents data for user:', userId);
	const results = await importOldRecentsData(userId);

	// Mark import as completed regardless of errors
	await markOldDataImportCompleted(userId);

	if (results.errors.length === 0) {
		console.log(
			`Successfully imported ${results.charactersImported} characters and ${results.reportsImported} reports`
		);
	} else {
		console.warn('Import completed with errors:', results.errors);
	}
}
