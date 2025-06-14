// src/realms.ts

export const usRealmOptions: Array<{ value: string; label: string }> = [
	{ value: 'gurubashi', label: 'Gurubashi' },
	{ value: 'skywall', label: 'Skywall' },
	{ value: 'dalaran', label: 'Dalaran' },
	{ value: 'garona', label: 'Garona' },
	{ value: 'thunderlord', label: 'Thunderlord' },
	{ value: 'dunemaul', label: 'Dunemaul' },
	{ value: 'azjolnerub', label: 'Azjol-Nerub' },
	{ value: 'firetree', label: 'Firetree' },
	{ value: 'runetotem', label: 'Runetotem' },
	{ value: 'grizzly-hills', label: 'Grizzly Hills' },
	{ value: 'galakrond', label: 'Galakrond' },
	{ value: 'dawnbringer', label: 'Dawnbringer' },
	{ value: 'draenor', label: 'Draenor' },
	{ value: 'sisters-of-elune', label: 'Sisters of Elune' },
	{ value: 'cenarion-circle', label: 'Cenarion Circle' },
	{ value: 'aggramar', label: 'Aggramar' },
	{ value: 'draktharon', label: "Drak'Tharon" },
	{ value: 'ravencrest', label: 'Ravencrest' },
	{ value: 'windrunner', label: 'Windrunner' },
	{ value: 'scarlet-crusade', label: 'Scarlet Crusade' },
	{ value: 'stormreaver', label: 'Stormreaver' },
	{ value: 'elune', label: 'Elune' },
	{ value: 'shattered-hand', label: 'Shattered Hand' },
	{ value: 'bleeding-hollow', label: 'Bleeding Hollow' },
	{ value: 'trollbane', label: 'Trollbane' },
	{ value: 'winterhoof', label: 'Winterhoof' },
	{ value: 'maiev', label: 'Maiev' },
	{ value: 'muradin', label: 'Muradin' },
	{ value: 'veknilash', label: "Vek'nilash" },
	{ value: 'senjin', label: "Sen'jin" },
	{ value: 'skullcrusher', label: 'Skullcrusher' },
	{ value: 'argent-dawn', label: 'Argent Dawn' },
	{ value: 'destromath', label: 'Destromath' },
	{ value: 'gorgonnash', label: 'Gorgonnash' },
	{ value: 'dethecus', label: 'Dethecus' },
	{ value: 'bonechewer', label: 'Bonechewer' },
	{ value: 'dragonmaw', label: 'Dragonmaw' },
	{ value: 'silvermoon', label: 'Silvermoon' },
	{ value: 'terenas', label: 'Terenas' },
	{ value: 'gorefiend', label: 'Gorefiend' },
	{ value: 'lightnings-blade', label: "Lightning's Blade" },
	{ value: 'eonar', label: 'Eonar' },
	{ value: 'kargath', label: 'Kargath' },
	{ value: 'llane', label: 'Llane' },
	{ value: 'earthen-ring', label: 'Earthen Ring' },
	{ value: 'laughing-skull', label: 'Laughing Skull' },
	{ value: 'burning-legion', label: 'Burning Legion' },
	{ value: 'malygos', label: 'Malygos' },
	{ value: 'thunderhorn', label: 'Thunderhorn' },
	{ value: 'dragonblight', label: 'Dragonblight' },
	{ value: 'uldum', label: 'Uldum' },
	{ value: 'hellscream', label: 'Hellscream' },
	{ value: 'kilrogg', label: 'Kilrogg' },
	{ value: 'spinebreaker', label: 'Spinebreaker' },
	{ value: 'eitrigg', label: 'Eitrigg' },
	{ value: 'nathrezim', label: 'Nathrezim' },
	{ value: 'feathermoon', label: 'Feathermoon' },
	{ value: 'bloodscalp', label: 'Bloodscalp' },
	{ value: 'rivendare', label: 'Rivendare' },
	{ value: 'nordrassil', label: 'Nordrassil' },
	{ value: 'cairne', label: 'Cairne' },
	{ value: 'shandris', label: 'Shandris' },
	{ value: 'moon-guard', label: 'Moon Guard' },
	{ value: 'nazgrel', label: 'Nazgrel' },
	{ value: 'hydraxis', label: 'Hydraxis' },
	{ value: 'lightbringer', label: 'Lightbringer' },
	{ value: 'uther', label: 'Uther' },
	{ value: 'proudmoore', label: 'Proudmoore' },
	{ value: 'cenarius', label: 'Cenarius' },
	{ value: 'blackrock', label: 'Blackrock' },
	{ value: 'silver-hand', label: 'Silver Hand' },
	{ value: 'doomhammer', label: 'Doomhammer' },
	{ value: 'icecrown', label: 'Icecrown' },
	{ value: 'kelthuzad', label: "Kel'Thuzad" },
	{ value: 'frostmane', label: 'Frostmane' },
	{ value: 'madoran', label: 'Madoran' },
	{ value: 'azuremyst', label: 'Azuremyst' },
	{ value: 'auchindoun', label: 'Auchindoun' },
	{ value: 'coilfang', label: 'Coilfang' },
	{ value: 'shattered-halls', label: 'Shattered Halls' },
	{ value: 'blood-furnace', label: 'Blood Furnace' },
	{ value: 'the-underbog', label: 'The Underbog' },
	{ value: 'terokkar', label: 'Terokkar' },
	{ value: 'blades-edge', label: "Blade's Edge" },
	{ value: 'exodar', label: 'Exodar' },
	{ value: 'area-52', label: 'Area 52' },
	{ value: 'zangarmarsh', label: 'Zangarmarsh' },
	{ value: 'fizzcrank', label: 'Fizzcrank' },
	{ value: 'mannoroth', label: 'Mannoroth' },
	{ value: 'nazjatar', label: 'Nazjatar' },
	{ value: 'malfurion', label: 'Malfurion' },
	{ value: 'aegwynn', label: 'Aegwynn' },
	{ value: 'akama', label: 'Akama' },
	{ value: 'emerald-dream', label: 'Emerald Dream' },
	{ value: 'smolderthorn', label: 'Smolderthorn' },
	{ value: 'blackhand', label: 'Blackhand' },
	{ value: 'whisperwind', label: 'Whisperwind' },
	{ value: 'archimonde', label: 'Archimonde' },
	{ value: 'stormrage', label: 'Stormrage' },
	{ value: 'medivh', label: 'Medivh' },
	{ value: 'durotan', label: 'Durotan' },
	{ value: 'bloodhoof', label: 'Bloodhoof' },
	{ value: 'khadgar', label: 'Khadgar' },
	{ value: 'rexxar', label: 'Rexxar' },
	{ value: 'the-forgotten-coast', label: 'The Forgotten Coast' },
	{ value: 'thorium-brotherhood', label: 'Thorium Brotherhood' },
	{ value: 'fenris', label: 'Fenris' },
	{ value: 'anubarak', label: "Anub'arak" },
	{ value: 'blackwater-raiders', label: 'Blackwater Raiders' },
	{ value: 'vashj', label: 'Vashj' },
	{ value: 'korialstrasz', label: 'Korialstrasz' },
	{ value: 'darrowmere', label: 'Darrowmere' },
	{ value: 'shuhalo', label: "Shu'halo" },
	{ value: 'arathor', label: 'Arathor' },
	{ value: 'staghelm', label: 'Staghelm' },
	{ value: 'eldrethalas', label: "Eldre'Thalas" },
	{ value: 'dentarg', label: 'Dentarg' },
	{ value: 'demon-soul', label: 'Demon Soul' },
	{ value: 'spirestone', label: 'Spirestone' },
	{ value: 'hyjal', label: 'Hyjal' },
	{ value: 'lethon', label: 'Lethon' },
	{ value: 'blackwing-lair', label: 'Blackwing Lair' },
	{ value: 'arygos', label: 'Arygos' },
	{ value: 'duskwood', label: 'Duskwood' },
	{ value: 'illidan', label: 'Illidan' },
	{ value: 'lothar', label: 'Lothar' },
	{ value: 'sargeras', label: 'Sargeras' },
	{ value: 'azgalor', label: 'Azgalor' },
	{ value: 'magtheridon', label: 'Magtheridon' },
	{ value: 'shadowmoon', label: 'Shadowmoon' },
	{ value: 'drakkari', label: 'Drakkari' },
	{ value: 'ragnaros', label: 'Ragnaros' },
	{ value: 'shadow-council', label: 'Shadow Council' },
	{ value: 'chogall', label: "Cho'gall" },
	{ value: 'guldan', label: "Gul'dan" },
	{ value: 'kaelthas', label: "Kael'thas" },
	{ value: 'alexstrasza', label: 'Alexstrasza' },
	{ value: 'kirin-tor', label: 'Kirin Tor' },
	{ value: 'balnazzar', label: 'Balnazzar' },
	{ value: 'drakthul', label: "Drak'thul" },
	{ value: 'garithos', label: 'Garithos' },
	{ value: 'hakkar', label: 'Hakkar' },
	{ value: 'khaz-modan', label: 'Khaz Modan' },
	{ value: 'mugthol', label: "Mug'thol" },
	{ value: 'kul-tiras', label: 'Kul Tiras' },
	{ value: 'malorne', label: 'Malorne' },
	{ value: 'echo-isles', label: 'Echo Isles' },
	{ value: 'zuljin', label: "Zul'jin" },
	{ value: 'zuluhed', label: 'Zuluhed' },
	{ value: 'steamwheedle-cartel', label: 'Steamwheedle Cartel' },
	{ value: 'norgannon', label: 'Norgannon' },
	{ value: 'thrall', label: 'Thrall' },
	{ value: 'maelstrom', label: 'Maelstrom' },
	{ value: 'twisting-nether', label: 'Twisting Nether' },
	{ value: 'kalecgos', label: 'Kalecgos' },
	{ value: 'ursin', label: 'Ursin' },
	{ value: 'dark-iron', label: 'Dark Iron' },
	{ value: 'wildhammer', label: 'Wildhammer' },
	{ value: 'wyrmrest-accord', label: 'Wyrmrest Accord' },
	{ value: 'farstriders', label: 'Farstriders' },
	{ value: 'borean-tundra', label: 'Borean Tundra' },
	{ value: 'quel-dorei', label: "Quel'dorei" },
	{ value: 'garrosh', label: 'Garrosh' },
	{ value: 'mok-nathal', label: "Mok'Nathal" },
	{ value: 'nesingwary', label: 'Nesingwary' },
	{ value: 'drenden', label: 'Drenden' },
	{ value: 'azshara', label: 'Azshara' },
	{ value: 'agamaggan', label: 'Agamaggan' },
	{ value: 'lightninghoof', label: 'Lightninghoof' },
	{ value: 'baelgun', label: 'Baelgun' },
	{ value: 'anetheron', label: 'Anetheron' },
	{ value: 'turalyon', label: 'Turalyon' },
	{ value: 'haomarush', label: 'Haomarush' },
	{ value: 'ysondre', label: 'Ysondre' },
	{ value: 'ysera', label: 'Ysera' },
	{ value: 'andorhal', label: 'Andorhal' },
	{ value: 'executus', label: 'Executus' },
	{ value: 'black-dragonflight', label: 'Black Dragonflight' },
	{ value: 'altar-of-storms', label: 'Altar of Storms' },
	{ value: 'uldaman', label: 'Uldaman' },
	{ value: 'aerie-peak', label: 'Aerie Peak' },
	{ value: 'onyxia', label: 'Onyxia' },
	{ value: 'gnomeregan', label: 'Gnomeregan' },
	{ value: 'the-venture-co', label: 'The Venture Co' },
	{ value: 'sentinels', label: 'Sentinels' },
	{ value: 'jaedenar', label: 'Jaedenar' },
	{ value: 'tanaris', label: 'Tanaris' },
	{ value: 'alterac-mountains', label: 'Alterac Mountains' },
	{ value: 'undermine', label: 'Undermine' },
	{ value: 'tichondrius', label: 'Tichondrius' },
	{ value: 'bladefist', label: 'Bladefist' },
	{ value: 'the-scryers', label: 'The Scryers' },
	{ value: 'burning-blade', label: 'Burning Blade' },
	{ value: 'suramar', label: 'Suramar' },
	{ value: 'tortheldrin', label: 'Tortheldrin' },
	{ value: 'nerzhul', label: "Ner'zhul" },
	{ value: 'alleria', label: 'Alleria' },
	{ value: 'deathwing', label: 'Deathwing' },
	{ value: 'arthas', label: 'Arthas' },
	{ value: 'draka', label: 'Draka' },
	{ value: 'velen', label: 'Velen' },
	{ value: 'frostwolf', label: 'Frostwolf' },
	{ value: 'misha', label: 'Misha' },
	{ value: 'moonrunner', label: 'Moonrunner' },
	{ value: 'ghostlands', label: 'Ghostlands' },
	{ value: 'eredar', label: 'Eredar' },
	{ value: 'korgath', label: 'Korgath' },
	{ value: 'detheroc', label: 'Detheroc' },
	{ value: 'ravenholdt', label: 'Ravenholdt' },
	{ value: 'gallywix', label: 'Gallywix' },
	{ value: 'crushridge', label: 'Crushridge' },
	{ value: 'daggerspine', label: 'Daggerspine' },
	{ value: 'stormscale', label: 'Stormscale' },
	{ value: 'boulderfist', label: 'Boulderfist' },
	{ value: 'stonemaul', label: 'Stonemaul' },
	{ value: 'greymane', label: 'Greymane' },
	{ value: 'kiljaeden', label: "Kil'jaeden" },
	{ value: 'perenolde', label: 'Perenolde' },
	{ value: 'shadowsong', label: 'Shadowsong' },
	{ value: 'malganis', label: "Mal'Ganis" },
	{ value: 'darkspear', label: 'Darkspear' },
	{ value: 'bronzebeard', label: 'Bronzebeard' },
	{ value: 'gilneas', label: 'Gilneas' },
	{ value: 'chromaggus', label: 'Chromaggus' },
	{ value: 'antonidas', label: 'Antonidas' },
	{ value: 'warsong', label: 'Warsong' },
	{ value: 'quelthalas', label: "Quel'Thalas" },
	{ value: 'dalvengyr', label: 'Dalvengyr' },
	{ value: 'scilla', label: 'Scilla' },
	{ value: 'anvilmar', label: 'Anvilmar' },
	{ value: 'goldrinn', label: 'Goldrinn' },
	{ value: 'nemesis', label: 'Nemesis' },
	{ value: 'azralon', label: 'Azralon' },
	{ value: 'tol-barad', label: 'Tol Barad' },
	{ value: 'dreadmaul', label: 'Dreadmaul' },
	{ value: 'caelestrasz', label: 'Caelestrasz' },
	{ value: 'nagrand', label: 'Nagrand' },
	{ value: 'amanthul', label: "Aman'Thul" },
	{ value: 'barthilas', label: 'Barthilas' },
	{ value: 'thaurissan', label: 'Thaurissan' },
	{ value: 'dathremar', label: "Dath'Remar" },
	{ value: 'frostmourne', label: 'Frostmourne' },
	{ value: 'khazgoroth', label: "Khaz'goroth" },
	{ value: 'jubeithos', label: "Jubei'Thos" },
	{ value: 'gundrak', label: 'Gundrak' },
	{ value: 'saurfang', label: 'Saurfang' }
];

export const euRealmOptions: Array<{ value: string; label: string }> = [
	{ value: 'khadgar', label: 'Khadgar' },
	{ value: 'chromaggus', label: 'Chromaggus' },
	{ value: 'dentarg', label: 'Dentarg' },
	{ value: 'la-croisade-écarlate', label: 'La Croisade écarlate' },
	{ value: 'runetotem', label: 'Runetotem' },
	{ value: 'shadowsong', label: 'Shadowsong' },
	{ value: 'silvermoon', label: 'Silvermoon' },
	{ value: 'sunstrider', label: 'Sunstrider' },
	{ value: 'executus', label: 'Executus' },
	{ value: 'mazrigos', label: 'Mazrigos' },
	{ value: 'karazhan', label: 'Karazhan' },
	{ value: 'auchindoun', label: 'Auchindoun' },
	{ value: 'shattered-halls', label: 'Shattered Halls' },
	{ value: 'gordunni', label: 'Gordunni' },
	{ value: 'soulflayer', label: 'Soulflayer' },
	{ value: 'deathguard', label: 'Deathguard' },
	{ value: 'sporeggar', label: 'Sporeggar' },
	{ value: 'nethersturm', label: 'Nethersturm' },
	{ value: 'shattrath', label: 'Shattrath' },
	{ value: 'deepholm', label: 'Deepholm' },
	{ value: 'echsenkessel', label: 'Echsenkessel' },
	{ value: 'blutkessel', label: 'Blutkessel' },
	{ value: 'galakrond', label: 'Galakrond' },
	{ value: 'razuvious', label: 'Razuvious' },
	{ value: 'deathweaver', label: 'Deathweaver' },
	{ value: 'terenas', label: 'Terenas' },
	{ value: 'thunderhorn', label: 'Thunderhorn' },
	{ value: 'turalyon', label: 'Turalyon' },
	{ value: 'ravencrest', label: 'Ravencrest' },
	{ value: 'shattered-hand', label: 'Shattered Hand' },
	{ value: 'spinebreaker', label: 'Spinebreaker' },
	{ value: 'stormscale', label: 'Stormscale' },
	{ value: 'earthen-ring', label: 'Earthen Ring' },
	{ value: 'alexstrasza', label: 'Alexstrasza' },
	{ value: 'alleria', label: 'Alleria' },
	{ value: 'antonidas', label: 'Antonidas' },
	{ value: 'blackhand', label: 'Blackhand' },
	{ value: 'gilneas', label: 'Gilneas' },
	{ value: 'kargath', label: 'Kargath' },
	{ value: 'khazgoroth', label: "Khaz'goroth" },
	{ value: 'madmortem', label: 'Madmortem' },
	{ value: 'zuluhed', label: 'Zuluhed' },
	{ value: 'nozdormu', label: 'Nozdormu' },
	{ value: 'perenolde', label: 'Perenolde' },
	{ value: 'aegwynn', label: 'Aegwynn' },
	{ value: 'dun-morogh', label: 'Dun Morogh' },
	{ value: 'thrall', label: 'Thrall' },
	{ value: 'theradras', label: 'Theradras' },
	{ value: 'genjuros', label: 'Genjuros' },
	{ value: 'balnazzar', label: 'Balnazzar' },
	{ value: 'wrathbringer', label: 'Wrathbringer' },
	{ value: 'talnivarr', label: 'Talnivarr' },
	{ value: 'emeriss', label: 'Emeriss' },
	{ value: 'drakthul', label: "Drak'thul" },
	{ value: 'ahnqiraj', label: "Ahn'Qiraj" },
	{ value: 'ysera', label: 'Ysera' },
	{ value: 'malygos', label: 'Malygos' },
	{ value: 'nazjatar', label: 'Nazjatar' },
	{ value: 'tichondrius', label: 'Tichondrius' },
	{ value: 'steamwheedle-cartel', label: 'Steamwheedle Cartel' },
	{ value: 'die-ewige-wacht', label: 'Die ewige Wacht' },
	{ value: 'die-todeskrallen', label: 'Die Todeskrallen' },
	{ value: 'die-arguswacht', label: 'Die Arguswacht' },
	{ value: 'uldaman', label: 'Uldaman' },
	{ value: 'confrérie-du-thorium', label: 'Confrérie du Thorium' },
	{ value: 'dragonblight', label: 'Dragonblight' },
	{ value: 'tarren-mill', label: 'Tarren Mill' },
	{ value: 'cthun', label: "C'Thun" },
	{ value: 'alonsus', label: 'Alonsus' },
	{ value: 'blades-edge', label: "Blade's Edge" },
	{ value: 'doomhammer', label: 'Doomhammer' },
	{ value: 'twilights-hammer', label: "Twilight's Hammer" },
	{ value: 'daggerspine', label: 'Daggerspine' },
	{ value: 'sargeras', label: 'Sargeras' },
	{ value: 'emerald-dream', label: 'Emerald Dream' },
	{ value: 'quelthalas', label: "Quel'Thalas" },
	{ value: 'bloodscalp', label: 'Bloodscalp' },
	{ value: 'burning-blade', label: 'Burning Blade' },
	{ value: 'crushridge', label: 'Crushridge' },
	{ value: 'dragonmaw', label: 'Dragonmaw' },
	{ value: 'dunemaul', label: 'Dunemaul' },
	{ value: 'dethecus', label: 'Dethecus' },
	{ value: 'durotan', label: 'Durotan' },
	{ value: 'aggramar', label: 'Aggramar' },
	{ value: 'arathor', label: 'Arathor' },
	{ value: 'azjol-nerub', label: 'Azjol-Nerub' },
	{ value: 'draenor', label: 'Draenor' },
	{ value: 'voljin', label: "Vol'jin" },
	{ value: 'arak-arahm', label: 'Arak-arahm' },
	{ value: 'zenedar', label: 'Zenedar' },
	{ value: 'agamaggan', label: 'Agamaggan' },
	{ value: 'bladefist', label: 'Bladefist' },
	{ value: 'culte-de-la-rive-noire', label: 'Culte de la Rive noire' },
	{ value: 'argent-dawn', label: 'Argent Dawn' },
	{ value: 'onyxia', label: 'Onyxia' },
	{ value: 'nefarian', label: 'Nefarian' },
	{ value: 'das-syndikat', label: 'Das Syndikat' },
	{ value: 'laughing-skull', label: 'Laughing Skull' },
	{ value: 'neptulon', label: 'Neptulon' },
	{ value: 'twisting-nether', label: 'Twisting Nether' },
	{ value: 'the-maelstrom', label: 'The Maelstrom' },
	{ value: 'bloodfeather', label: 'Bloodfeather' },
	{ value: 'frostwhisper', label: 'Frostwhisper' },
	{ value: 'korgall', label: "Kor'gall" },
	{ value: 'defias-brotherhood', label: 'Defias Brotherhood' },
	{ value: 'rashgarroth', label: 'Rashgarroth' },
	{ value: 'les-sentinelles', label: 'Les Sentinelles' },
	{ value: 'suramar', label: 'Suramar' },
	{ value: 'garrosh', label: 'Garrosh' },
	{ value: 'arygos', label: 'Arygos' },
	{ value: 'teldrassil', label: 'Teldrassil' },
	{ value: 'lordaeron', label: 'Lordaeron' },
	{ value: 'aggra-português', label: 'Aggra (Português)' },
	{ value: 'terokkar', label: 'Terokkar' },
	{ value: 'baelgun', label: 'Baelgun' },
	{ value: 'chogall', label: "Cho'gall" },
	{ value: 'nordrassil', label: 'Nordrassil' },
	{ value: 'sylvanas', label: 'Sylvanas' },
	{ value: 'drekthar', label: "Drek'Thar" },
	{ value: 'ghostlands', label: 'Ghostlands' },
	{ value: 'the-shatar', label: "The Sha'tar" },
	{ value: 'chants-éternels', label: 'Chants éternels' },
	{ value: 'marécage-de-zangar', label: 'Marécage de Zangar' },
	{ value: 'naxxramas', label: 'Naxxramas' },
	{ value: 'arthas', label: 'Arthas' },
	{ value: 'azshara', label: 'Azshara' },
	{ value: 'blackmoore', label: 'Blackmoore' },
	{ value: 'destromath', label: 'Destromath' },
	{ value: 'eredar', label: 'Eredar' },
	{ value: 'frostwolf', label: 'Frostwolf' },
	{ value: 'kiljaeden', label: "Kil'jaeden" },
	{ value: 'malganis', label: "Mal'Ganis" },
	{ value: 'zirkel-des-cenarius', label: 'Zirkel des Cenarius' },
	{ value: 'vashj', label: 'Vashj' },
	{ value: 'hyjal', label: 'Hyjal' },
	{ value: 'ulduar', label: 'Ulduar' },
	{ value: 'howling-fjord', label: 'Howling Fjord' },
	{ value: 'alakir', label: "Al'Akir" },
	{ value: 'stormreaver', label: 'Stormreaver' },
	{ value: 'magtheridon', label: 'Magtheridon' },
	{ value: 'lightnings-blade', label: "Lightning's Blade" },
	{ value: 'kirin-tor', label: 'Kirin Tor' },
	{ value: 'archimonde', label: 'Archimonde' },
	{ value: 'elune', label: 'Elune' },
	{ value: 'chamber-of-aspects', label: 'Chamber of Aspects' },
	{ value: 'ravenholdt', label: 'Ravenholdt' },
	{ value: 'pozzo-delleternità', label: "Pozzo dell'Eternità" },
	{ value: 'eonar', label: 'Eonar' },
	{ value: 'veknilash', label: "Vek'nilash" },
	{ value: 'frostmane', label: 'Frostmane' },
	{ value: 'bloodhoof', label: 'Bloodhoof' },
	{ value: 'kaelthas', label: "Kael'thas" },
	{ value: 'haomarush', label: 'Haomarush' },
	{ value: 'khaz-modan', label: 'Khaz Modan' },
	{ value: 'varimathras', label: 'Varimathras' },
	{ value: 'hakkar', label: 'Hakkar' },
	{ value: 'blackrock', label: 'Blackrock' },
	{ value: 'kelthuzad', label: "Kel'Thuzad" },
	{ value: 'mannoroth', label: 'Mannoroth' },
	{ value: 'proudmoore', label: 'Proudmoore' },
	{ value: 'garona', label: 'Garona' },
	{ value: 'darkmoon-faire', label: 'Darkmoon Faire' },
	{ value: 'veklor', label: "Vek'lor" },
	{ value: 'mugthol', label: "Mug'thol" },
	{ value: 'taerar', label: 'Taerar' },
	{ value: 'dalvengyr', label: 'Dalvengyr' },
	{ value: 'rajaxx', label: 'Rajaxx' },
	{ value: 'malorne', label: 'Malorne' },
	{ value: 'der-abyssische-rat', label: 'Der abyssische Rat' },
	{ value: 'der-mithrilorden', label: 'Der Mithrilorden' },
	{ value: 'ambossar', label: 'Ambossar' },
	{ value: 'krasus', label: 'Krasus' },
	{ value: 'arathi', label: 'Arathi' },
	{ value: 'ysondre', label: 'Ysondre' },
	{ value: 'eldrethalas', label: "Eldre'Thalas" },
	{ value: 'kilrogg', label: 'Kilrogg' },
	{ value: 'wildhammer', label: 'Wildhammer' },
	{ value: 'saurfang', label: 'Saurfang' },
	{ value: 'nemesis', label: 'Nemesis' },
	{ value: 'fordragon', label: 'Fordragon' },
	{ value: 'borean-tundra', label: 'Borean Tundra' },
	{ value: 'les-clairvoyants', label: 'Les Clairvoyants' },
	{ value: 'skullcrusher', label: 'Skullcrusher' },
	{ value: 'lothar', label: 'Lothar' },
	{ value: 'sinstralis', label: 'Sinstralis' },
	{ value: 'terrordar', label: 'Terrordar' },
	{ value: 'scarshield-legion', label: 'Scarshield Legion' },
	{ value: 'kul-tiras', label: 'Kul Tiras' },
	{ value: 'stormrage', label: 'Stormrage' },
	{ value: 'nerzhul', label: "Ner'zhul" },
	{ value: 'dun-modr', label: 'Dun Modr' },
	{ value: 'zuljin', label: "Zul'jin" },
	{ value: 'uldum', label: 'Uldum' },
	{ value: 'sanguino', label: 'Sanguino' },
	{ value: 'shendralar', label: "Shen'dralar" },
	{ value: 'tyrande', label: 'Tyrande' },
	{ value: 'exodar', label: 'Exodar' },
	{ value: 'los-errantes', label: 'Los Errantes' },
	{ value: 'lightbringer', label: 'Lightbringer' },
	{ value: 'darkspear', label: 'Darkspear' },
	{ value: 'burning-steppes', label: 'Burning Steppes' },
	{ value: 'bronze-dragonflight', label: 'Bronze Dragonflight' },
	{ value: 'anachronos', label: 'Anachronos' },
	{ value: 'colinas-pardas', label: 'Colinas Pardas' },
	{ value: 'ungoro', label: "Un'Goro" },
	{ value: 'illidan', label: 'Illidan' },
	{ value: 'rexxar', label: 'Rexxar' },
	{ value: 'festung-der-stürme', label: 'Festung der Stürme' },
	{ value: 'guldan', label: "Gul'dan" },
	{ value: 'aszune', label: 'Aszune' },
	{ value: 'aerie-peak', label: 'Aerie Peak' },
	{ value: 'xavius', label: 'Xavius' },
	{ value: 'throkferoth', label: "Throk'Feroth" },
	{ value: 'minahonda', label: 'Minahonda' },
	{ value: 'tirion', label: 'Tirion' },
	{ value: 'senjin', label: "Sen'jin" },
	{ value: 'trollbane', label: 'Trollbane' },
	{ value: 'amanthul', label: "Aman'Thul" },
	{ value: 'bronzebeard', label: 'Bronzebeard' },
	{ value: 'die-aldor', label: 'Die Aldor' },
	{ value: 'temple-noir', label: 'Temple Noir' },
	{ value: 'eversong', label: 'Eversong' },
	{ value: 'thermaplugg', label: 'Thermaplugg' },
	{ value: 'grom', label: 'Grom' },
	{ value: 'goldrinn', label: 'Goldrinn' },
	{ value: 'blackscar', label: 'Blackscar' },
	{ value: 'forscherliga', label: 'Forscherliga' },
	{ value: 'eitrigg', label: 'Eitrigg' },
	{ value: 'todeswache', label: 'Todeswache' },
	{ value: 'dalaran', label: 'Dalaran' },
	{ value: 'frostmourne', label: 'Frostmourne' },
	{ value: 'malfurion', label: 'Malfurion' },
	{ value: 'kragjin', label: "Krag'jin" },
	{ value: 'gorgonnash', label: 'Gorgonnash' },
	{ value: 'burning-legion', label: 'Burning Legion' },
	{ value: 'azuremyst', label: 'Azuremyst' },
	{ value: 'anubarak', label: "Anub'arak" },
	{ value: 'nerathor', label: "Nera'thor" },
	{ value: 'kult-der-verdammten', label: 'Kult der Verdammten' },
	{ value: 'der-rat-von-dalaran', label: 'Der Rat von Dalaran' },
	{ value: 'hellscream', label: 'Hellscream' },
	{ value: 'ragnaros', label: 'Ragnaros' },
	{ value: 'darksorrow', label: 'Darksorrow' },
	{ value: 'the-venture-co', label: 'The Venture Co' },
	{ value: 'grim-batol', label: 'Grim Batol' },
	{ value: 'jaedenar', label: 'Jaedenar' },
	{ value: 'kazzak', label: 'Kazzak' },
	{ value: 'moonglade', label: 'Moonglade' },
	{ value: 'conseil-des-ombres', label: 'Conseil des Ombres' },
	{ value: 'nathrezim', label: 'Nathrezim' },
	{ value: 'das-konsortium', label: 'Das Konsortium' },
	{ value: 'boulderfist', label: 'Boulderfist' },
	{ value: 'deathwing', label: 'Deathwing' },
	{ value: 'area-52', label: 'Area 52' },
	{ value: 'die-nachtwache', label: 'Die Nachtwache' },
	{ value: 'booty-bay', label: 'Booty Bay' },
	{ value: 'lich-king', label: 'Lich King' },
	{ value: 'hellfire', label: 'Hellfire' },
	{ value: 'outland', label: 'Outland' },
	{ value: 'greymane', label: 'Greymane' },
	{ value: 'medivh', label: 'Medivh' },
	{ value: 'die-silberne-hand', label: 'Die Silberne Hand' },
	{ value: 'nagrand', label: 'Nagrand' },
	{ value: 'azuregos', label: 'Azuregos' },
	{ value: 'ashenvale', label: 'Ashenvale' },
	{ value: 'norgannon', label: 'Norgannon' }
];

// TW Realms (extracted from your TW JSON)
export const twRealmOptions: Array<{ value: string; label: string }> = [
	{ value: 'bleeding-hollow', label: 'Bleeding Hollow' },
	{ value: 'icecrown', label: 'Icecrown' },
	{ value: 'chillwind-point', label: 'Chillwind Point' },
	{ value: 'world-tree', label: 'World Tree' },
	{ value: 'shadowmoon', label: 'Shadowmoon' },
	{ value: 'spirestone', label: 'Spirestone' },
	{ value: 'stormscale', label: 'Stormscale' },
	{ value: 'arygos', label: 'Arygos' },
	{ value: 'wrathbringer', label: 'Wrathbringer' },
	{ value: 'arthas', label: 'Arthas' },
	{ value: 'zealot-blade', label: 'Zealot Blade' },
	{ value: 'lights-hope', label: "Light's Hope" },
	{ value: 'demon-fall-canyon', label: 'Demon Fall Canyon' },
	{ value: 'dragonmaw', label: 'Dragonmaw' },
	{ value: 'sundown-marsh', label: 'Sundown Marsh' },
	{ value: 'frostmane', label: 'Frostmane' },
	{ value: 'hellscream', label: 'Hellscream' },
	{ value: 'skywall', label: 'Skywall' },
	{ value: 'menethil', label: 'Menethil' },
	{ value: 'whisperwind', label: 'Whisperwind' },
	{ value: 'nightsong', label: 'Nightsong' },
	{ value: 'crystalpine-stinger', label: 'Crystalpine Stinger' },
	{ value: 'silverwing-hold', label: 'Silverwing Hold' },
	{ value: 'queldorei', label: "Quel'dorei" },
	{ value: 'order-of-the-cloud-serpent', label: 'Order of the Cloud Serpent' },
	{ value: 'krol-blade', label: 'Krol Blade' },
	{ value: 'old-blanchy', label: 'Old Blanchy' }
];

// KR Realms (extracted from your KR JSON)
export const krRealmOptions: Array<{ value: string; label: string }> = [
	{ value: 'azshara', label: 'Azshara' },
	{ value: 'burning-legion', label: 'Burning Legion' },
	{ value: 'guldan', label: "Gul'dan" },
	{ value: 'malfurion', label: 'Malfurion' },
	{ value: 'dalaran', label: 'Dalaran' },
	{ value: 'durotan', label: 'Durotan' },
	{ value: 'norgannon', label: 'Norgannon' },
	{ value: 'garona', label: 'Garona' },
	{ value: 'windrunner', label: 'Windrunner' },
	{ value: 'hellscream', label: 'Hellscream' },
	{ value: 'alexstrasza', label: 'Alexstrasza' },
	{ value: 'rexxar', label: 'Rexxar' },
	{ value: 'hyjal', label: 'Hyjal' },
	{ value: 'deathwing', label: 'Deathwing' },
	{ value: 'cenarius', label: 'Cenarius' },
	{ value: 'stormrage', label: 'Stormrage' },
	{ value: 'zuljin', label: "Zul'jin" },
	{ value: 'wildhammer', label: 'Wildhammer' }
];
