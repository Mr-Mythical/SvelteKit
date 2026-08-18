import { spell as s } from '$lib/guideText';
import type { Boss } from '$lib/types/bossData';

const soulcoilRite = s(1288772, 'Soulcoil Rite');
const soulcoilWell = s(1285623, 'Soulcoil Well');
const soulcoilIgnition = s(1285681, 'Soulcoil Ignition');
const uncoiledRage = s(1284034, 'Uncoiled Rage');
const essenceRend = s(1287426, 'Essence Rend');
const possessionBarrage = s(1284103, 'Possession Barrage');
const hollowingStrikes = s(1284109, 'Hollowing Strikes');
const graveboundAdvance = s(1287533, 'Gravebound Advance');
const hungeringPyre = s(1289855, 'Hungering Pyre');
const ritualBurn = s(1297624, 'Ritual Burn');
const vesselOfAwakening = s(1295263, 'Vessel of Awakening');
const corpseBlight = s(1294729, 'Corpse Blight');
const slitheringFlame = s(1294933, 'Slithering Flame');
const graspingDepths = s(1293212, 'Grasping Depths');
const immortalCoil = s(1299988, 'Immortal Coil');
const soulExhaustion = s(1300235, 'Soul Exhaustion');
const invoke = s(1299673, 'Invoke');
const latentCultist = s(1287198, 'Latent Cultist');
const soulTransfer = s(1292248, 'Soul Transfer');
const anguishedEchoes = s(1294846, 'Anguished Echoes');
const uncoiling = s(1290003, 'Uncoiling');
const restlessAmani = s(1289919, 'Restless Amani');
const soulcoiled = s(1290361, 'Soulcoiled');

const dominance = s(1290193, "Ula'tek's Dominance");
const vitriolicStasis = s(1284588, 'Vitriolic Stasis');
const helicalToxins = s(1284590, 'Helical Toxins');
const toxicDroplets = s(1284434, 'Toxic Droplets');
const venomCoagulation = s(1284251, 'Venom Coagulation');
const unstableMiasma = s(1288232, 'Unstable Miasma');
const blightedBlood = s(1284471, 'Blighted Blood');
const livingVenom = s(1284207, 'Living Venom');
const clingingMurk = s(1288297, 'Clinging Murk');
const bloodVenom = s(1284208, 'Blood Venom');
const bloodvenomInjection = s(1284487, 'Bloodvenom Injection');
const shiftingProtovenom = s(1296878, 'Shifting Protovenom');
const protovenomEruption = s(1296962, 'Protovenom Eruption');
const empoweringSlam = s(1284458, 'Empowering Slam');
const markOfAcid = s(1284494, 'Mark of Acid');
const markOfBlood = s(1284503, 'Mark of Blood');

const finalAscension = s(1292780, 'Final Ascension');
const mightyThud = s(1296092, 'Mighty Thud');
const unitedDefense = s(1297646, 'United Defense');
const grabFish = s(1295441, 'Grab Fish');
const splinters = s(1308853, 'Splinters');
const disgustingFish = s(1296535, 'Disgusting Fish');
const shellSpin = s(1296061, 'Shell Spin');
const iceboundFlames = s(1286921, 'Icebound Flames');
const blinkNova = s(1292793, 'Blink Nova');
const shreddingShards = s(1295854, 'Shredding Shards');
const steadyStrikes = s(1291929, 'Steady Strikes');
const cataclysmicInvocation = s(1291390, 'Cataclysmic Invocation');
const relentlessEscalation = s(1296227, 'Relentless Escalation');
const explosiveSurprise = s(1297625, 'Explosive Surprise');
const blastWave = s(1305844, 'Blast Wave');
const frostfireVolley = s(1295886, 'Frostfire Volley');
const burningFlames = s(1295928, 'Burning Flames');
const piercingFrost = s(1295954, 'Piercing Frost');
const relicRupture = s(1310027, 'Relic Rupture');

const imbibe = s(1283164, 'Imbibe');
const malignantBurst = s(1280189, 'Malignant Burst');
const plagueFroth = s(1281907, 'Plague Froth');
const causticSurge = s(1285979, 'Caustic Surge');
const catalyticBile = s(1282601, 'Catalytic Bile');
const hardenedVenom = s(1314837, 'Hardened Venom');
const plagueWave = s(1295796, 'Plague Wave');
const conflagratingExpulsion = s(1298587, 'Conflagrating Expulsion');
const explodingInfection = s(1295173, 'Exploding Infection');
const hemoExpulsion = s(1298582, 'Hemo Expulsion');
const siphoningInfection = s(1295224, 'Siphoning Infection');
const gloomExpulsion = s(1298583, 'Gloom Expulsion');
const umbralEjection = s(1286736, 'Umbral Ejection');
const stygianInfection = s(1294994, 'Stygian Infection');
const toxicVapor = s(1284561, 'Toxic Vapor');
const drippingFangs = s(1280935, 'Dripping Fangs');

const howlingMaelstrom = s(1285732, 'Howling Maelstrom');
const viscousCyst = s(1287008, 'Viscous Cyst');
const venomousSurge = s(1305959, 'Venomous Surge');
const digIn = s(1286033, 'Dig In');
const apexPredator = s(1277025, 'Apex Predator');
const ragingCrosswinds = s(1285419, 'Raging Crosswinds');
const ulateksPresence = s(1285961, "Ula'tek's Presence");
const ravage = s(1277002, 'Ravage');
const mutilate = s(1277027, 'Mutilate');
const tempest = s(1287072, 'Tempest');
const corrodingVenom = s(1282869, 'Corroding Venom');
const causticClaws = s(1305998, 'Caustic Claws');
const serpentsFury = s(1297367, "Serpent's Fury");
const unboundFerocity = s(1296898, 'Unbound Ferocity');
const toTheSlaughter = s(1297414, 'To the Slaughter');
const virulence = s(1297707, 'Virulence');

const ravenousFeast = s(1290516, 'Ravenous Feast');
const eternalVenom = s(1290336, 'Eternal Venom');
const submerge = s(1308556, 'Submerge');
const uncoiledWrath = s(1308583, 'Uncoiled Wrath');
const stoneBreaker = s(1288538, 'Stone Breaker');
const coilingIchor = s(1290809, 'Coiling Ichor');
const vileFlood = s(1293749, 'Vile Flood');
const feasted = s(1310096, 'Feasted');
const congealedGore = s(1292505, 'Congealed Gore');
const barbedBulwark = s(1303378, 'Barbed Bulwark');
const rouseTheBrood = s(1308356, 'Rouse the Brood');
const taintedBloodTwins = s(1310099, 'Tainted Blood');
const causticDeluge = s(1289192, 'Caustic Deluge');
const venomousEmergence = s(1291404, 'Venomous Emergence');
const corrosiveSpit = s(1291478, 'Corrosive Spit');
const stirTheDepths = s(1290956, 'Stir the Depths');
const sanguineStorm = s(1306872, 'Sanguine Storm');
const toxicFumes = s(1295049, 'Toxic Fumes');

const ritualOfTheFang = s(1300876, 'Ritual of the Fang');
const fangsOfTheCoiledAltar = s(1282487, 'Fangs of the Coiled Altar');
const coalescedVenom = s(1282403, 'Coalesced Venom');
const sever = s(1299680, 'Sever');
const toxicDeluge = s(1299960, 'Toxic Deluge');
const dreadmarch = s(1285643, 'Dreadmarch');
const soulSever = s(1286573, 'Soul Sever');
const eternalNightfall = s(1286918, 'Eternal Nightfall');
const veilOfTwilight = s(1286912, 'Veil of Twilight');
const soulbinding = s(1304032, 'Soulbinding');
const guillotine = s(1283489, 'Guillotine');
const widowsKiss = s(1283623, "Widow's Kiss");
const guillotined = s(1309940, 'Guillotined');
const gloombomb = s(1286895, 'Gloombomb');
const gravebound = s(1286837, 'Gravebound');
const spiritcackle = s(1286441, 'Spiritcackle');
const wailOfTerror = s(1286399, 'Wail of Terror');
const volatileVenom = s(1282419, 'Volatile Venom');
const taintedBloodAltar = s(1310013, 'Tainted Blood');
const axegrinder = s(1283832, 'Axegrinder');
const malevolentResonance = s(1310732, 'Malevolent Resonance');
const venomRupture = s(1299838, 'Venom Rupture');
const venomfang = s(1282287, 'Venomfang');
const ghastlyRegeneration = s(1304033, 'Ghastly Regeneration');
const reclaimEssence = s(1287718, 'Reclaim Essence');
const spiritErasure = s(1287722, 'Spirit Erasure');
const chopDown = s(1301350, 'Chop Down');
const manifestationOfDread = s(1285844, 'Manifestation of Dread');
const virulentMutation = s(1310544, 'Virulent Mutation');

export const venomousAbyssBosses: Boss[] = [
	{
		id: 2888,
		name: "Nek'zali the Soulcoiler",
		slug: 'nekzali-the-soulcoiler',
		raidId: 'venomous-abyss',
		teaser: 'Keep Restless Amani off the Soulcoil Well or she enrages at 100 energy.',
		guides: {
			heroic: {
				teaser: 'Keep Restless Amani off the Soulcoil Well or she enrages at 100 energy.',
				intro: `Nek'zali is an add-control fight around a well of necrotic water. She enrages at 100 energy. Every ${restlessAmani} that drinks, and every ${soulcoilIgnition}, pushes her toward ${uncoiledRage}.`,
				overview: [
					`The ${soulcoilWell} sits in the middle of the room. Standing in it ticks Shadow damage and applies ${soulcoiled} to anyone who dies there. Every ${restlessAmani} that reaches the water grants Nek'zali five energy and blasts the raid with ${soulcoilRite}. Extra well feeds make ${uncoiledRage} arrive early.`,
					`Keep adds off the well. Break ${graveboundAdvance} with magic damage before the Amani commit to the water, tank her on the heaviest coffin spawn so melee can cleave, and keep the ${possessionBarrage} lane empty. At 50% she hides behind Echoes of Jawae. After that window, Bloodlust and kill her before 100 energy.`
				],
				phases: [
					{
						title: 'Phase 1',
						body: [
							`Coffins light before ${restlessAmani} climb out. Drag Nek'zali onto the denser spawn so the adds walk through the boss instead of a free path to the ${soulcoilWell}. ${graveboundAdvance} is a magic absorb, so ranged casters (not Hunters) should rip it, then Death Grip or knockbacks finish the gather. Dead Amani leave ${vesselOfAwakening} corpses and a 15-yard ${corpseBlight}. Burn leftover bodies or they revive.`,
							`${soulcoilIgnition} is the big scripted energy spike. She triggers ${soulcoilRite} several times in a row and covers the raid with ${ritualBurn}. Healers cover that overlap. Everyone else sidesteps ${anguishedEchoes}. Go into Ignition with no ${ritualBurn} stacks.`,
							`${essenceRend} yanks random players toward the center, then leaves a dispellable DoT. Walk to a safe outer edge before the dispel. The drop is a ${latentCultist} puddle that stays for the rest of the fight. ${possessionBarrage} fires four spirits at the active tank. They explode on the first player they hit, spawn ${restlessAmani} there, and raid damage falls off with distance, so that tank stands at least 30 yards out and nobody stands in the lane. Each echo also applies ${hollowingStrikes} to whoever it hits. Melee applies the same stack, so swap around five or six stacks, ideally as Barrage ends so the offtank taunts into a clean window.`
						]
					},
					{
						title: 'Intermission',
						body: [
							`At 50% she becomes immune. ${soulTransfer} channels into an Echo of Jawae. Move out of the beam before it finishes. Kill both Echoes to break the tethers and pull her back in. ${restlessAmani} keep spawning, so the same well rules still apply.`,
							`${hungeringPyre} is a group soak on a random player. Send melee into it, and plant the circle on a corpse pile so the soak deletes leftover add bodies. Players who skip the soak pick up ${slitheringFlame} and can mop stray corpses. Corpses left from earlier revive here.`
						]
					},
					{
						title: 'Phase 2',
						body: [
							`Bloodlust as soon as she is attackable. ${uncoiling} ticks Shadow damage for the rest of the fight. ${invoke} reapplies ${soulcoilRite} so the DoT no longer drops, and shoves ${latentCultist} puddles. Kill her before she hits 100 energy.`,
							`${uncoiledRage} is a wipe: 500% damage done plus a sprint. If the well was already fed, this window is shorter. Call leftover Amani immediately and do not greed a puddle soak during ${invoke}.`
						]
					}
				],
				kills: `Back-to-back well feeds turn the next ${soulcoilRite} into a healer check you cannot cover, especially when ${ritualBurn} lands on the same Ignition. ${possessionBarrage} wipes happen when someone stands in the lane, the tank is too close, or an echo tags a player with extra ${hollowingStrikes}. Intermission deaths are solo ${hungeringPyre} soaks or leftover ${vesselOfAwakening} corpses. Later deaths follow ${invoke} puddle moves stacked on ${uncoiling}.`,
				quick: {
					tanks: `Face her at the entrance, then walk her onto glowing coffins. Sprint 30 yards out for ${possessionBarrage} and keep the lane empty. After the volley, gather the ${restlessAmani} that spawned on you. Swap ${hollowingStrikes} at five or six stacks. In the intermission, park ${hungeringPyre} on corpses.`,
					healers: `Do not instant-dispel ${essenceRend}. Wait until the target has reached the edge. Ramp ${soulcoilIgnition} together with ${ritualBurn}. The last phase is a stacking ${soulcoilRite} race, so hold a cooldown for ${invoke}.`,
					dps: `Break ${graveboundAdvance} with magic damage, then kill Amani before they touch the ${soulcoilWell}. Burn ${vesselOfAwakening} bodies before ${corpseBlight} spreads. Soak ${hungeringPyre} as assigned, or skip it for ${slitheringFlame} and mop strays. Kill both Echoes of Jawae. Lust after the intermission and finish her before ${uncoiledRage}.`
				},
				faqs: [
					{
						question: "What actually wipes a Nek'zali pull?",
						answer: `The ${soulcoilWell}. Each ${restlessAmani} that drinks grants five energy and applies ${soulcoilRite}. At 100 energy she casts ${uncoiledRage}.`
					},
					{
						question: 'When does the intermission start?',
						answer: `At 50% health she becomes immune behind two Echoes of Jawae. Kill both Echoes to break the tethers and pull her back in.`
					},
					{
						question: 'Where do you Bloodlust?',
						answer: `After the intermission, as soon as she is attackable. Kill her before 100 energy.`
					}
				]
			},
			mythic: {
				teaser:
					'Rotate three well teams for Grasping Depths, then lust after the intermission before Uncoiled Rage.',
				changes: [
					`${graspingDepths} pulls rotating teams into the well until a Drowned Echo dies.`,
					`${immortalCoil} then ${soulExhaustion}, so rotate three teams of four DPS and a healer.`,
					`${invoke} after the intermission also silences for three seconds.`
				],
				intro: `Nek'zali is an add-control fight around a well of necrotic water. She enrages at 100 energy. Every ${restlessAmani} that drinks, and every ${soulcoilIgnition}, pushes her toward ${uncoiledRage}. ${graspingDepths} drags rotating teams into that well until a Drowned Echo dies.`,
				overview: [
					`The ${soulcoilWell} sits in the middle of the room. Standing in it ticks Shadow damage and applies ${soulcoiled} to anyone who dies there. Every ${restlessAmani} that reaches the water grants Nek'zali five energy and blasts the raid with ${soulcoilRite}. Extra well feeds make ${uncoiledRage} arrive early.`,
					`Keep adds off the well, with two jobs at once. Break ${graveboundAdvance} on the platform while a team of four DPS and a healer is in the water. Tank her on the heaviest coffin spawn so melee can cleave, and keep the ${possessionBarrage} lane empty. At 50% she hides behind Echoes of Jawae. After that window, Bloodlust and kill her before 100 energy.`
				],
				phases: [
					{
						title: 'Phase 1',
						body: [
							`Coffins light before ${restlessAmani} climb out. Drag Nek'zali onto the denser spawn so the adds walk through the boss instead of a free path to the ${soulcoilWell}. ${graveboundAdvance} is a magic absorb, so ranged casters (not Hunters) should rip it, then Death Grip or knockbacks finish the gather. Dead Amani leave ${vesselOfAwakening} corpses and a 15-yard ${corpseBlight}. Burn leftover bodies or they revive.`,
							`${graspingDepths} drags the raid into the ${soulcoilWell} until a Drowned Echo dies. Players pulled in enter ${immortalCoil}, then ${soulExhaustion} blocks a repeat trip, so rotate three teams of four DPS and a healer. The platform group still has to break Amani shields while a team is in the water.`,
							`${soulcoilIgnition} is the big scripted energy spike. She triggers ${soulcoilRite} several times in a row and covers the raid with ${ritualBurn}. Healers cover that overlap, including the team currently in the well. Everyone else sidesteps ${anguishedEchoes}. Go into Ignition with no ${ritualBurn} stacks.`,
							`${essenceRend} yanks random players toward the center, then leaves a dispellable DoT. Walk to a safe outer edge before the dispel. The drop is a ${latentCultist} puddle that stays for the rest of the fight. ${possessionBarrage} fires four spirits at the active tank. They explode on the first player they hit, spawn ${restlessAmani} there, and raid damage falls off with distance, so that tank stands at least 30 yards out and nobody stands in the lane. Each echo also applies ${hollowingStrikes} to whoever it hits. Melee applies the same stack, so swap around five or six stacks, ideally as Barrage ends so the offtank taunts into a clean window.`
						]
					},
					{
						title: 'Intermission',
						body: [
							`At 50% she becomes immune. ${soulTransfer} channels into an Echo of Jawae. Move out of the beam before it finishes. Kill both Echoes to break the tethers and pull her back in. ${restlessAmani} keep spawning and ${graspingDepths} still pulls teams, so the same well rules still apply.`,
							`${hungeringPyre} is a group soak on a random player. Send melee into it, and plant the circle on a corpse pile so the soak deletes leftover add bodies. Players who skip the soak pick up ${slitheringFlame} and can mop stray corpses. Corpses left from earlier revive here.`
						]
					},
					{
						title: 'Phase 2',
						body: [
							`Bloodlust as soon as she is attackable. ${uncoiling} ticks Shadow damage for the rest of the fight. ${invoke} reapplies ${soulcoilRite} so the DoT no longer drops, shoves ${latentCultist} puddles, and interrupts casts with a three-second silence. Kill her before she hits 100 energy.`,
							`${uncoiledRage} is a wipe: 500% damage done plus a sprint. If the well was already fed, this window is shorter. Call leftover Amani immediately and do not greed a puddle soak during ${invoke}.`
						]
					}
				],
				kills: `A Drowned Echo that lives too long holds a team in the ${soulcoilWell} while Amani drink on the platform. Back-to-back well feeds turn the next ${soulcoilRite} into a healer check you cannot cover, especially when ${ritualBurn} lands on the same Ignition. ${possessionBarrage} wipes happen when someone stands in the lane, the tank is too close, or an echo tags a player with extra ${hollowingStrikes}. Intermission deaths are solo ${hungeringPyre} soaks or leftover ${vesselOfAwakening} corpses. Later deaths follow ${invoke} silences stacked on puddle moves and ${uncoiling}.`,
				quick: {
					tanks: `Face her at the entrance, then walk her onto glowing coffins. Sprint 30 yards out for ${possessionBarrage} and keep the lane empty. After the volley, gather the ${restlessAmani} that spawned on you. Swap ${hollowingStrikes} at five or six stacks. In the intermission, park ${hungeringPyre} on corpses.`,
					healers: `One healer goes with each ${graspingDepths} team. Do not instant-dispel ${essenceRend}. Wait until the target has reached the edge. Ramp ${soulcoilIgnition} together with ${ritualBurn}. The last phase is a stacking ${soulcoilRite} race, so hold a cooldown for ${invoke} and the silence.`,
					dps: `Rotate three teams of four into the well to kill the Drowned Echo. The platform group breaks ${graveboundAdvance} and burns ${vesselOfAwakening} bodies before ${corpseBlight} spreads. Soak ${hungeringPyre} as assigned, or skip it for ${slitheringFlame} and mop strays. Kill both Echoes of Jawae. Lust after the intermission and finish her before ${uncoiledRage}.`
				},
				faqs: [
					{
						question: "What actually wipes a Nek'zali pull?",
						answer: `The ${soulcoilWell}. Each ${restlessAmani} that drinks grants five energy and applies ${soulcoilRite}. A Drowned Echo that lives too long holds a team in the water while the platform feeds her. At 100 energy she casts ${uncoiledRage}.`
					},
					{
						question: 'When does the intermission start?',
						answer: `At 50% health she becomes immune behind two Echoes of Jawae. Kill both Echoes to break the tethers and pull her back in. ${graspingDepths} still fires in that window.`
					},
					{
						question: 'Where do you Bloodlust?',
						answer: `After the intermission, as soon as she is attackable. Kill her before 100 energy.`
					},
					{
						question: 'How do you handle Grasping Depths?',
						answer: `${graspingDepths} drags a team into the water until a Drowned Echo dies. Players pulled in enter ${immortalCoil}, then ${soulExhaustion} blocks a repeat trip. Rotate three teams of four DPS and a healer. Everyone else still has to keep Amani off the well on the platform.`
					}
				]
			}
		},
		abilities: [
			{ name: 'Soulcoil Rite', id: 1288772 },
			{ name: 'Soulcoil Well', id: 1285623 },
			{ name: 'Soulcoil Ignition', id: 1285681 },
			{ name: 'Uncoiled Rage', id: 1284034 },
			{ name: 'Essence Rend', id: 1287426 },
			{ name: 'Possession Barrage', id: 1284103 },
			{ name: 'Hollowing Strikes', id: 1284109 },
			{ name: 'Gravebound Advance', id: 1287533 },
			{ name: 'Hungering Pyre', id: 1289855 },
			{ name: 'Uncoiling', id: 1290003 },
			{ name: 'Invoke', id: 1299673 }
		]
	},
	{
		id: 2874,
		name: 'Entombed Sentinels',
		slug: 'entombed-sentinels',
		raidId: 'venomous-abyss',
		teaser: "Keep Breath and Blood of Ula'tek apart, then even their health before Stasis.",
		guides: {
			heroic: {
				teaser: "Keep Breath and Blood of Ula'tek apart, then even their health before Stasis.",
				intro:
					"Breath of Ula'tek and Blood of Ula'tek are two bosses with two raid halves. Keep them at least 40 yards apart or they take almost no damage, and the intermission copies the higher health onto the weaker golem.",
				overview: [
					`Split the raid and keep the golems at least 40 yards apart. Closer than that, ${dominance} cuts their damage taken by 99% and the pull stalls. ${markOfAcid} and ${markOfBlood} also hit everyone within 40 yards, so do not stand in the middle.`,
					`Damage has to stay even. At 100 energy they crash together for ${vitriolicStasis}, which copies the higher health onto the weaker golem and infects everyone with ${helicalToxins}. After Stasis, tanks swap Sentinels so each half's mark stacks can fall off.`
				],
				phases: [
					{
						title: "Breath of Ula'tek",
						body: [
							`Breath's half lives on ${toxicDroplets} and a ${venomCoagulation} add. Step on droplets before they erupt. Popped droplets spit ${livingVenom} back toward Breath, so step to her flank after the stomp instead of standing in the return path. ${venomCoagulation} pulses the raid while it lives, so it is the first kill target on that side.`,
							`${empoweringSlam} is a stacking physical tank hit. You do not swap bosses until Stasis, so plan personals as energy climbs. Stay loosely spread so new droplets do not land in a clump.`
						]
					},
					{
						title: "Blood of Ula'tek",
						body: [
							`Blood's half is soak and dispel. ${unstableMiasma} marks a player for a delayed split explosion and applies ${clingingMurk} to everyone who soaks. ${blightedBlood} is a Magic DoT. Dispel immediately so you can get a second dispel before it expires. ${clingingMurk} and expired ${blightedBlood} drop ${bloodVenom} pools. Walk them to a corner.`,
							`${bloodvenomInjection} is the other stacking tank hit, with a Shadow DoT attached. It can drop a ${bloodVenom} pool when it falls off after Stasis, so the new Blood tank should already have a dump spot.`
						]
					},
					{
						title: 'Intermission',
						body: [
							`Both golems charge mid. Stop boss damage and solve ${helicalToxins}. Every player gets 1, 2, or 3 orbs. Pair 1 with 3, or 2 with 2, so the merge equals exactly four. That clears the venom. A merge over four kills both players instead of knocking them.`,
							`When Stasis ends, groups go back to their original walls. Tanks taunt the Sentinel they did not have and walk it to that wall. The raid does not change sides. That swap is what lets ${markOfAcid} and ${markOfBlood} fall off. If health was uneven going in, you just watched the weaker golem get healed, which is why you even the damage.`
						]
					}
				],
				kills: `${dominance} is a silent wipe. The bosses simply stop taking damage. Uneven health makes ${vitriolicStasis} undo the last minute. Unsoaked ${unstableMiasma}, erupting droplets, ${livingVenom} spat back through the Breath group, and ${helicalToxins} that merge past four are the raid spikes. Tanks die to ${empoweringSlam} or Injection left on one target through a full energy cycle.`,
				quick: {
					tanks: `Hold 40 yards of gap. Ride personals through ${empoweringSlam} and ${bloodvenomInjection}. You only swap after Stasis. After the intermission, taunt the other Sentinel, walk it to your wall, and dump any Injection pool in a corner.`,
					healers: `Instant-dispel ${blightedBlood}. Ramp ${unstableMiasma} and the post-Stasis ${helicalToxins} scramble. A merge over four is a double kill, so call orb counts. Mark damage peaks at the end of each main-phase sequence, so save cooldowns for that window rather than the opener.`,
					dps: `Cleave your Sentinel, kill ${venomCoagulation} on sight, and stomp ${toxicDroplets} from Breath's flank so ${livingVenom} misses the group. Soak Miasma with your half and walk ${bloodVenom} pools to a corner. During Stasis, count orbs and collide to exactly four stacks of ${helicalToxins}.`
				},
				faqs: [
					{
						question: 'Why do the Sentinels take no damage?',
						answer: `${dominance} grants 99% damage reduction while the golems are within 40 yards. Tank them apart for the entire fight, including knockbacks.`
					},
					{
						question: 'How do you clear Helical Toxins?',
						answer: `Merge with another infected player so the combined orbs equal four. 1+3 or 2+2. Missing that window detonates ${helicalToxins}. A merge over four kills both players.`
					},
					{
						question: 'When do tanks swap?',
						answer: `After ${vitriolicStasis}, not during the main phase. Groups stay on their walls. Tanks taunt the other Sentinel and walk it over so ${markOfAcid} and ${markOfBlood} can fall off. Slam and Injection just have to be mitigated until then.`
					}
				]
			},
			mythic: {
				teaser: 'Pair Shifting Protovenom on each side. Keep the golems apart and even for Stasis.',
				changes: [
					`${shiftingProtovenom} on each side: pair two marked players on your pad. Do not cross to the other group.`,
					`A marked player who touches an unmarked one triggers ${protovenomEruption}. That 10-yard knockback can throw a tank, and their golem, inside 40 yards of the other Sentinel.`
				],
				intro: `Breath of Ula'tek and Blood of Ula'tek are two bosses with two raid halves. Keep them at least 40 yards apart or they take almost no damage. Each side also pairs ${shiftingProtovenom} on its own pad, and the intermission copies the higher health onto the weaker golem.`,
				overview: [
					`Split the raid and keep the golems at least 40 yards apart. Closer than that, ${dominance} cuts their damage taken by 99% and the pull stalls. ${markOfAcid} and ${markOfBlood} also hit everyone within 40 yards, so do not stand in the middle. Call a pairing pad per side for ${shiftingProtovenom}. Do not solve marks by running through the other Sentinel's group.`,
					`Damage has to stay even. At 100 energy they crash together for ${vitriolicStasis}, which copies the higher health onto the weaker golem and infects everyone with ${helicalToxins}. After Stasis, tanks swap Sentinels so each half's mark stacks can fall off.`
				],
				phases: [
					{
						title: "Breath of Ula'tek",
						body: [
							`Breath's half lives on ${toxicDroplets} and a ${venomCoagulation} add. Step on droplets before they erupt. Popped droplets spit ${livingVenom} back toward Breath, so step to her flank after the stomp instead of standing in the return path. ${venomCoagulation} pulses the raid while it lives, so it is the first kill target on that side.`,
							`${shiftingProtovenom} marks random players. Pair two marked players on Breath's pad to clear it. Touching an unmarked player triggers ${protovenomEruption}, a 10-yard knockback. If that hits a tank, their golem can slide inside 40 yards of the other Sentinel.`,
							`${empoweringSlam} is a stacking physical tank hit. You do not swap bosses until Stasis, so plan personals as energy climbs. Stay loosely spread so new droplets do not land in a clump.`
						]
					},
					{
						title: "Blood of Ula'tek",
						body: [
							`Blood's half is soak and dispel. ${unstableMiasma} marks a player for a delayed split explosion and applies ${clingingMurk} to everyone who soaks. ${blightedBlood} is a Magic DoT. Dispel immediately so you can get a second dispel before it expires. ${clingingMurk} and expired ${blightedBlood} drop ${bloodVenom} pools. Walk them to a corner.`,
							`${shiftingProtovenom} marks this side too. Pair two marked players on Blood's pad. Do not cross into Breath's group to clear it. ${bloodvenomInjection} is the other stacking tank hit, with a Shadow DoT attached. It can drop a ${bloodVenom} pool when it falls off after Stasis, so the new Blood tank should already have a dump spot.`
						]
					},
					{
						title: 'Intermission',
						body: [
							`Both golems charge mid. Stop boss damage and solve ${helicalToxins}. Every player gets 1, 2, or 3 orbs. Pair 1 with 3, or 2 with 2, so the merge equals exactly four. That clears the venom. A merge over four kills both players instead of knocking them. Stay in your own half while you merge so you do not trip ${protovenomEruption} on the other group.`,
							`When Stasis ends, groups go back to their original walls. Tanks taunt the Sentinel they did not have and walk it to that wall. The raid does not change sides. That swap is what lets ${markOfAcid} and ${markOfBlood} fall off. If health was uneven going in, you just watched the weaker golem get healed, which is why you even the damage.`
						]
					}
				],
				kills: `${dominance} is a silent wipe. The bosses simply stop taking damage. Uneven health makes ${vitriolicStasis} undo the last minute. Unsoaked ${unstableMiasma}, erupting droplets, ${livingVenom} spat back through the Breath group, ${helicalToxins} that merge past four, and ${protovenomEruption} knockbacks that throw a tank inside 40 yards of the other Sentinel are the raid spikes. Tanks die to ${empoweringSlam} or Injection left on one target through a full energy cycle.`,
				quick: {
					tanks: `Hold 40 yards of gap. Ride personals through ${empoweringSlam} and ${bloodvenomInjection}. You only swap after Stasis. After the intermission, taunt the other Sentinel, walk it to your wall, and dump any Injection pool in a corner.`,
					healers: `Instant-dispel ${blightedBlood}. Ramp ${unstableMiasma} and the post-Stasis ${helicalToxins} scramble. A merge over four is a double kill, so call orb counts. Watch ${protovenomEruption} knockbacks that drag people into the other half.`,
					dps: `Cleave your Sentinel, kill ${venomCoagulation} on sight, and stomp ${toxicDroplets} from Breath's flank so ${livingVenom} misses the group. Pair ${shiftingProtovenom} on your side's pad. Soak Miasma with your half and walk ${bloodVenom} pools to a corner. During Stasis, count orbs and collide to exactly four stacks of ${helicalToxins}.`
				},
				faqs: [
					{
						question: 'Why do the Sentinels take no damage?',
						answer: `${dominance} grants 99% damage reduction while the golems are within 40 yards. Tank them apart for the entire fight, including knockbacks from ${protovenomEruption}.`
					},
					{
						question: 'How do you clear Helical Toxins?',
						answer: `Merge with another infected player so the combined orbs equal four. 1+3 or 2+2. Missing that window detonates ${helicalToxins}. A merge over four kills both players.`
					},
					{
						question: 'When do tanks swap?',
						answer: `After ${vitriolicStasis}, not during the main phase. Groups stay on their walls. Tanks taunt the other Sentinel and walk it over so ${markOfAcid} and ${markOfBlood} can fall off. Slam and Injection just have to be mitigated until then.`
					},
					{
						question: 'How do you clear Shifting Protovenom?',
						answer: `Pair two marked players on a pad on your own side. Touching an unmarked player triggers ${protovenomEruption}, a 10-yard knockback that can throw a tank inside 40 yards of the other Sentinel. Do not solve it by running through the other group.`
					}
				]
			}
		},
		abilities: [
			{ name: "Ula'tek's Dominance", id: 1290193 },
			{ name: 'Vitriolic Stasis', id: 1284588 },
			{ name: 'Helical Toxins', id: 1284590 },
			{ name: 'Unstable Miasma', id: 1288232 },
			{ name: 'Empowering Slam', id: 1284458 },
			{ name: 'Bloodvenom Injection', id: 1284487 },
			{ name: 'Toxic Droplets', id: 1284434 },
			{ name: 'Venom Coagulation', id: 1284251 }
		]
	},
	{
		id: 2894,
		name: 'The Lost Explorers',
		slug: 'the-lost-explorers',
		raidId: 'venomous-abyss',
		teaser: "Break Mor'zahi's control with Disgusting Fish before Final Ascension finishes.",
		guides: {
			heroic: {
				teaser: "Break Mor'zahi's control with Disgusting Fish before Final Ascension finishes.",
				intro: `Scrollsage Iku, First Mate Nama, and Trader Gebbo are a three-target council puppeted by Mor'zahi. You choose which explorer spends their ultimate by feeding them a fish before the possess finishes.`,
				overview: [
					`The three tortollans do not share health. Cleave two at a time, usually Nama with whoever you are currently feeding, and keep the third more than 30 yards away. If all three stand together, ${unitedDefense} cuts their damage taken by 99%. Balance their health and kill them in the same window. A single early death enrages the other two. Lust on pull.`,
					`Gebbo throws junk crates. Stomp them for ${grabFish} and a stacking ${splinters} bleed that hits hard, so do not ignore the DoT while you hunt the fish. Carry the fish into melee of the explorer you want and press the extra action at roughly 90-95 Mor'zahi energy. That triggers that boss's ultimate and applies ${disgustingFish}, so they cannot be chosen again. Miss the feed and ${finalAscension} wipes the raid. Feed Gebbo first, then Nama, then Iku.`
				],
				phases: [
					{
						title: 'The council',
						body: [
							`Nama's ${shellSpin} is a three-shell frontal aimed at a random melee. Melee stay glued to her and bait it off the platform, then step out. It does not overlap ${mightyThud}. Iku's ${iceboundFlames} needs a two- or three-person kick rotation. The tank can help when they are in range. ${blinkNova} teleports Iku onto a ranged player and splits less damage the farther you run, so do not hug him.`,
							`Tanks swap after each ${shreddingShards} from Iku. Nama's ${steadyStrikes} ramps on whoever she is hitting, so the Nama tank holds personals at high stacks and moves her between Gebbo and Iku so you always cleave two without stacking all three. A death on Iku can cascade into ${cataclysmicInvocation}. A death on Nama can trigger ${relentlessEscalation}. Assign crate stomps so ${splinters} does not sit on the same players who are also carrying the fish.`
						]
					},
					{
						title: 'Gebbo: Explosive Surprise',
						body: [
							`${explosiveSurprise} lights bomb players while bouncy mushrooms spawn. Drop bombs on the rim, away from mushrooms. A ${blastWave} then sweeps the floor. Wait until it is about to hit a mushroom and jump it. Mushrooms are consumed, but several people can use one if they enter together. Jumping a mushroom early strands the back of the raid.`
						]
					},
					{
						title: 'Nama: Mighty Thud',
						body: [
							`${mightyThud} marks three players. Nama leaps in distance order. Each landing splits Physical damage in 6 yards and knocks. Place one soak in melee and two at separate ranged spots so the circles never overlap. Two teams (odds / evens) is enough: team one takes leaps 1 and 3, team two takes leap 2. Empty landings hit the whole raid.`
						]
					},
					{
						title: 'Iku: Frostfire Volley',
						body: [
							`${frostfireVolley} fires Fire missiles (ranged) and Frost missiles (melee) that must be spread to the rim. Each drop leaves a patch plus ${burningFlames} or ${piercingFrost}. Running the opposite element clears a patch and pulses the raid, so plan a healer cooldown for it. Do this last so you are not still soaking ${mightyThud} inside fire.`
						]
					}
				],
				kills: `${finalAscension} completing is the hard wipe. An early explorer death enrages the other two. Empty ${mightyThud} leaps, overlapping ${blinkNova}, and uncleared Frostfire patches create the mid-fight healing spikes. Tank deaths are ${steadyStrikes} left to ramp. ${unitedDefense} looks like the bosses simply stopped dying. Ignoring ${splinters} while you hunt the fish is how people drop before the feed.`,
				quick: {
					tanks: `Cleave Nama with one other explorer and keep the third more than 30 yards away. Swap ${shreddingShards}. Move Nama between Gebbo and Iku. Do not let all three stand inside ${unitedDefense}.`,
					healers: `${blinkNova} falls off with distance. Ramp ${mightyThud} soaks and the Frostfire clear. ${splinters} from crate stomps is real damage, so do not ignore it.`,
					dps: `Stomp crates, grab the fish, and feed Gebbo, then Nama, then Iku before ${finalAscension}. ${splinters} stacks while you do that, so rotate stomps. Interrupt ${iceboundFlames}. Bait ${shellSpin}. Soak ${mightyThud} as assigned. Cancel Frostfire patches with the opposite element.`
				},
				faqs: [
					{
						question: "How do you stop Mor'zahi?",
						answer: `Stomp Gebbo's junk for ${grabFish} and feed it to the possessed explorer at 90-95 energy. That spends their ultimate and applies ${disgustingFish}. Missing the feed lets ${finalAscension} finish.`
					},
					{
						question: 'Why do the explorers become immune?',
						answer: `${unitedDefense} grants 99% damage reduction when all three stand within 30 yards. Cleave two and keep the third farther out.`
					},
					{
						question: 'What is the feeding order?',
						answer: `Feed Gebbo first, then Nama, then Iku. Lust on pull so the last ultimate happens on a dying Iku, not a full-health council.`
					},
					{
						question: 'Do they have to die together?',
						answer: `Yes, or very close. They do not share health, but each death enrages the survivors. If you have to stagger, kill Gebbo first, then Nama, then Iku.`
					}
				]
			},
			mythic: {
				teaser: 'Every crate splinters the raid. Assign stomps and feed Gebbo, Nama, then Iku.',
				changes: [
					`${relicRupture} applies ${splinters} on every crate.`,
					`An unbroken crate after 25 seconds pulses again.`,
					`Assign stomps as part of the fish feed.`
				],
				intro: `Scrollsage Iku, First Mate Nama, and Trader Gebbo are a three-target council puppeted by Mor'zahi. You choose which explorer spends their ultimate by feeding them a fish before the possess finishes. ${relicRupture} makes every crate a raid-wide ${splinters} hit, so assigned stomps are part of the feed plan.`,
				overview: [
					`The three tortollans do not share health. Cleave two at a time, usually Nama with whoever you are currently feeding, and keep the third more than 30 yards away. If all three stand together, ${unitedDefense} cuts their damage taken by 99%. Balance their health and kill them in the same window. A single early death enrages the other two. Lust on pull.`,
					`Gebbo throws junk crates. Stomp them for ${grabFish}. ${relicRupture} applies ${splinters} to the raid on every crate, and an unbroken crate after 25 seconds pulses again, so assign stomps. Carry the fish into melee of the explorer you want and press the extra action at roughly 90-95 Mor'zahi energy. That triggers that boss's ultimate and applies ${disgustingFish}, so they cannot be chosen again. Miss the feed and ${finalAscension} wipes the raid. Feed Gebbo first, then Nama, then Iku.`
				],
				phases: [
					{
						title: 'The council',
						body: [
							`Nama's ${shellSpin} is a three-shell frontal aimed at a random melee. Melee stay glued to her and bait it off the platform, then step out. It does not overlap ${mightyThud}. Iku's ${iceboundFlames} needs a two- or three-person kick rotation. The tank can help when they are in range. ${blinkNova} teleports Iku onto a ranged player and splits less damage the farther you run, so do not hug him.`,
							`Tanks swap after each ${shreddingShards} from Iku. Nama's ${steadyStrikes} ramps on whoever she is hitting, so the Nama tank holds personals at high stacks and moves her between Gebbo and Iku so you always cleave two without stacking all three. A death on Iku can cascade into ${cataclysmicInvocation}. A death on Nama can trigger ${relentlessEscalation}. ${relicRupture} applies ${splinters} to the whole raid whenever a crate lands, and an unbroken crate after 25 seconds pulses again. Assign stomps so a missed crate is not a second raid-wide bleed during a fish carry.`
						]
					},
					{
						title: 'Gebbo: Explosive Surprise',
						body: [
							`${explosiveSurprise} lights bomb players while bouncy mushrooms spawn. Drop bombs on the rim, away from mushrooms. A ${blastWave} then sweeps the floor. Wait until it is about to hit a mushroom and jump it. Mushrooms are consumed, but several people can use one if they enter together. Jumping a mushroom early strands the back of the raid. Keep stomping crates through this ultimate so ${relicRupture} does not pulse an unbroken box into the mushroom jump.`
						]
					},
					{
						title: 'Nama: Mighty Thud',
						body: [
							`${mightyThud} marks three players. Nama leaps in distance order. Each landing splits Physical damage in 6 yards and knocks. Place one soak in melee and two at separate ranged spots so the circles never overlap. Two teams (odds / evens) is enough: team one takes leaps 1 and 3, team two takes leap 2. Empty landings hit the whole raid.`
						]
					},
					{
						title: 'Iku: Frostfire Volley',
						body: [
							`${frostfireVolley} fires Fire missiles (ranged) and Frost missiles (melee) that must be spread to the rim. Each drop leaves a patch plus ${burningFlames} or ${piercingFrost}. Running the opposite element clears a patch and pulses the raid, so plan a healer cooldown for it. Do this last so you are not still soaking ${mightyThud} inside fire.`
						]
					}
				],
				kills: `${finalAscension} completing is the hard wipe. An early explorer death enrages the other two. Empty ${mightyThud} leaps, overlapping ${blinkNova}, and uncleared Frostfire patches create the mid-fight healing spikes. Tank deaths are ${steadyStrikes} left to ramp. ${unitedDefense} looks like the bosses simply stopped dying. A missed crate lets ${relicRupture} stack ${splinters} on the whole raid, which is how people drop before the feed.`,
				quick: {
					tanks: `Cleave Nama with one other explorer and keep the third more than 30 yards away. Swap ${shreddingShards}. Move Nama between Gebbo and Iku. Do not let all three stand inside ${unitedDefense}.`,
					healers: `${blinkNova} falls off with distance. Ramp ${mightyThud} soaks, the Frostfire clear, and raid-wide ${splinters} from ${relicRupture}.`,
					dps: `Assign crate stomps. Every crate applies ${splinters} to the raid, and an unbroken crate after 25 seconds pulses again. Grab the fish and feed Gebbo, then Nama, then Iku before ${finalAscension}. Interrupt ${iceboundFlames}. Bait ${shellSpin}. Soak ${mightyThud} as assigned. Cancel Frostfire patches with the opposite element.`
				},
				faqs: [
					{
						question: "How do you stop Mor'zahi?",
						answer: `Stomp Gebbo's junk for ${grabFish} and feed it to the possessed explorer at 90-95 energy. That spends their ultimate and applies ${disgustingFish}. Missing the feed lets ${finalAscension} finish.`
					},
					{
						question: 'Why do the explorers become immune?',
						answer: `${unitedDefense} grants 99% damage reduction when all three stand within 30 yards. Cleave two and keep the third farther out.`
					},
					{
						question: 'What is the feeding order?',
						answer: `Feed Gebbo first, then Nama, then Iku. Lust on pull so the last ultimate happens on a dying Iku, not a full-health council.`
					},
					{
						question: 'Do they have to die together?',
						answer: `Yes, or very close. They do not share health, but each death enrages the survivors. If you have to stagger, kill Gebbo first, then Nama, then Iku.`
					},
					{
						question: 'What is Relic Rupture?',
						answer: `Every crate applies ${splinters} to the raid. An unbroken crate after 25 seconds pulses again. Assign stomps. Keep feeding Gebbo, then Nama, then Iku. A missed crate is a second raid-wide bleed.`
					}
				]
			}
		},
		abilities: [
			{ name: 'Final Ascension', id: 1292780 },
			{ name: 'Mighty Thud', id: 1296092 },
			{ name: 'United Defense', id: 1297646 },
			{ name: 'Grab Fish', id: 1295441 },
			{ name: 'Disgusting Fish', id: 1296535 },
			{ name: 'Blink Nova', id: 1292793 },
			{ name: 'Frostfire Volley', id: 1295886 }
		]
	},
	{
		id: 2882,
		name: 'Vashnik the Malignant',
		slug: 'vashnik-the-malignant',
		raidId: 'venomous-abyss',
		teaser: 'Steer which fountains he Imbibes and kill living venom before it reaches the cavity.',
		guides: {
			heroic: {
				teaser:
					'Steer which fountains he Imbibes and kill living venom before it reaches the cavity.',
				intro: `Vashnik drinks the two nearest fountains every time he hits 100 energy. Tanks pick the pair by where they hold him. Every add that reaches the cavity triggers ${malignantBurst}.`,
				overview: [
					`Three fountains ring a Malignant Cavity in the floor: flame, blood, and shadow. ${imbibe} empowers the two closest, stacks an infusion that doubles that school of damage and inflates those adds' health, and lasts about 90 seconds. Never drink the same pair twice. Carry one fountain and add one new: flame and shadow, then shadow and blood, then blood and flame. The blood fountain sits farther back. Walk him all the way to it. Crossing the painted line still leaves flame and shadow closer, so he drinks those again.`,
					`Every drink spawns living venom that walks to the cavity. If any add arrives, ${malignantBurst} hits the raid. Adds that live about 60 seconds speed up and become crowd-control immune, so kill them on spawn. Kill order is fire (Burning Venoms), blood (Clotting Venom), then shadow (Shrouded Venoms). Stay loosely stacked near the boss so targeted infections do not have to run a marathon, and aim ${plagueFroth}'s cardinal waves away from the clump. Every ${catalyticBile} needs a player. Ranged stay spread around him so those soaks are covered.`
				],
				phases: [
					{
						title: 'Fountain of Flame',
						body: [
							`Flame ${imbibe} pulses ${conflagratingExpulsion} and spawns two Burning Venoms that tick the raid while alive. Grip them onto the other add type. Each death is a ${causticSurge} DoT, so desync fire deaths so the ticks do not stack. ${explodingInfection} is a giant fire circle with an arrow. Run out. Distance reduces raid damage. Healers can dispel once the runner is clear to pop it early.`
						]
					},
					{
						title: 'Fountain of Blood',
						body: [
							`Blood ${imbibe} pulses ${hemoExpulsion} and spawns one CC-immune Clotting Venom. It splits twice after death, and the children can be crowd-controlled. ${siphoningInfection} puts a healing absorb that player spells cannot cover. Allies stand in the circle so the victim can steal health.`
						]
					},
					{
						title: 'Fountain of Shadow',
						body: [
							`Shadow ${imbibe} pulses ${gloomExpulsion} and spawns five shielded Shrouded Venoms. Slow them and finish fire or blood first. Deaths drop ${umbralEjection} puddles. ${stygianInfection} trails bursts under the target. Keep moving, stay in heal range, and let healers chew the absorb.`
						]
					}
				],
				kills: `${imbibe} is the scripted raid hit. ${malignantBurst} fires if any venom reaches the cavity. Stacked ${causticSurge} from simultaneous fire deaths turns the next drink into a healer check. ${toxicVapor} turns later drinks into healer checks. ${plagueFroth} clips stacked groups. Tank deaths follow ${drippingFangs} without a swap. Missing the blood fountain re-empowers flame and shadow and snowballs the add health.`,
				quick: {
					tanks: `Face him away. Between drinks, hold him between the two fountains you want next. Walk him all the way to blood. Crossing the painted line is not far enough. Swap ${drippingFangs} on one stack. After the hit, help collapse adds.`,
					healers: `${toxicVapor} is the baseline. ${imbibe} and ${malignantBurst} are the peaks. Flame infections need a pre-heal on the runner. Blood infections need bodies in the circle. Shadow infections need absorbs broken while the player kites. Call staggered fire deaths so ${causticSurge} ticks do not stack.`,
					dps: `Kill venom before it reaches the cavity: fire, then blood, then shadow. Stagger Burning Venom deaths so ${causticSurge} does not stack. Finish clot splits. Spread ${plagueFroth} away from the clump. Every ${catalyticBile} needs a player, so ranged stay spread around him.`
				},
				faqs: [
					{
						question: 'What happens if venom reaches the center?',
						answer: `${malignantBurst} hits the raid. Kill every living venom on the way to the cavity.`
					},
					{
						question: 'How do you choose fountains?',
						answer: `He ${imbibe}s the two nearest fountains at 100 energy. Tanks hold him between the pair you want next, and never the same pair twice. Walk all the way to blood or he drinks flame and shadow again.`
					},
					{
						question: 'What is the add kill order?',
						answer: `Burning Venoms (fire) tick the raid, Clotting Venom (blood) splits, and Shrouded Venoms (shadow) can wait under slows. Fire first every time. Stagger those fire deaths so ${causticSurge} does not stack.`
					}
				]
			},
			mythic: {
				teaser: 'Aim Plague Froth through tumors, then kill venom before it reaches the cavity.',
				changes: [
					`Each ${imbibe} pulls Malignant Tumors wrapped in ${hardenedVenom}.`,
					`Aim ${plagueFroth} through tumors to strip that shield.`,
					`${malignantBurst} applies a one-minute stacking DoT.`
				],
				intro: `Vashnik drinks the two nearest fountains every time he hits 100 energy. Tanks pick the pair by where they hold him. Break Malignant Tumors with ${plagueFroth}. Every add that reaches the cavity triggers ${malignantBurst}.`,
				overview: [
					`Three fountains ring a Malignant Cavity in the floor: flame, blood, and shadow. ${imbibe} empowers the two closest, stacks an infusion that doubles that school of damage and inflates those adds' health, and lasts about 90 seconds. Each drink also pulls Malignant Tumors. They take 99% less damage from ${hardenedVenom} until a ${plagueWave} hits them. Aim ${plagueFroth} through tumors before you tunnel them. Never drink the same pair twice. Carry one fountain and add one new: flame and shadow, then shadow and blood, then blood and flame. The blood fountain sits farther back. Walk him all the way to it. Crossing the painted line still leaves flame and shadow closer, so he drinks those again.`,
					`Every drink spawns living venom that walks to the cavity. If any add arrives, ${malignantBurst} hits the raid and applies a one-minute stacking DoT. One leaked add ends the pull. Adds that live about 60 seconds speed up and become crowd-control immune, so kill them on spawn. Kill order is fire (Burning Venoms), blood (Clotting Venom), then shadow (Shrouded Venoms). Stay loosely stacked near the boss so targeted infections do not have to run a marathon. Every ${catalyticBile} needs a player. Ranged stay spread around him so those soaks are covered.`
				],
				phases: [
					{
						title: 'Fountain of Flame',
						body: [
							`Flame ${imbibe} pulses ${conflagratingExpulsion} and spawns two Burning Venoms that tick the raid while alive. Grip them onto the other add type. Each death is a ${causticSurge} DoT, so desync fire deaths so the ticks do not stack. This drink also pulls Malignant Tumors. Aim ${plagueFroth} through them to strip ${hardenedVenom} before you hard-target the tumor. ${explodingInfection} is a giant fire circle with an arrow. Run out. Distance reduces raid damage. Healers can dispel once the runner is clear to pop it early.`
						]
					},
					{
						title: 'Fountain of Blood',
						body: [
							`Blood ${imbibe} pulses ${hemoExpulsion} and spawns one CC-immune Clotting Venom. It splits twice after death, and the children can be crowd-controlled. Tumors spawn on this drink too. Hit them with ${plagueFroth} before you hard-target them. ${siphoningInfection} puts a healing absorb that player spells cannot cover. Allies stand in the circle so the victim can steal health.`
						]
					},
					{
						title: 'Fountain of Shadow',
						body: [
							`Shadow ${imbibe} pulses ${gloomExpulsion} and spawns five shielded Shrouded Venoms. Slow them and finish fire or blood first. Deaths drop ${umbralEjection} puddles. Tumors spawn on this drink too. Hit them with ${plagueFroth} before you tunnel them. ${stygianInfection} trails bursts under the target. Keep moving, stay in heal range, and let healers chew the absorb.`
						]
					}
				],
				kills: `${imbibe} is the scripted raid hit. ${malignantBurst} fires if any venom reaches the cavity, and the one-minute stacking DoT means a single leak ends the pull. Stacked ${causticSurge} from simultaneous fire deaths turns the next drink into a healer check. Tumors left in ${hardenedVenom} stall the add kill. ${toxicVapor} turns later drinks into healer checks. ${plagueFroth} clips stacked groups if you miss the tumor line. Tank deaths follow ${drippingFangs} without a swap. Missing the blood fountain re-empowers flame and shadow and snowballs the add health.`,
				quick: {
					tanks: `Face him away. Between drinks, hold him between the two fountains you want next. Walk him all the way to blood. Crossing the painted line is not far enough. Swap ${drippingFangs} on one stack. After the hit, help collapse adds.`,
					healers: `${toxicVapor} is the baseline. ${imbibe} and ${malignantBurst} are the peaks. A leaked add applies a one-minute stacking DoT. One leak ends the pull. Flame infections need a pre-heal on the runner. Blood infections need bodies in the circle. Shadow infections need absorbs broken while the player kites. Call staggered fire deaths so ${causticSurge} ticks do not stack.`,
					dps: `Aim ${plagueFroth} through Malignant Tumors to break ${hardenedVenom}, then kill venom before it reaches the cavity: fire, then blood, then shadow. Stagger Burning Venom deaths so ${causticSurge} does not stack. Finish clot splits. Every ${catalyticBile} needs a player, so ranged stay spread around him.`
				},
				faqs: [
					{
						question: 'What happens if venom reaches the center?',
						answer: `${malignantBurst} hits the raid and applies a one-minute stacking DoT. One leaked add ends the pull. Kill every living venom on the way to the cavity.`
					},
					{
						question: 'How do you choose fountains?',
						answer: `He ${imbibe}s the two nearest fountains at 100 energy. Tanks hold him between the pair you want next, and never the same pair twice. Walk all the way to blood or he drinks flame and shadow again.`
					},
					{
						question: 'What is the add kill order?',
						answer: `Burning Venoms (fire) tick the raid, Clotting Venom (blood) splits, and Shrouded Venoms (shadow) can wait under slows. Fire first every time. Stagger those fire deaths so ${causticSurge} does not stack.`
					},
					{
						question: 'How do you break Malignant Tumors?',
						answer: `Each ${imbibe} pulls tumors with ${hardenedVenom}. They take 99% less damage until a ${plagueWave} hits them. Aim ${plagueFroth} through the tumors before you tunnel them.`
					}
				]
			}
		},
		abilities: [
			{ name: 'Imbibe', id: 1283164 },
			{ name: 'Malignant Burst', id: 1280189 },
			{ name: 'Toxic Vapor', id: 1284561 },
			{ name: 'Dripping Fangs', id: 1280935 },
			{ name: 'Plague Froth', id: 1281907 }
		]
	},
	{
		id: 2871,
		name: 'Sszorak',
		slug: 'sszorak',
		raidId: 'venomous-abyss',
		teaser: 'Wind knockbacks off a platform, with a 25-second burn while he Digs In.',
		guides: {
			heroic: {
				teaser: 'Wind knockbacks off a platform, with a 25-second burn while he Digs In.',
				intro: `Sszorak is a single-target platform fight. The altar tells you the knockback order on pull. ${venomousSurge} drops the orbs you will need to bounce back to the middle during ${howlingMaelstrom}.`,
				overview: [
					`On pull, and after every intermission, wind motes light the tunnels around the Altar of Six Winds. That is the ${howlingMaelstrom} sequence. Mark the opposite pads and drop ${viscousCyst}s there from ${venomousSurge} so the later knockbacks have something to hit. ${howlingMaelstrom} is also the burn. ${digIn} makes him take 30% more damage for 25 seconds, about every two minutes.`,
					`Between storms you solve ${apexPredator} (a five-hit tank combo) and pair ${ragingCrosswinds}. ${venomousSurge} explodes harder the closer the raid is, so drop it on the marked pads, never in melee. Hold him on the rim so ${causticClaws} residue sits on the edge where the storm can push it off. Knockbacks are what kill people here.`
				],
				phases: [
					{
						title: 'Apex Predator',
						body: [
							`${apexPredator} is five hits in a random order: two ${ravage}, two ${mutilate}, one ${tempest}. ${tempest} is never first or last, which is why you can swap after the first ${ravage} or ${mutilate} and still get a taunt-DR reset in the ${tempest} gap. ${ravage} is a tank-only frontal. ${mutilate} is a split soak that applies 500% damage taken. Assign two groups of at least five so the same group does not soak twice. Dodge the ${tempest} tornadoes.`,
							`${venomousSurge} players drop cysts on the marked pads, one per pad. The explode hits harder the closer the raid is, so never let it pop in melee. Tanks keep him off those pads and hold him on the rim so ${causticClaws} residue can be shoved off later. ${ragingCrosswinds} assigns two push directions. Find the person with the opposite arrow and collide in mid-air so you bounce home. ${corrodingVenom} swaps around six stacks, which lines up with the combo.`
						]
					},
					{
						title: 'Howling Maelstrom',
						body: [
							`Stack middle before ${howlingMaelstrom}. Tunnels fire in mote order and throw the raid into the cyst you placed opposite that tunnel. The cyst bounce should send you back in. Dump cooldowns into ${digIn}. Ground pools that get shoved off the edge are gone, so residue belongs on the rim going into the storm. You get four cysts and three winds, so one cyst is spare. After the last gust, pop that leftover cyst as a group, then get off it. The next ${apexPredator} starts immediately.`
						]
					}
				],
				kills: `Deaths are knockbacks into cysts or off the platform during ${howlingMaelstrom}, and ${venomousSurge} exploding in melee. Tank deaths are ${corrodingVenom} without a swap, a ${ravage} that clipped the raid, or a ${mutilate} soak that stacked the 500% taken. Healers fall behind when Presence, Surge, and Crosswinds overlap with no cooldown.`,
				quick: {
					tanks: `Hold him on the rim so ${causticClaws} residue sits on the edge and ${howlingMaelstrom} can shove it off. Swap after the first ${ravage} or ${mutilate} in ${apexPredator}, and around six ${corrodingVenom}. Point ${ravage} out. Put ${mutilate} into the assigned soak group. Keep him off cyst pads.`,
					healers: `${ulateksPresence} is the baseline tick. The spike is ${venomousSurge} popping near the raid, then Crosswinds. Be ready for the ${howlingMaelstrom} scramble. ${mutilate} soaks take 500% damage, so cover those groups.`,
					dps: `Drop ${viscousCyst}s on the marked pads, not in melee. Pair opposite Crosswinds. Dodge ${tempest}. Soak ${mutilate} in your assigned group. Dump everything during ${digIn} in ${howlingMaelstrom}.`
				},
				faqs: [
					{
						question: 'When should you burst Sszorak?',
						answer: `During ${howlingMaelstrom} he gains ${digIn}: immune to forced movement and 30% more damage for 25 seconds. That is the cooldown window, about every two minutes.`
					},
					{
						question: 'What is the biggest wipe?',
						answer: `Knockbacks. ${ragingCrosswinds} and ${howlingMaelstrom} throw people into cysts or off the altar if the opposite pad was empty or you faced the wrong way.`
					},
					{
						question: 'How does Apex Predator work?',
						answer: `${apexPredator} is five hits: two ${ravage}, two ${mutilate}, one ${tempest}. Swap after the first ${ravage} or ${mutilate}. ${tempest} is never first or last, which creates the taunt reset. ${mutilate} applies 500% damage taken, so assign two groups of at least five. The same group cannot soak twice.`
					}
				]
			},
			mythic: {
				teaser:
					"Fourteen players soak Serpent's Fury, then dump into Dig In during Howling Maelstrom.",
				changes: [
					`${serpentsFury} fills a rage bar. Fourteen people soak it before 100, or ${unboundFerocity} wipes.`,
					`${ragingCrosswinds} uses all four cardinals.`
				],
				intro: `Sszorak is a single-target platform fight. The altar tells you the knockback order on pull. ${venomousSurge} drops the orbs you will need to bounce back to the middle during ${howlingMaelstrom}. ${serpentsFury} fills a rage bar that wipes the raid at 100 unless fourteen people spend it.`,
				overview: [
					`On pull, and after every intermission, wind motes light the tunnels around the Altar of Six Winds. That is the ${howlingMaelstrom} sequence. Mark the opposite pads and drop ${viscousCyst}s there from ${venomousSurge} so the later knockbacks have something to hit. ${howlingMaelstrom} is also the burn. ${digIn} makes him take 30% more damage for 25 seconds, about every two minutes.`,
					`Between storms you solve ${apexPredator} (a five-hit tank combo), pair ${ragingCrosswinds} on all four cardinals, and soak ${serpentsFury} before ${unboundFerocity}. ${venomousSurge} explodes harder the closer the raid is, so drop it on the marked pads, never in melee. Hold him on the rim so ${causticClaws} residue sits on the edge where the storm can push it off. Knockbacks are what kill people here.`
				],
				phases: [
					{
						title: 'Apex Predator',
						body: [
							`${apexPredator} is five hits in a random order: two ${ravage}, two ${mutilate}, one ${tempest}. ${tempest} is never first or last, which is why you can swap after the first ${ravage} or ${mutilate} and still get a taunt-DR reset in the ${tempest} gap. ${ravage} is a tank-only frontal. ${mutilate} is a split soak that applies 500% damage taken. Assign two groups of at least five so the same group does not soak twice. Dodge the ${tempest} tornadoes.`,
							`${serpentsFury} marks a player (often whoever is farthest) and fills a rage bar. At 100 he ${unboundFerocity} wipes. Fourteen people inside 8 yards of the mark spends the rage into ${toTheSlaughter}, a charge that applies ${virulence}. Spread after the soak so those beams do not bounce.`,
							`${venomousSurge} players drop cysts on the marked pads, one per pad. The explode hits harder the closer the raid is, so never let it pop in melee. Tanks keep him off those pads and hold him on the rim so ${causticClaws} residue can be shoved off later. ${ragingCrosswinds} uses all four cardinals. Pre-assign compass pairs, then collide in mid-air so you bounce home. ${corrodingVenom} swaps around six stacks, which lines up with the combo.`
						]
					},
					{
						title: 'Howling Maelstrom',
						body: [
							`Stack middle before ${howlingMaelstrom}. Tunnels fire in mote order and throw the raid into the cyst you placed opposite that tunnel. The cyst bounce should send you back in. Dump cooldowns into ${digIn}. Ground pools that get shoved off the edge are gone, so residue belongs on the rim going into the storm. You get four cysts and three winds, so one cyst is spare. After the last gust, pop that leftover cyst as a group, then get off it. The next ${apexPredator} starts immediately.`
						]
					}
				],
				kills: `Deaths are knockbacks into cysts or off the platform during ${howlingMaelstrom}, ${venomousSurge} exploding in melee, and ${unboundFerocity} when ${serpentsFury} hits 100. Tank deaths are ${corrodingVenom} without a swap, a ${ravage} that clipped the raid, or a ${mutilate} soak that stacked the 500% taken. Healers fall behind when Presence, Surge, Crosswinds, and ${toTheSlaughter} overlap with no cooldown.`,
				quick: {
					tanks: `Hold him on the rim so ${causticClaws} residue sits on the edge and ${howlingMaelstrom} can shove it off. Swap after the first ${ravage} or ${mutilate} in ${apexPredator}, and around six ${corrodingVenom}. Point ${ravage} out. Put ${mutilate} into the assigned soak group. Keep him off cyst pads.`,
					healers: `${ulateksPresence} is the baseline tick. The spike is ${venomousSurge} popping near the raid, then Crosswinds and the ${serpentsFury} clump. Be ready for the ${howlingMaelstrom} scramble. ${mutilate} soaks take 500% damage, so cover those groups.`,
					dps: `Drop ${viscousCyst}s on the marked pads, not in melee. Pre-assign compass pairs for four-cardinal Crosswinds. Fourteen people soak ${serpentsFury} inside 8 yards before ${unboundFerocity}. Dodge ${tempest}. Soak ${mutilate} in your assigned group. Dump everything during ${digIn} in ${howlingMaelstrom}.`
				},
				faqs: [
					{
						question: 'When should you burst Sszorak?',
						answer: `During ${howlingMaelstrom} he gains ${digIn}: immune to forced movement and 30% more damage for 25 seconds. That is the cooldown window, about every two minutes.`
					},
					{
						question: 'What is the biggest wipe?',
						answer: `Knockbacks, and ${unboundFerocity} if ${serpentsFury} reaches 100. ${ragingCrosswinds} and ${howlingMaelstrom} throw people into cysts or off the altar if the opposite pad was empty or you faced the wrong way.`
					},
					{
						question: 'How does Apex Predator work?',
						answer: `${apexPredator} is five hits: two ${ravage}, two ${mutilate}, one ${tempest}. Swap after the first ${ravage} or ${mutilate}. ${tempest} is never first or last, which creates the taunt reset. ${mutilate} applies 500% damage taken, so assign two groups of at least five. The same group cannot soak twice.`
					},
					{
						question: "How do you spend Serpent's Fury?",
						answer: `${serpentsFury} marks a player and fills a rage bar. Fourteen people inside 8 yards of the mark spends it into ${toTheSlaughter}, a charge that applies ${virulence}. Spread so those beams do not bounce. At 100 rage he ${unboundFerocity} wipes.`
					}
				]
			}
		},
		abilities: [
			{ name: 'Howling Maelstrom', id: 1285732 },
			{ name: 'Venomous Surge', id: 1305959 },
			{ name: 'Apex Predator', id: 1277025 },
			{ name: 'Raging Crosswinds', id: 1285419 },
			{ name: 'Corroding Venom', id: 1282869 },
			{ name: "Ula'tek's Presence", id: 1285961 },
			{ name: 'Dig In', id: 1286033 }
		]
	},
	{
		id: 2887,
		name: 'The Twin Fangs',
		slug: 'the-twin-fangs',
		raidId: 'venomous-abyss',
		teaser: 'Eternal Venom only comes off in Ravenous Feast. Kill Vexhul and Ithraz together.',
		guides: {
			heroic: {
				teaser: 'Eternal Venom only comes off in Ravenous Feast. Kill Vexhul and Ithraz together.',
				intro: `Vexhul and Ithraz do not share health and cannot be moved. Almost every green ability applies ${eternalVenom}, a stacking DoT that never falls off on its own and kills at 10 stacks. ${ravenousFeast} is the only cleanse. Kill them in the same window. The survivor gains ${uncoiledWrath} and ramps.`,
				overview: [
					`${eternalVenom} is the whole encounter. Soak ${ravenousFeast} to strip one stack per hit. Each hit applies ${feasted} and knocks you back, so the same player cannot soak twice. Use three assigned groups, one soak each. Face the knock into safe ground.`,
					`They ${submerge} after two main-phase cycles. The third ${submerge} is the practical enrage: the floor is gone, and ${uncoiledWrath} will have already started if the health bars diverged. They cannot be moved, so spread loosely around both. Lust on pull. Keep them within a few percent and kill them in the same window.`
				],
				phases: [
					{
						title: 'Vexhul',
						body: [
							`${causticDeluge} is a tank pushback beam. The tank must stay in range while globules spawn. Low-stack players soak those orbs, one at a time. ${venomousEmergence} plants three Spawn of Vexhul in the middle. They pulse a stack on spawn and cast ${corrosiveSpit} beams. Plant after a one-second adjust so the raid can sidestep. ${stirTheDepths} sends slow waves across the floor. Each hit is another stack. Tanks never leave melee, even when adds are up.`
						]
					},
					{
						title: 'Ithraz',
						body: [
							`${stoneBreaker} knocks the tank and drops three sequential soaks. Eat all three in spawn order or the platform slams the raid, then taunt-swap. ${coilingIchor} players walk to the rim. The circle shrinks, so you can tighten drops as it expires. ${ravenousFeast} is three split soaks. Each hit strips one ${eternalVenom}, applies ${feasted}, and knocks. Use three assigned groups, one soak each, and face the knock into safe ground. ${eternalVenom} kills at 10 stacks, so call high-stack players into the next feast.`
						]
					},
					{
						title: 'Submerge',
						body: [
							`Both snakes dive. Orbs around Vexhul telegraph which way ${vileFlood} will rotate. The beam always starts on Vexhul's tank, so the raid can skip it by moving the other way. Ithraz rains ${sanguineStorm} while you circle. ${congealedGore} pools snare 60%, so walking into your own Ichor drops during the beam is how people die. After three phases you are out of floor.`
						]
					}
				],
				kills: `People die to ${eternalVenom} at 10 stacks, or to a second ${ravenousFeast} soak while ${feasted}. ${stoneBreaker} hitting nobody slams everyone. ${vileFlood} plus ${sanguineStorm} is the largest overlap, especially through ${congealedGore} snares. Late deaths are ${uncoiledWrath} after one snake died first.`,
				quick: {
					tanks: `Stay in melee on both, even during adds. Soak every ${stoneBreaker} in order, then swap. On ${causticDeluge}, stay in range while globules spawn.`,
					healers: `${eternalVenom} ticks harder as stacks climb, so put extra healing on loaded players. Ramp each ${ravenousFeast} soak. ${toxicFumes} is constant chip under the big overlaps.`,
					dps: `Kill ${venomousEmergence} spawn first. Dodge waves. Cleave both so they die together before the third ${submerge}.`
				},
				faqs: [
					{
						question: 'How do you remove Eternal Venom?',
						answer: `Stand in one ${ravenousFeast} hit. Each strike removes one stack of ${eternalVenom}, applies ${feasted}, and knocks you back, so the same player cannot soak twice. Use three assigned groups.`
					},
					{
						question: 'Should you kill one Twin Fang first?',
						answer: `No. They do not share health. The survivor gains ${uncoiledWrath} and ramps. Kill them together, and finish both before the third ${submerge}.`
					},
					{
						question: 'Which way do you run during Submerge?',
						answer: `Read Vexhul's rotating orbs, then move opposite the Vexhul tank. The beam starts on that tank. Going the other way skips the first sweep. Do not walk into ${congealedGore} from your own Ichor drops.`
					}
				]
			},
			mythic: {
				teaser:
					'Feast soaks drop Tainted Blood. Strip Eternal Venom and kill both snakes together.',
				changes: [
					`${eternalVenom} kills at 9 stacks.`,
					`Each ${ravenousFeast} soak knocks and drops ${taintedBloodTwins}. That group soaks the puddles within eight seconds.`,
					`Deaths spawn ${barbedBulwark} globules.`,
					`${rouseTheBrood} needs assigned interrupts.`
				],
				intro: `Vexhul and Ithraz do not share health and cannot be moved. Almost every green ability applies ${eternalVenom}, a stacking DoT that never falls off on its own and kills at 9 stacks. ${ravenousFeast} is the only cleanse. Kill them in the same window. The survivor gains ${uncoiledWrath} and ramps.`,
				overview: [
					`${eternalVenom} is the whole encounter. Soak ${ravenousFeast} to strip one stack per hit. Each hit applies ${feasted} and knocks you back, so the same player cannot soak twice. Use three assigned groups, one soak each. That knock drops ${taintedBloodTwins}. The group that just soaked has eight seconds to soak those puddles.`,
					`They ${submerge} after two main-phase cycles. The third ${submerge} is the practical enrage: the floor is gone, and ${uncoiledWrath} will have already started if the health bars diverged. They cannot be moved, so spread loosely around both. Lust on pull. Keep them within a few percent and kill them in the same window. Dying with ${eternalVenom} spawns extra globules, so a messy death snowballs the soak plan.`
				],
				phases: [
					{
						title: 'Vexhul',
						body: [
							`${causticDeluge} is a tank pushback beam. The tank must stay in range while globules spawn. Low-stack players soak those orbs, one at a time. Dying with ${eternalVenom} spawns extra globules. Those globules gain ${barbedBulwark} and must be interrupted before they are soakable. ${rouseTheBrood} adds spawn on the bosses and need assigned interrupts. ${venomousEmergence} plants three Spawn of Vexhul in the middle. They pulse a stack on spawn and cast ${corrosiveSpit} beams. Plant after a one-second adjust so the raid can sidestep. ${stirTheDepths} sends slow waves across the floor. Each hit is another stack. Tanks never leave melee, even when adds are up.`
						]
					},
					{
						title: 'Ithraz',
						body: [
							`${stoneBreaker} knocks the tank and drops three sequential soaks. Eat all three in spawn order or the platform slams the raid, then taunt-swap. ${coilingIchor} players walk to the rim. The circle shrinks, so you can tighten drops as it expires. ${ravenousFeast} is three split soaks. Each hit strips one ${eternalVenom}, applies ${feasted}, knocks, and drops ${taintedBloodTwins} that the knocked group has eight seconds to soak. Use three assigned groups, one feast each. ${eternalVenom} kills at 9 stacks, so call high-stack players into the next feast.`
						]
					},
					{
						title: 'Submerge',
						body: [
							`Both snakes dive. Orbs around Vexhul telegraph which way ${vileFlood} will rotate. The beam always starts on Vexhul's tank, so the raid can skip it by moving the other way. Ithraz rains ${sanguineStorm} while you circle. ${congealedGore} pools snare 60%, so walking into your own Ichor drops during the beam is how people die. After three phases you are out of floor.`
						]
					}
				],
				kills: `People die to ${eternalVenom} at 9 stacks, to a second ${ravenousFeast} soak while ${feasted}, or to ${taintedBloodTwins} left on the floor. Deaths spawn extra globules behind ${barbedBulwark}. ${stoneBreaker} hitting nobody slams everyone. Unkicked ${rouseTheBrood} adds stall the bosses. ${vileFlood} plus ${sanguineStorm} is the largest overlap, especially through ${congealedGore} snares. Late deaths are ${uncoiledWrath} after one snake died first.`,
				quick: {
					tanks: `Stay in melee on both, even during adds. Soak every ${stoneBreaker} in order, then swap. On ${causticDeluge}, stay in range while globules spawn.`,
					healers: `${eternalVenom} ticks harder as stacks climb, so put extra healing on loaded players. Ramp each ${ravenousFeast} soak and the ${taintedBloodTwins} that drop after the knock. ${toxicFumes} is constant chip under the big overlaps.`,
					dps: `Interrupt globules behind ${barbedBulwark}. Interrupt ${rouseTheBrood}. Kill ${venomousEmergence} spawn first. Dodge waves. Cleave both so they die together before the third ${submerge}.`
				},
				faqs: [
					{
						question: 'How do you remove Eternal Venom?',
						answer: `Stand in one ${ravenousFeast} hit. Each strike removes one stack of ${eternalVenom}, applies ${feasted}, and knocks you back, so the same player cannot soak twice. Use three assigned groups. After the knock, that group soaks ${taintedBloodTwins} within eight seconds.`
					},
					{
						question: 'Should you kill one Twin Fang first?',
						answer: `No. They do not share health. The survivor gains ${uncoiledWrath} and ramps. Kill them together, and finish both before the third ${submerge}.`
					},
					{
						question: 'Which way do you run during Submerge?',
						answer: `Read Vexhul's rotating orbs, then move opposite the Vexhul tank. The beam starts on that tank. Going the other way skips the first sweep. Do not walk into ${congealedGore} from your own Ichor drops.`
					},
					{
						question: 'What happens if someone dies with Eternal Venom?',
						answer: `Dying with ${eternalVenom} spawns extra globules. Those globules gain ${barbedBulwark} and must be interrupted before they are soakable. ${rouseTheBrood} adds on the bosses also need assigned interrupts.`
					}
				]
			}
		},
		abilities: [
			{ name: 'Ravenous Feast', id: 1290516 },
			{ name: 'Eternal Venom', id: 1290336 },
			{ name: 'Caustic Deluge', id: 1289192 },
			{ name: 'Venomous Emergence', id: 1291404 },
			{ name: 'Stone Breaker', id: 1288538 },
			{ name: 'Vile Flood', id: 1293749 },
			{ name: 'Sanguine Storm', id: 1306872 },
			{ name: 'Uncoiled Wrath', id: 1308583 }
		]
	},
	{
		id: 2883,
		name: 'The Coiled Altar',
		slug: 'the-coiled-altar',
		raidId: 'venomous-abyss',
		teaser:
			"Zul'jan's axes, then Hex Lord Malacrass. Break Twilight Veil before Eternal Nightfall.",
		guides: {
			heroic: {
				teaser:
					"Zul'jan's axes, then Hex Lord Malacrass. Break Twilight Veil before Eternal Nightfall.",
				intro: `Two acts, then both kits at once. Zul'jan is a stacked-cleave axe fight. Hex Lord Malacrass is shields, ghosts, and an interrupt you cannot take until the veil is gone. The last stretch is a ${soulbinding} race.`,
				overview: [
					`Stay near Zul'jan. Incoming damage is high enough that a spread raid just dies to ${fangsOfTheCoiledAltar}. Collect ${coalescedVenom} to a dump pad, then have the tank erase the pile with ${sever}. ${venomRupture} is a stacking DoT, so do not detonate the whole dump at once unless healers called it. ${ritualOfTheFang} is the 4-second channel from the altar itself. Intercept those beams or he drinks them. Leftover orbs explode when he dies, so do not transition on a fresh ${toxicDeluge}.`,
					`Malacrass uses the same stacked raid, but now you break ${dreadmarch} shields, face ${manifestationOfDread} adds, and cut them down with ${soulSever}. They only walk when you look away. ${eternalNightfall} only interrupts after ${veilOfTwilight} is broken. Bloodlust the ${soulbinding} intermission, when Zul'jan takes double damage, then finish both together in Phase 3.`
				],
				phases: [
					{
						title: 'Phase 1',
						body: [
							`${toxicDeluge} drops green circles that become ${coalescedVenom}. Assigned runners pick them up, park on the dump pad, and drop when ${volatileVenom} expires. Each pop is ${venomRupture}, a stacking DoT, so do not detonate the whole dump at once unless healers called it. ${sever} is a tank frontal that also destroys orbs in the cone and applies a taken-increase. Aim it through the dump, then taunt-swap. ${guillotine} needs two half-raid groups because ${guillotined} is 500% taken. ${widowsKiss} is the follow-up circle: soak, then leave. Dispel ${venomfang}. Watch ${axegrinder} lanes while you do all of that.`
						]
					},
					{
						title: 'Phase 2',
						body: [
							`Stack slightly off-center behind him. ${dreadmarch} mind-controls players toward the nearest edge under an absorb. Breaking it spawns ${manifestationOfDread} adds. Grips and knockbacks help hold those players. Fixated players steer their add to the dump, then stare at it to freeze it. Manifestations reapply ${dreadmarch} if they reach you. ${soulSever} is ${sever} plus three Soul Fragments the tank must reclaim or they die. ${gloombomb} ranged circles explode and apply ${gravebound}. Run out, then collect fragments.`,
							`${spiritcackle} adds a ${wailOfTerror} caster that teleports when interrupted. Ranged should kill it before it walks into melee. When the veil goes up, swap to shield damage, then interrupt ${eternalNightfall} as late as you safely can. A Nightfall with the veil still up is a wipe. Clear remaining Manifestations before he dies so they do not knock people off in the transition.`
						]
					},
					{
						title: 'Intermission',
						body: [
							`Malacrass links to Zul'jan. ${ghastlyRegeneration} heals Zul'jan while he takes 100% more damage. Lust, potions, everything. Fragments of Malacrass walk in and ${reclaimEssence} if they land. Intercepting one is ${spiritErasure} (raid-wide). Stagger soaks. If the raid is too low, skip a fragment and eat the heal rather than a chain-wipe.`
						]
					},
					{
						title: 'Phase 3',
						body: [
							`Both kits run at once. They do not share health. Balance their bars and kill them in the same window. The survivor enrages. Stack them for cleave. The new failure is a ${guillotine} and a ${dreadmarch} landing in the same space.`
						]
					}
				],
				kills: `Phase 1 deaths are ${sever} on the raid, ${axegrinder} lanes, a whole dump detonating ${venomRupture} at once, overlapping ${guillotined} soaks, and leftover orbs exploding on the transition. Phase 2 wipes are ${dreadmarch} walking people off, Manifestations reapplying it, ${eternalNightfall} landing with ${veilOfTwilight} up, or ${soulbinding} finishing. Tank deaths are ${chopDown} or ${soulSever} eaten as a group.`,
				quick: {
					tanks: `Face both bosses away. Intercept ${ritualOfTheFang}. Aim ${sever} and ${soulSever} through orbs and Manifestations, then swap. Collect Soul Fragments immediately.`,
					healers: `Ramp ${fangsOfTheCoiledAltar}, staggered ${venomRupture} pops, split ${guillotine} groups, and ${eternalNightfall}. Break ${dreadmarch} shields before those players walk off. Stagger ${spiritErasure} soaks.`,
					dps: `Collect venom to the dump and pop it in waves. Dodge ${axegrinder}. Herd Manifestations into ${soulSever}. Kill the ${spiritcackle} caster at range. Break ${veilOfTwilight}, interrupt ${eternalNightfall}, soak Fragments, and kill both bosses together before ${soulbinding} completes.`
				},
				faqs: [
					{
						question: 'Who do you fight on The Coiled Altar?',
						answer: `Zul'jan first, then Hex Lord Malacrass. ${soulbinding} is the lust window. Phase 3 uses both kits. They do not share health. Kill them together. The survivor enrages.`
					},
					{
						question: 'How do you stop Eternal Nightfall?',
						answer: `Destroy ${veilOfTwilight}, then interrupt. If the veil is still up, the hit is a wipe.`
					},
					{
						question: 'Where does Bloodlust go?',
						answer: `${soulbinding}, when Zul'jan takes 100% increased damage.`
					}
				]
			},
			mythic: {
				teaser:
					'Kill Virulent Mutation, rotate collectors, then lust Soulbinding before it finishes.',
				changes: [
					`Kill ${virulentMutation}.`,
					`${volatileVenom} applies ${taintedBloodAltar}. Rotate collectors.`,
					`Manifestations are only visible to their fixate. Two touching is ${malevolentResonance}.`,
					`${guillotined} pads and ${axegrinder} lanes never despawn.`
				],
				intro: `Two acts, then both kits at once. Zul'jan is a stacked-cleave axe fight with mutating orbs and a shrinking floor. Hex Lord Malacrass is shields, ghosts only their fixate can see, and an interrupt you cannot take until the veil is gone. The last stretch is a ${soulbinding} race.`,
				overview: [
					`Stay near Zul'jan. Incoming damage is high enough that a spread raid just dies to ${fangsOfTheCoiledAltar}. Collect ${coalescedVenom} to a dump pad, then have the tank erase the pile with ${sever}. ${volatileVenom} applies ${taintedBloodAltar}, so rotate collectors. ${venomRupture} is a stacking DoT, so do not detonate the whole dump at once unless healers called it. A ${virulentMutation} among the venom orbs launches two extra globules every six seconds. Kill it. Some orbs mutate and pulse the raid. ${ritualOfTheFang} is the 4-second channel from the altar itself. Intercept those beams or he drinks them. Leftover orbs explode when he dies, so do not transition on a fresh ${toxicDeluge}.`,
					`Malacrass uses the same stacked raid, but now you break ${dreadmarch} shields, face ${manifestationOfDread} adds that only their fixate can see, and cut them down with ${soulSever}. They only walk when you look away. Two adds touching is ${malevolentResonance}. ${eternalNightfall} only interrupts after ${veilOfTwilight} is broken. Bloodlust the ${soulbinding} intermission, when Zul'jan takes double damage, then finish both together in Phase 3.`
				],
				phases: [
					{
						title: 'Phase 1',
						body: [
							`${toxicDeluge} drops green circles that become ${coalescedVenom}. Assigned runners pick them up, park on the dump pad, and drop when ${volatileVenom} expires. ${volatileVenom} applies ${taintedBloodAltar}, so rotate collectors. Each pop is ${venomRupture}, a stacking DoT, so do not detonate the whole dump at once unless healers called it. A ${virulentMutation} among the orbs launches two extra globules every six seconds. Kill it. Some orbs mutate and pulse the raid. ${sever} is a tank frontal that also destroys orbs in the cone and applies a taken-increase. Aim it through the dump, then taunt-swap. ${guillotine} needs two half-raid groups because ${guillotined} is 500% taken. ${guillotined} and ${axegrinder} stay on the floor and shrink the space you have left. ${widowsKiss} is the follow-up circle: soak, then leave. Dispel ${venomfang}.`
						]
					},
					{
						title: 'Phase 2',
						body: [
							`Stack slightly off-center behind him. ${dreadmarch} mind-controls players toward the nearest edge under an absorb. Breaking it spawns ${manifestationOfDread} adds that are visible only to their fixate. Two adds touching is ${malevolentResonance}. Grips and knockbacks help hold those players. Fixated players steer their add to the dump, then stare at it to freeze it. Manifestations reapply ${dreadmarch} if they reach you. ${soulSever} is ${sever} plus three Soul Fragments the tank must reclaim or they die. ${gloombomb} ranged circles explode and apply ${gravebound}. Run out, then collect fragments. ${gloombomb} is also how you break the ${spiritcackle} Soulcoiler's 99% shield.`,
							`${spiritcackle} adds a ${wailOfTerror} caster that teleports when interrupted. Ranged should kill it before it walks into melee, after the shield is broken. When the veil goes up, swap to shield damage, then interrupt ${eternalNightfall} as late as you safely can. A Nightfall with the veil still up is a wipe. Clear remaining Manifestations before he dies so they do not knock people off in the transition.`
						]
					},
					{
						title: 'Intermission',
						body: [
							`Malacrass links to Zul'jan. ${ghastlyRegeneration} heals Zul'jan while he takes 100% more damage. Lust, potions, everything. Fragments of Malacrass walk in and ${reclaimEssence} if they land. Intercepting one is ${spiritErasure} (raid-wide). Stagger soaks. If the raid is too low, skip a fragment and eat the heal rather than a chain-wipe.`
						]
					},
					{
						title: 'Phase 3',
						body: [
							`Both kits run at once. They do not share health. Balance their bars and kill them in the same window. The survivor enrages. Stack them for cleave. ${guillotined} pads and ${axegrinder} lanes that never despawn make that stack tighter. The new failure is a ${guillotine} and a ${dreadmarch} landing in the same space.`
						]
					}
				],
				kills: `Phase 1 deaths are ${sever} on the raid, leftover ${axegrinder} lanes, a whole dump detonating ${venomRupture} at once, overlapping ${guillotined} soaks, an unkilled ${virulentMutation}, and leftover orbs exploding on the transition. Phase 2 wipes are ${dreadmarch} walking people off, two Manifestations touching for ${malevolentResonance}, ${eternalNightfall} landing with ${veilOfTwilight} up, or ${soulbinding} finishing. Tank deaths are ${chopDown} or ${soulSever} eaten as a group.`,
				quick: {
					tanks: `Face both bosses away. Intercept ${ritualOfTheFang}. Aim ${sever} and ${soulSever} through orbs and Manifestations, then swap. Collect Soul Fragments immediately.`,
					healers: `Ramp ${fangsOfTheCoiledAltar}, staggered ${venomRupture} pops, split ${guillotine} groups, and ${eternalNightfall}. Break ${dreadmarch} shields before those players walk off. Stagger ${spiritErasure} soaks. Call ${malevolentResonance} if two unseen adds are about to touch.`,
					dps: `Rotate collectors because ${volatileVenom} applies ${taintedBloodAltar}. Kill ${virulentMutation}. Dodge ${axegrinder} lanes that stay down. Herd Manifestations you can see into ${soulSever}, and keep them apart. ${gloombomb} breaks the ${spiritcackle} Soulcoiler's 99% shield. Break ${veilOfTwilight}, interrupt ${eternalNightfall}, soak Fragments, and kill both bosses together before ${soulbinding} completes.`
				},
				faqs: [
					{
						question: 'Who do you fight on The Coiled Altar?',
						answer: `Zul'jan first, then Hex Lord Malacrass. ${soulbinding} is the lust window. Phase 3 uses both kits. They do not share health. Kill them together. The survivor enrages.`
					},
					{
						question: 'How do you stop Eternal Nightfall?',
						answer: `Destroy ${veilOfTwilight}, then interrupt. If the veil is still up, the hit is a wipe.`
					},
					{
						question: 'Where does Bloodlust go?',
						answer: `${soulbinding}, when Zul'jan takes 100% increased damage.`
					},
					{
						question: 'What is Virulent Mutation?',
						answer: `A ${virulentMutation} among the venom orbs launches two extra globules every six seconds. Kill it. Some orbs mutate and pulse the raid. ${volatileVenom} also applies ${taintedBloodAltar}, so rotate collectors.`
					},
					{
						question: 'Why can I not see Manifestations?',
						answer: `Phase 2 Manifestations are visible only to their fixate. Two adds touching is ${malevolentResonance}. Call positions out loud, and use ${gloombomb} to break the ${spiritcackle} Soulcoiler's 99% shield.`
					}
				]
			}
		},
		abilities: [
			{ name: 'Ritual of the Fang', id: 1300876 },
			{ name: 'Eternal Nightfall', id: 1286918 },
			{ name: 'Dreadmarch', id: 1285643 },
			{ name: 'Soul Sever', id: 1286573 },
			{ name: 'Soulbinding', id: 1304032 },
			{ name: 'Veil of Twilight', id: 1286912 },
			{ name: 'Axegrinder', id: 1283832 },
			{ name: 'Chop Down', id: 1301350 }
		]
	},
	{
		id: 2895,
		name: "Ula'tek",
		slug: 'ulatek',
		raidId: 'venomous-abyss',
		teaser: 'This fight was not on the PTR. The guide will be updated as soon as it is tested.',
		guides: {
			heroic: {
				teaser: 'This fight was not on the PTR. The guide will be updated as soon as it is tested.',
				intro: `Ula'tek is the Season 2 finale. This encounter was not on the PTR, so there is no tested walkthrough yet. We will update this page as soon as possible.`,
				overview: [
					`PTR testing never opened Ula'tek. Check back here for the Heroic plan once we have logs and a repeatable strategy.`
				],
				kills: '',
				faqs: [
					{
						question: "Was Ula'tek on the PTR?",
						answer: `No. This encounter was not on the PTR, so there is no tested walkthrough yet. We will update this page as soon as possible.`
					},
					{
						question: "Is there a Heroic Ula'tek strategy yet?",
						answer: `Not yet. Check back here for the Heroic plan once we have logs and a repeatable strategy.`
					}
				]
			},
			mythic: {
				teaser:
					'PTR never opened this encounter. The Mythic guide will be updated as soon as it is tested.',
				intro: `Ula'tek is the Season 2 finale. This encounter was not on the PTR, so there is no tested walkthrough yet. We will update this page as soon as possible.`,
				overview: [
					`PTR testing never opened Ula'tek, and no Mythic journal notes survived. Check back here for the Mythic plan once we have logs and a repeatable strategy.`
				],
				kills: '',
				faqs: [
					{
						question: "Was Ula'tek on the PTR?",
						answer: `No. PTR testing never opened this encounter, and no Mythic journal notes survived. We will update this page as soon as possible.`
					},
					{
						question: "Is there a Mythic Ula'tek strategy yet?",
						answer: `Not yet. Check back here for the Mythic plan once we have logs and a repeatable strategy.`
					}
				]
			}
		},
		abilities: [
			{ name: 'Caustic Waves', id: 1292403 },
			{ name: 'Rage of the Shackled', id: 1286860 },
			{ name: 'Spectral Coils', id: 1287265 },
			{ name: 'Circling Prey', id: 1301510 },
			{ name: "Mother's Wrath", id: 1298367 },
			{ name: 'Putrid Membrane', id: 1301268 },
			{ name: 'Venomous Heart', id: 1299526 }
		]
	}
];
