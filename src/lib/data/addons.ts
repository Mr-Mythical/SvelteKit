/** Shared Mr. Mythical addon catalog and community links. */

export const DISCORD_URL = 'https://discord.gg/hvREYuvJ6w';

export type AddonLinks = {
	curseforge: string;
	wago: string;
	github?: string;
};

export type AddonScreenshot = {
	src: string;
	alt: string;
	caption: string;
	/** CSS object-position when the carousel crops to a fixed frame (default: top center) */
	objectPosition?: string;
};

export type AddonProduct = {
	id: string;
	/** Short label for lists (e.g. "Mythic+ Dashboard") */
	name: string;
	/** Full marketplace title */
	title: string;
	/** Addon ## Notes from the .toc (shown on homepage / about) */
	tagline: string;
	/** Punchy editorial headline for tool rows (homepage style) */
	headline: string;
	/** Short editorial supporting line under the headline */
	blurb: string;
	/** Longer overview for the dedicated addon page */
	description: string;
	/** What the addon does, shown as a feature list */
	features: string[];
	/** Honest limitations when relevant */
	limitations?: string[];
	/** Optional product screenshots (static paths) */
	screenshots?: AddonScreenshot[];
	links: AddonLinks;
	/** Whether this page loads SimC-factory validation metrics */
	hasValidation?: boolean;
	/** Page <title> */
	seoTitle: string;
	/** Meta description (~150 chars, keyword + CTA) */
	seoDescription: string;
	seoKeywords: string;
	/** Primary CTA label on index / detail links */
	ctaLabel: string;
};

/** Core player-facing Mr. Mythical suite (excludes micro-utils / author tools). */
export const ADDONS: AddonProduct[] = [
	{
		id: 'dashboard',
		name: 'Mythic+ Dashboard & Tooltips',
		title: 'Mr. Mythical: Mythic+ Dashboard & Tooltips',
		tagline:
			'Your all-in-one Mythic+ toolkit with enhanced customizable tooltips, run tracking, score calculations, and reward information',
		headline: 'Keystone tooltips, your way.',
		blurb:
			'Toggle every line: rewards, crests, score gains, timers, personal bests. Keep tooltips lean day to day, or hold a modifier for the full picture. Dashboard for planning when you want more.',
		description:
			'Mr. Mythical is a World of Warcraft Mythic+ addon built around customizable keystone tooltips and a planning dashboard. Pick which details appear (reward item levels, crest amounts, score gains, personal best, timer lines) and whether they show always or only while you hold a modifier. Same controls apply to keystone chat links. When you want to dig in, the dashboard covers rewards, score calc, dungeon timers, season stats, and a log of recent runs.',
		features: [
			'Fully customizable Mythic+ keystone tooltips',
			'Show or hide rewards, crests, score gains, timers, and personal best',
			'Always-on lines, or reveal extra detail with a modifier key',
			'Same tooltip options on keystone chat links',
			'Dashboard with rewards, score calc, timers, and season stats',
			'Tracks your Mythic+ runs as you play'
		],
		links: {
			curseforge: 'https://www.curseforge.com/wow/addons/mr-mythical',
			wago: 'https://addons.wago.io/addons/mr-mythical',
			github: 'https://github.com/Mr-Mythical/MrMythicalAddon'
		},
		seoTitle: 'Mythic+ Dashboard & Tooltips WoW Addon | Mr. Mythical',
		seoDescription:
			'Download Mr. Mythical for WoW Mythic+. Customizable keystone tooltips for rewards, crests, score, and timers, plus a planning dashboard.',
		seoKeywords:
			'Mythic+ addon, WoW addon, customizable keystone tooltips, Mythic+ score, crest rewards, Mr Mythical, CurseForge',
		ctaLabel: 'View Mythic+ Dashboard'
	},
	{
		id: 'dps-predictor',
		name: 'DPS Predictor & Gearing Dashboard',
		title: 'Mr. Mythical: DPS Predictor & Gearing Dashboard',
		tagline:
			'Gearing dashboard for bag loadouts, season loot, crest upgrades, and Great Vault advice. Typical scans finish immediately.',
		headline: 'Build your best loadout in game, instantly.',
		blurb:
			'Open /mrdps to rank bag loadouts, season loot, crests, and Great Vault picks. Typical scans finish immediately, with no SimulationCraft wait.',
		description:
			'Mr. Mythical DPS Predictor is a World of Warcraft gearing addon. The main UI is the /mrdps dashboard: find your best loadout from bags, scan current raid and Mythic+ journal loot, rank crest upgrades by DPS per crest, and compare Great Vault options before you lock in. Typical scans finish immediately. Item tooltips also show DPS vs what you wear. Validation vs fresh SimC sims is published on this page.',
		features: [
			'Gearing dashboard via /mrdps',
			'Typical farm scans and tooltip DPS finish immediately',
			'Find Loadout searches full gear sets from your bags',
			'Scan current raid and Mythic+ journal loot',
			'Crest upgrades ranked by DPS per crest',
			'Great Vault picks ranked by DPS',
			'Preview drops at Champion, Hero, and Myth tracks',
			'DPS estimates checked against SimulationCraft, per spec and hero talent'
		],
		limitations: [
			'This is a fast estimate, not a full SimulationCraft run',
			'It does not fully model rotations, trinket procs, or set bonuses',
			'Trinkets are skipped. The model assumes best-in-slot trinkets'
		],
		screenshots: [
			{
				src: '/addons/dps-predictor/gear-advisor-bags.png',
				alt: 'Mr. Mythical DPS Predictor Bags tab showing best loadout from inventory with Equip buttons',
				caption: 'Bags tab: best loadout from what you own, with one-click Equip'
			},
			{
				src: '/addons/dps-predictor/gear-advisor-dungeons-raids.png',
				alt: 'Mr. Mythical DPS Predictor Dungeons and Raids tab with season BiS recommendations and sources',
				caption: 'Dungeons & Raids: best drops across the season, with boss and instance sources'
			},
			{
				src: '/addons/dps-predictor/crest-upgrades.png',
				alt: 'Mr. Mythical DPS Predictor Crest Upgrades tab ranking upgrades by DPS per crest',
				caption: 'Crest Upgrades: step-by-step plan ranked by DPS per crest spent'
			},
			{
				src: '/addons/dps-predictor/great-vault.png',
				alt: 'Great Vault window with Mr. Mythical recommending the highest DPS reward',
				caption: 'Great Vault: which reward is the biggest DPS gain before you lock in'
			},
			{
				src: '/addons/dps-predictor/tooltip-comparison.png',
				alt: 'Item tooltip showing Mr. Mythical DPS Predictor plus 1335 DPS versus equipped gear',
				caption: 'Tooltips: predicted DPS change vs what you are wearing',
				// Tall tooltip: keep +DPS line in frame when cropped
				objectPosition: 'bottom center'
			}
		],
		links: {
			curseforge: 'https://www.curseforge.com/wow/addons/mr-mythical-dps-predictor',
			wago: 'https://addons.wago.io/addons/mrmythicaldpspredictor',
			github: 'https://github.com/Mr-Mythical/MrMythicalDpsPredictor'
		},
		hasValidation: true,
		seoTitle: 'DPS Gearing Dashboard WoW Addon | Mr. Mythical',
		seoDescription:
			'In-game /mrdps gearing for WoW. Typical scans finish immediately. Bags, season loot, crests, and Great Vault with SimC-trained DPS.',
		seoKeywords:
			'WoW gearing addon, DPS dashboard, SimulationCraft, SimC, Great Vault, crest upgrades, bag loadout, Mr Mythical',
		ctaLabel: 'View Gearing Dashboard'
	},
	{
		id: 'leaderboard',
		name: 'Leaderboard',
		title: 'Mr. Mythical: Leaderboard',
		tagline: 'Shows the top Mythic+ runs from Raider.IO with keystone tooltips',
		headline: 'See the top Mythic+ clear for that dungeon.',
		blurb:
			'Hover a keystone for the current Raider.IO top run. Level, time, score, and who was in it.',
		description:
			'Mr. Mythical Leaderboard is a WoW Mythic+ addon that adds Raider.IO leaderboard data to keystone tooltips. You see the top run for that dungeon, including key level, time, score, and the roster with class and spec.',
		features: [
			'Top run level, time, and score on keystone tooltips',
			'Roster with names, classes, and specs',
			'Toggles for score, roster, or turning it off'
		],
		links: {
			curseforge: 'https://www.curseforge.com/wow/addons/mr-mythical-leaderboard',
			wago: 'https://addons.wago.io/addons/mrmythicalleaderboard',
			github: 'https://github.com/Mr-Mythical/MrMythicalLeaderboard'
		},
		seoTitle: 'Mythic+ Leaderboard WoW Addon | Mr. Mythical',
		seoDescription:
			'Download Mr. Mythical Leaderboard. See top Raider.IO Mythic+ runs on keystone tooltips in World of Warcraft.',
		seoKeywords: 'Mythic+ leaderboard, Raider.IO addon, keystone tooltip, WoW addon, Mr Mythical',
		ctaLabel: 'View Leaderboard'
	},
	{
		id: 'gear-check',
		name: 'Gear Check',
		title: 'Mr. Mythical: Gear Check',
		tagline:
			"Quickly inspect your group's gear to identify common preparation issues like missing enchants, empty gem sockets, and low durability items.",
		headline: 'Check group gear before you pull.',
		blurb:
			'Scan for missing enchants, empty sockets, and gear about to break before a key or raid boss.',
		description:
			'Mr. Mythical Gear Check is a World of Warcraft prep addon. Open it before a Mythic+ key or raid boss to catch missing or weak enchants, empty gem sockets, and low durability.',
		features: [
			'Finds missing and low-rank enchants',
			'Flags empty sockets and bad gems',
			'Warns on low durability'
		],
		links: {
			curseforge: 'https://www.curseforge.com/wow/addons/mr-mythical-gear-check',
			wago: 'https://addons.wago.io/addons/mrmythicalgearcheck',
			github: 'https://github.com/Mr-Mythical/MrMythicalGearCheck'
		},
		seoTitle: 'Gear Check WoW Addon | Mr. Mythical',
		seoDescription:
			'Download Mr. Mythical Gear Check. Inspect your WoW group for missing enchants, empty sockets, and low durability.',
		seoKeywords: 'WoW gear check, enchants addon, gem check, durability, Mythic+ prep, Mr Mythical',
		ctaLabel: 'View Gear Check'
	},
	{
		id: 'assistant',
		name: 'Assistant',
		title: 'Mr. Mythical: Assistant',
		tagline:
			'A sophisticated unicorn companion who provides witty (if not particularly helpful) commentary on your adventures.',
		headline: 'A unicorn with opinions.',
		blurb:
			'Comments on deaths, keys, and repairs. Can auto-insert your Mythic+ keystone if you leave that on.',
		description:
			'Mr. Mythical Assistant is a light World of Warcraft companion addon. A unicorn with a moustache and monocle comments when you die, start a Mythic+ key, finish a run, or repair. Optional auto-insert puts the correct keystone in for you.',
		features: [
			'Comments on deaths, keys, finishes, and repairs',
			'Optional auto-insert for the correct Mythic+ keystone',
			'Movable frame, message length, and per-event toggles'
		],
		links: {
			curseforge: 'https://www.curseforge.com/wow/addons/mr-mythical-assistant',
			wago: 'https://addons.wago.io/addons/mrmythicalassistant',
			github: 'https://github.com/Mr-Mythical/MrMythicalAssistant'
		},
		seoTitle: 'Assistant WoW Addon | Mr. Mythical',
		seoDescription:
			'Download Mr. Mythical Assistant. A unicorn companion for WoW with run commentary and optional Mythic+ keystone insert.',
		seoKeywords: 'WoW assistant addon, Mythic+ companion, keystone insert, Mr Mythical',
		ctaLabel: 'View Assistant'
	}
];

export const FLAGSHIP_ADDON = ADDONS[0];

export function getAddonById(id: string): AddonProduct | undefined {
	return ADDONS.find((addon) => addon.id === id);
}
