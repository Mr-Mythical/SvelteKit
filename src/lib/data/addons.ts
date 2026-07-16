/** Shared Mr. Mythical addon catalog and community links. */

export const DISCORD_URL = 'https://discord.gg/hvREYuvJ6w';

export type AddonLinks = {
	curseforge: string;
	wago: string;
};

export type AddonProduct = {
	id: string;
	/** Short label for lists (e.g. "Mythic+ Dashboard") */
	name: string;
	/** Full marketplace title */
	title: string;
	tagline: string;
	links: AddonLinks;
};

/** Core player-facing Mr. Mythical suite (excludes micro-utils / author tools). */
export const ADDONS: AddonProduct[] = [
	{
		id: 'dashboard',
		name: 'Mythic+ Dashboard & Tooltips',
		title: 'Mr. Mythical: Mythic+ Dashboard & Tooltips',
		tagline:
			'Your all-in-one Mythic+ toolkit with enhanced customizable tooltips, run tracking, score calculations, and reward information',
		links: {
			curseforge: 'https://www.curseforge.com/wow/addons/mr-mythical',
			wago: 'https://addons.wago.io/addons/mr-mythical'
		}
	},
	{
		id: 'dps-predictor',
		name: 'DPS Predictor & Gearing Dashboard',
		title: 'Mr. Mythical: DPS Predictor & Gearing Dashboard',
		tagline:
			'Gearing dashboard for your best loadout from your bags or the season, optimal crest upgrades, and Great Vault advice - powered by a neural-net DPS prediction model.',
		links: {
			curseforge: 'https://www.curseforge.com/wow/addons/mr-mythical-dps-predictor',
			wago: 'https://addons.wago.io/addons/mrmythicaldpspredictor'
		}
	},
	{
		id: 'leaderboard',
		name: 'Leaderboard',
		title: 'Mr. Mythical: Leaderboard',
		tagline: 'Shows the top Mythic+ runs from Raider.IO with keystone tooltips',
		links: {
			curseforge: 'https://www.curseforge.com/wow/addons/mr-mythical-leaderboard',
			wago: 'https://addons.wago.io/addons/mrmythicalleaderboard'
		}
	},
	{
		id: 'gear-check',
		name: 'Gear Check',
		title: 'Mr. Mythical: Gear Check',
		tagline:
			"Quickly inspect your group's gear to identify common preparation issues like missing enchants, empty gem sockets, and low durability items.",
		links: {
			curseforge: 'https://www.curseforge.com/wow/addons/mr-mythical-gear-check',
			wago: 'https://addons.wago.io/addons/mrmythicalgearcheck'
		}
	},
	{
		id: 'assistant',
		name: 'Assistant',
		title: 'Mr. Mythical: Assistant',
		tagline:
			'A sophisticated unicorn companion who provides witty (if not particularly helpful) commentary on your adventures.',
		links: {
			curseforge: 'https://www.curseforge.com/wow/addons/mr-mythical-assistant',
			wago: 'https://addons.wago.io/addons/mrmythicalassistant'
		}
	}
];

export const FLAGSHIP_ADDON = ADDONS[0];
