/** Shared Mr. Mythical addon catalog and community links. */

export const DISCORD_URL = 'https://discord.gg/hvREYuvJ6w';

export type AddonLinks = {
	curseforge: string;
	wago: string;
	github?: string;
};

export type AddonProduct = {
	id: string;
	/** Short label for lists (e.g. "Mythic+ Dashboard") */
	name: string;
	/** Full marketplace title */
	title: string;
	tagline: string;
	/** Punchy editorial headline for tool rows (homepage style) */
	headline: string;
	/** Short editorial supporting line under the headline */
	blurb: string;
	/** Longer overview for the dedicated addon page */
	description: string;
	/** What the addon does, shown as a feature list */
	features: string[];
	/** Slash commands or how to open it */
	commands?: string[];
	/** Honest limitations when relevant */
	limitations?: string[];
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
		tagline: 'WoW Mythic+ keystone tooltips with rewards, score gains, and a planning dashboard.',
		headline: 'More info on every Mythic+ keystone.',
		blurb:
			'Hover a key and see rewards, crests, score gains, and timers. Use the dashboard when you want to plan the next dungeon.',
		description:
			'Mr. Mythical is a World of Warcraft Mythic+ addon for keystone tooltips and run planning. Tooltips show reward item levels, crest amounts, score gains, your personal best, and timer lines. Show or hide what you need, or hold a modifier for extra detail. The dashboard includes a rewards browser, score calculator, dungeon timers, season stats, and a log of recent runs.',
		features: [
			'Mythic+ keystone tooltips with rewards, crests, and score gains',
			'Personal best and party score gains (always on, or hold a modifier)',
			'Dungeon timer lines for chest thresholds',
			'Dashboard with rewards, score calc, timers, and season stats',
			'Tracks your Mythic+ runs as you play',
			'Same tooltip details on keystone chat links'
		],
		commands: [
			'/mrm opens the main dashboard',
			'/mrm rewards opens the reward calculator',
			'/mrm score opens the score calculator',
			'/mrm stats opens season stats',
			'/mrm times opens dungeon timer thresholds',
			'/mrm settings opens options'
		],
		links: {
			curseforge: 'https://www.curseforge.com/wow/addons/mr-mythical',
			wago: 'https://addons.wago.io/addons/mr-mythical',
			github: 'https://github.com/Mr-Mythical/MrMythicalAddon'
		},
		seoTitle: 'Mythic+ Dashboard & Tooltips WoW Addon | Mr. Mythical',
		seoDescription:
			'Download Mr. Mythical for WoW Mythic+. Keystone tooltips with rewards, crests, and score gains, plus a dashboard to plan your next key.',
		seoKeywords:
			'Mythic+ addon, WoW addon, keystone tooltips, Mythic+ score, crest rewards, Mr Mythical, CurseForge',
		ctaLabel: 'View Mythic+ Dashboard'
	},
	{
		id: 'dps-predictor',
		name: 'DPS Predictor & Gearing Dashboard',
		title: 'Mr. Mythical: DPS Predictor & Gearing Dashboard',
		tagline:
			'WoW gearing dashboard for bags, season loot, crests, and Great Vault, powered by SimulationCraft-trained DPS.',
		headline: 'Build your best loadout in game.',
		blurb:
			'Use the dashboard to find your best loadout from bags or the entire season, optimize crest upgrades, pick Great Vault rewards, and see DPS on tooltips. Powered by a neural net trained on SimC data.',
		description:
			'Mr. Mythical DPS Predictor is a World of Warcraft gearing addon. The main UI is the /mrdps dashboard: find your best loadout from bags, scan current raid and Mythic+ journal loot, rank crest upgrades by DPS per crest, and compare Great Vault options before you lock in. A neural net runs on your PC, trained on SimulationCraft data, with no server calls. Item tooltips also show DPS vs what you wear. Validation vs fresh SimC sims is published on this page.',
		features: [
			'Gearing dashboard via /mrdps',
			'Find Loadout searches full gear sets from your bags',
			'Scan current raid and Mythic+ journal loot',
			'Crest upgrades ranked by DPS per crest',
			'Great Vault picks ranked by DPS',
			'Preview drops at Champion, Hero, and Myth tracks',
			'DPS vs equipped on item tooltips',
			'Neural net trained on SimulationCraft, per spec and hero talent'
		],
		commands: ['/mrdps opens the gearing dashboard'],
		limitations: [
			'This is a fast estimate, not a full SimulationCraft run',
			'It does not fully model rotations, trinket procs, or set bonuses',
			'Trinkets are skipped. The model assumes best-in-slot trinkets'
		],
		links: {
			curseforge: 'https://www.curseforge.com/wow/addons/mr-mythical-dps-predictor',
			wago: 'https://addons.wago.io/addons/mrmythicaldpspredictor',
			github: 'https://github.com/Mr-Mythical/MrMythicalDpsPredictor'
		},
		hasValidation: true,
		seoTitle: 'DPS Gearing Dashboard WoW Addon | Mr. Mythical',
		seoDescription:
			'Download Mr. Mythical gearing dashboard for WoW. Bag loadouts, season scans, crest plans, and Great Vault picks with SimulationCraft-trained DPS.',
		seoKeywords:
			'WoW gearing addon, DPS dashboard, SimulationCraft, SimC, Great Vault, crest upgrades, bag loadout, Mr Mythical',
		ctaLabel: 'View Gearing Dashboard'
	},
	{
		id: 'leaderboard',
		name: 'Leaderboard',
		title: 'Mr. Mythical: Leaderboard',
		tagline: 'Top Raider.IO Mythic+ runs on your WoW keystone tooltips.',
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
		seoKeywords:
			'Mythic+ leaderboard, Raider.IO addon, keystone tooltip, WoW addon, Mr Mythical',
		ctaLabel: 'View Leaderboard'
	},
	{
		id: 'gear-check',
		name: 'Gear Check',
		title: 'Mr. Mythical: Gear Check',
		tagline: 'WoW group gear check for enchants, gems, and durability before the pull.',
		headline: 'Check group gear before you pull.',
		blurb: 'Scan for missing enchants, empty sockets, and gear about to break before a key or raid boss.',
		description:
			'Mr. Mythical Gear Check is a World of Warcraft prep addon. Open it before a Mythic+ key or raid boss to catch missing or weak enchants, empty gem sockets, and low durability.',
		features: [
			'Finds missing and low-rank enchants',
			'Flags empty sockets and bad gems',
			'Warns on low durability'
		],
		commands: ['/mrgc or /gearcheck opens the gear check window'],
		links: {
			curseforge: 'https://www.curseforge.com/wow/addons/mr-mythical-gear-check',
			wago: 'https://addons.wago.io/addons/mrmythicalgearcheck',
			github: 'https://github.com/Mr-Mythical/MrMythicalGearCheck'
		},
		seoTitle: 'Gear Check WoW Addon | Mr. Mythical',
		seoDescription:
			'Download Mr. Mythical Gear Check. Inspect your WoW group for missing enchants, empty sockets, and low durability.',
		seoKeywords:
			'WoW gear check, enchants addon, gem check, durability, Mythic+ prep, Mr Mythical',
		ctaLabel: 'View Gear Check'
	},
	{
		id: 'assistant',
		name: 'Assistant',
		title: 'Mr. Mythical: Assistant',
		tagline: 'A WoW unicorn companion that comments on your runs and can insert your keystone.',
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
		commands: [
			'/mma test shows a test message',
			'/mma move unlocks or locks the frame',
			'/mma reset moves it back to center'
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
