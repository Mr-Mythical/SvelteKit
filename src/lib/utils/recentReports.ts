import { writable } from 'svelte/store';

export interface RecentReport {
    code: string;
    timestamp: number;
    title: string;
    guild?: { name: string };
    owner: { name: string };
}

const STORAGE_KEY = 'recentReports';
const MAX_REPORTS = 6;

function loadRecentReports(): RecentReport[] {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

function createRecentReportsStore() {
    const { subscribe, set, update } = writable<RecentReport[]>(loadRecentReports());

    return {
        subscribe,
        addReport: (code: string, title: string, guild: { name: string } | undefined, owner: { name: string }) => {
            update(reports => {
                const newReports = reports.filter(r => r.code !== code);
                newReports.unshift({ 
                    code, 
                    timestamp: Date.now(),
                    title,
                    guild,
                    owner
                });
                if (newReports.length > MAX_REPORTS) {
                    newReports.pop();
                }
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newReports));
                return newReports;
            });
        },
        clear: () => {
            set([]);
            localStorage.removeItem(STORAGE_KEY);
        }
    };
}

export const recentReports = createRecentReportsStore();