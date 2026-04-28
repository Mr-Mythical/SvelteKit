export interface Ability {
	name: string;
	id: number;
}

export interface BossResources {
	method?: string;
	wowhead?: string;
	icyVeins?: string;
}

export interface BossGuide {
	intro: string;
	kills: string;
}

export interface Boss {
	id: number;
	name: string;
	slug: string;
	teaser: string;
	guide: BossGuide;
	resources: BossResources;
	abilities: Ability[];
}

export const bosses: Boss[] = [
	{
		id: 3176,
		name: 'Imperator Averzian',
		slug: 'imperator-averzian',
		teaser: 'Three-by-three portal grid where row alignments turn into raid wipes.',
		guide: {
			intro:
				'Imperator Averzian is the first Voidspire encounter, a single-target fight built around a tic-tac-toe grid of void portals. The raid moves between soak groups and tank swap windows while preventing three portals from aligning.',
			kills:
				"Damage rises in waves around Umbral Collapse, which hits the raid for ~555k Shadow split between players standing inside the soak. Tank deaths cluster when Blackening Wounds stacks roll over without a swap. Pulses of Pitch Bulwark and Oblivion's Wrath stack on top of soak damage and create the visible mid-pull spikes on the chart."
		},
		resources: {
			wowhead:
				'https://www.wowhead.com/guide/midnight/raids/the-voidspire-imperator-averzian-boss-strategy-abilities',
			icyVeins: 'https://www.icy-veins.com/wow/imperator-averzian-raid-guide',
			method: 'https://www.method.gg/guides/the-voidspire/imperator-averzian-heroic'
		},
		abilities: [
			{ name: 'Umbral Collapse', id: 1249262 },
			{ name: 'Blackening Wounds', id: 1249260 },
			{ name: 'Pitch Bulwark', id: 1249254 },
			{ name: "Oblivion's Wrath", id: 1249257 }
		]
	},
	{
		id: 3177,
		name: 'Vorasius',
		slug: 'vorasius',
		teaser: 'Crystal walls split the arena while fixated adds carve safe lanes.',
		guide: {
			intro:
				'Vorasius is a single-target encounter where the raid kites adds into crystal walls to fracture the arena into safer segments. The fight progresses through positioning phases bookended by hard-hitting tank mechanics.',
			kills:
				'Damage spikes during Primordial Roar pulls and Shadowclaw Slam soaks, and Aftershock pulses that follow each Slam compound the spike. Tanks die when Smashed stacks reach the top end without a swap, and Void Breath catches groups that cluster while routing fixates.'
		},
		resources: {
			wowhead:
				'https://www.wowhead.com/guide/midnight/raids/the-voidspire-vorasius-boss-strategy-abilities',
			icyVeins: 'https://www.icy-veins.com/wow/vorasius-raid-guide',
			method: 'https://www.method.gg/guides/the-voidspire/vorasius-heroic'
		},
		abilities: [
			{ name: 'Primordial Roar', id: 1248661 },
			{ name: 'Shadowclaw Slam', id: 1248662 },
			{ name: 'Aftershock', id: 1248663 },
			{ name: 'Void Breath', id: 1256855 }
		]
	},
	{
		id: 3179,
		name: 'Fallen-King Salhadaar',
		slug: 'fallenking-salhadaar',
		teaser: 'Stop void orbs from reaching the king, survive the rotating beam phase.',
		guide: {
			intro:
				"Fallen-King Salhadaar is bound by Xal'atath while void orbs march toward him through the arena. The raid stops orbs from reaching the boss while alternating between rotating beam intermissions and direct damage on the king.",
			kills:
				'Damage escalates each time a Void Convergence orb reaches the boss and stacks his buff. Entropic Unraveling at 100 energy creates the largest visible raidwide pulse, hitting every second of the channel. Despotic Command circles overlap with healing absorbs, so tank damage from Destabilizing Strikes is what kills pulls during back-to-back Despotic windows.'
		},
		resources: {
			wowhead:
				'https://www.wowhead.com/guide/midnight/raids/the-voidspire-fallen-king-salhadaar-boss-strategy-abilities',
			icyVeins: 'https://www.icy-veins.com/wow/fallen-king-salhadaar-raid-guide',
			method: 'https://www.method.gg/guides/the-voidspire/fallen-king-salhadaar-heroic'
		},
		abilities: [
			{ name: 'Void Convergence', id: 1247738 },
			{ name: 'Entropic Unraveling', id: 1246175 },
			{ name: 'Destabilizing Strikes', id: 1247731 },
			{ name: 'Shattering Twilight', id: 1247728 }
		]
	},
	{
		id: 3178,
		name: 'Vaelgor & Ezzorak',
		slug: 'vaelgor-ezzorak',
		teaser: 'Two dragons share a damage budget, an empowerment buff if you fall behind.',
		guide: {
			intro:
				"Vaelgor and Ezzorak are corrupted dragon guardians fought together. The raid balances damage between the pair to keep Twilight Bond from empowering the lower-health dragon while juggling the dragons' separate breath and zone mechanics.",
			kills:
				'Damage spikes during Dread Breath targeting and the passage of Gloom orbs across the room. If Twilight Bond ticks up from uneven damage, the same mechanics hit harder on the next rotation, so the chart trends upward on long pulls. Death clusters come from stacking fear on top of Gloomfield, or from soak groups failing to shrink the field in time.'
		},
		resources: {
			wowhead:
				'https://www.wowhead.com/guide/midnight/raids/the-voidspire-vaelgor-and-ezzorak-boss-strategy-abilities',
			icyVeins: 'https://www.icy-veins.com/wow/vaelgor-and-ezzorak-raid-guide',
			method: 'https://www.method.gg/guides/the-voidspire/vaelgor-and-ezzorak-heroic'
		},
		abilities: [
			{ name: 'Dread Breath', id: 1244221 },
			{ name: 'Gloom', id: 1245391 },
			{ name: 'Void Howl', id: 1245393 },
			{ name: 'Twilight Bond', id: 1270189 }
		]
	},
	{
		id: 3180,
		name: 'Lightblinded Vanguard',
		slug: 'lightblinded-vanguard',
		teaser: 'Three paladins, three auras, separation is mandatory at every 100 energy.',
		guide: {
			intro:
				'A council of three corrupted paladins (Bellamy, Venel, and Senn) who buff each other through proximity auras. The raid keeps the bosses apart, dispels protective effects, and absorbs heavy single-target burst around energy thresholds.',
			kills:
				"Damage spikes cluster on the 100-energy threshold when each boss's aura activates and Execution Sentence drops on a player who needs multi-soak. Aura of Devotion turns missed dispels into compound healing pressure, and Divine Toll shield waves catch groups still rotating positions. Tank deaths concentrate during Aura of Wrath windows when bosses haven't been pulled apart fast enough."
		},
		resources: {
			wowhead:
				'https://www.wowhead.com/guide/midnight/raids/the-voidspire-lightblinded-vanguard-boss-strategy-abilities',
			icyVeins: 'https://www.icy-veins.com/wow/lightblinded-vanguard-raid-guide',
			method: 'https://www.method.gg/guides/the-voidspire/lightblinded-vanguard-heroic'
		},
		abilities: [
			{ name: 'Execution Sentence', id: 1248983 },
			{ name: 'Aura of Devotion', id: 1246162 },
			{ name: 'Aura of Wrath', id: 1248449 },
			{ name: 'Divine Toll', id: 1246159 }
		]
	},
	{
		id: 3181,
		name: 'Crown of the Cosmos',
		slug: 'crown-of-the-cosmos',
		teaser: 'Three phases through demibosses, a void-clone Alleria, and the real Alleria.',
		guide: {
			intro:
				"Crown of the Cosmos is the Voidspire's final encounter, a three-stage fight through demibosses, a split tanking phase against Alleria and her void clone, and a single-target phase on Alleria. Each stage layers in mechanics from the prior one rather than replacing them.",
			kills:
				'Damage spikes line up with Void Expulsion pool detonations and add deaths that apply Corrupting Essence to nearby players. Silverstrike Arrow ricochets and Aspect of the End tether breaks produce the largest raidwide pulses on the chart. Deaths cluster when adds reach Alleria and stack her damage buff, and when Rift Slash debuffs accumulate without a tank swap.'
		},
		resources: {
			wowhead:
				'https://www.wowhead.com/guide/midnight/raids/the-voidspire-crown-of-the-cosmos-boss-strategy-abilities',
			icyVeins: 'https://www.icy-veins.com/wow/crown-of-the-cosmos-raid-guide',
			method: 'https://www.method.gg/guides/the-voidspire/crown-of-the-cosmos-heroic'
		},
		abilities: [
			{ name: 'Grasp of Emptiness', id: 1248909 },
			{ name: 'Void Expulsion', id: 1248907 },
			{ name: 'Silverstrike Arrow', id: 1249098 },
			{ name: 'Aspect of the End', id: 1249103 }
		]
	},
	{
		id: 3306,
		name: 'Chimaerus the Undreamt God',
		slug: 'chimaerus-the-undreamt-god',
		teaser: 'Permanent vertical raid split, adds downstairs while the boss tanks upstairs.',
		guide: {
			intro:
				'Chimaerus is the only encounter in the Dreamrift, a single-boss raid. The fight enforces a permanent raid split where one group manages adds downstairs while the other group fights the boss upstairs, with progress on each side gating the other.',
			kills:
				"Damage spikes when Alndust Upheaval knocks players between zones and the add wave begins downstairs. Colossal Horror priority adds drive most tank pressure if they live too long. Corrupted Devastation intermissions bring the largest raidwide pulses, and deaths cluster around Ravenous Dive on groups that haven't pulled the add stack down before the dive lands."
		},
		resources: {
			icyVeins: 'https://www.icy-veins.com/wow/chimaerus-raid-guide'
		},
		abilities: [
			{ name: 'Alndust Upheaval', id: 1251944 },
			{ name: 'Rending Tear', id: 1251945 },
			{ name: 'Corrupted Devastation', id: 1251943 },
			{ name: 'Ravenous Dive', id: 1251946 }
		]
	},
	{
		id: 3182,
		name: "Belo'ren, Child of Al'ar",
		slug: 'beloren-child-of-alar',
		teaser: 'Phoenix encounter at the Sunwell. Mechanic-by-mechanic coverage pending.',
		guide: {
			intro:
				"Belo'ren is the first encounter of March on Quel'Danas, a phoenix-style fight tied to the Sunwell egg. Players manage simultaneous light and void mechanics across multi-stage transitions.",
			kills:
				"Source coverage for Belo'ren is thin at the time of writing, so detailed mechanic-to-spike correlations need to be filled in once Method or Wowhead publish a full guide. The chart still surfaces where damage and deaths cluster across all logged pulls."
		},
		resources: {},
		abilities: []
	},
	{
		id: 3183,
		name: 'Midnight Falls',
		slug: 'midnight-falls',
		teaser: "Also known as L'ura. Memory puzzle plus void cores in a three-phase Sunwell finale.",
		guide: {
			intro:
				"Midnight Falls is the L'ura encounter, the final boss of March on Quel'Danas. The fight runs three phases: a memory-symbol puzzle, a beam-channel phase with Galvanize, and a darkness phase tethered to Dawn Crystal carriers.",
			kills:
				"Damage spikes line up with Death's Dirge resolution when the memory order is wrong. Heaven's Glaives stacking on the tank produces the late-pull tank death pattern. Galvanize beams in phase two pulse the largest raidwide bursts, and phase three deaths cluster when Dark Quasar beams catch players outside Dawn Crystal range while Light Siphon ticks."
		},
		resources: {
			wowhead:
				'https://www.wowhead.com/guide/midnight/raids/march-on-queldanas-midnight-falls-boss-strategy-abilities',
			icyVeins: 'https://www.icy-veins.com/wow/midnight-falls-raid-guide'
		},
		abilities: [
			{ name: "Death's Dirge", id: 1257181 },
			{ name: "Heaven's Glaives", id: 1257182 },
			{ name: 'Dark Quasar', id: 1257183 },
			{ name: 'Light Siphon', id: 1257185 }
		]
	}
];
