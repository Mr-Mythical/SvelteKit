/** Shared titles and descriptions for pages, sitemap, and RSS. Keep titles ≤60 and descriptions ≤160. */

export const PAGE_SEO = {
	home: {
		title: 'Mr. Mythical | Mythic+ & Raid Tools',
		description:
			'Mythic+ score calculator, Battle.net farm priority, raid logs, boss profiles, and free WoW addons.'
	},
	calculator: {
		title: 'Mythic+ Score Calculator | Mr. Mythical',
		description:
			'Set a target Mythic+ rating and see the keystones that get you there. Import a character and share the plan.'
	},
	gearing: {
		title: 'Farm Priority | Mr. Mythical',
		description:
			'Load Battle.net gear and rank Midnight Season 2 dungeon and raid loot immediately. Typical farm scans finish at once. Not a full sim.'
	},
	addons: {
		title: 'WoW Addons for Mythic+ & Gearing | Mr. Mythical',
		description:
			'Free WoW addons for Mythic+ tooltips, in-game /mrdps gearing, Raider.IO leaderboards, and gear checks on CurseForge and Wago.'
	},
	raid: {
		title: 'Raid Log Visualizer | Mr. Mythical',
		description:
			'Paste a Warcraft Logs report for per-second damage and healing. Browse public Mythic logs and boss damage profiles.'
	},
	raidBoss: {
		title: 'Boss Damage Profiles | Mr. Mythical',
		description:
			'Per-second damage and death timing for every Midnight mythic raid boss, from public progression logs.'
	},
	raidLog: {
		title: 'Raid Log | Mr. Mythical',
		description: 'Per-second damage and healing from a Warcraft Logs report, with ability overlays.'
	},
	about: {
		title: 'About Mr. Mythical | Mythic+ & Raid Tools',
		description:
			'Who builds Mr. Mythical: Mythic+ calculator, Battle.net farm priority, raid logs, boss profiles, and WoW addons.'
	},
	privacy: {
		title: 'Privacy Policy | Mr. Mythical',
		description: 'How Mr. Mythical handles data and uses cookies for advertising.'
	},
	cookie: {
		title: 'Cookie Policy | Mr. Mythical',
		description: 'How mrmythical.com uses cookies for Google AdSense advertising.'
	},
	profile: {
		title: 'Profile | Mr. Mythical',
		description: 'Battle.net account details for signed-in Mr. Mythical users.'
	},
	notFound: {
		title: 'Page not found | Mr. Mythical',
		description: 'That page is missing. Open a Mr. Mythical tool from the home page.'
	},
	error: {
		title: 'Something went wrong | Mr. Mythical',
		description: 'That page failed to load. Try again or open a tool from the home page.'
	}
} as const;

export const SCORE_LANDINGS = [1500, 2000, 2500, 3000, 3400] as const;

export function scoreLandingSeo(score: number): { title: string; description: string } {
	return {
		title: `${score} Mythic+ Rating | Mr. Mythical`,
		description: `See the keystones for a ${score} Mythic+ rating. Import a character and share the plan.`
	};
}

export function bossSeoTitle(name: string): string {
	return `Mythic ${name} | Mr. Mythical`;
}

export function bossSeoDescription(name: string): string {
	return `Mythic ${name} damage curve and death timing from public progression logs.`;
}
