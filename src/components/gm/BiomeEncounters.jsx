// ============================================================
// Biome Encounter Tables — PTA GM Guide, pp.27-39
// ============================================================
// Pokémon habitat lists organized by biome for quick encounter generation.

import React, { useState, useMemo, useCallback } from 'react';
import toast from '../../utils/toast.js';

const BIOMES = [
    {
        id: 'beach',
        icon: '🏖️',
        label: 'Beach',
        pokemon: ['Barbaracle','Binacle','Blastoise','Brionne','Clauncher','Clawitzer','Crabrawler','Crawdaunt','Croconaw','Dewott','Empoleon','Feraligatr','Gastrodon','Golisopod','Inkay','Kingler','Krabby','Krookodile','Malamar','Mareanie','Nosepass','Oshawott','Palossand','Pelipper','Piplup','Popplio','Primarina','Prinplup','Pyukumuku','Samurott','Sandile','Sandygast','Shellos','Slowbro','Slowking','Slowpoke','Squirtle','Totodile','Toxapex','Wartortle','Wimpod','Wingull'],
    },
    {
        id: 'cave',
        icon: '🕳️',
        label: 'Cave',
        pokemon: ['Aegislash','Aerodactyl','Aggron','Amoonguss','Anorith','Ariados','Armaldo','Aron','Axew','Bagon','Baltoy','Banette','Bastiodon','Beartic','Beldum','Bisharp','Boldore','Bronzong','Bronzor','Chandelure','Charizard','Charmander','Charmeleon','Chimchar','Chimecho','Chingling','Claydol','Clefable','Clefairy','Cleffa','Cradily','Cranidos','Crobat','Crustle','Cryogonal','Cubchoo','Cubone','Cyndaquil','Darmanitan','Darumakka','Deino','Diglett','Doublade','Dragonair','Dragonite','Drampa','Dratini','Drilbur','Druddigon','Dugtrio','Dunsparce','Duosion','Durant','Dusclops','Dusknoir','Duskull','Dwebble','Eelektrik','Eelektross','Emboar','Excadrill','Exploud','Ferroseed','Ferrothorn','Flareon','Foongus','Fraxure','Gabite','Galvantula','Garchomp','Gastly','Gengar','Geodude','Gible','Gigalith','Glalie','Gligar','Gliscor','Golbat','Golem','Graveler','Hakamo-o','Hariyama','Haunter','Haxorus','Heatmor','Heliolisk','Helioptile','Hippopotas','Hippowdon','Honedge','Houndoom','Houndour','Hydreigon','Igglybuff','Infernape','Jangmo-o','Jigglypuff','Joltik','Kabutops','Klang','Klink','Klinklang','Kommo-o','Lairon','Lampent','Larvesta','Larvitar','Lileep','Litwick','Loudred','Lucario','Lunatone','Luxio','Luxray','Lycanroc','Machop','Magby','Magcargo','Magmar','Magmortar','Makuhita','Marowak','Mawile','Medicham','Meditite','Metagross','Metang','Mienfoo','Mienshao','Minior','Misdreavus','Mismagius','Monferno','Natu','Noibat','Noivern','Nosepass','Omanyte','Onix','Paras','Parasect','Pawniard','Pignite','Piloswine','Pupitar','Quilava','Rampardos','Raticate','Rattata','Reuniclus','Rhydon','Rhyhorn','Riolu','Rockruff','Roggenrola','Rufflet','Sableye','Salamence','Salandit','Salazzle','Sandshrew','Sandslash','Sawk','Scrafty','Shelgon','Shieldon','Shinx','Shuckle','Shuppet','Slugma','Smeargle','Sneasel','Solosis','Solrock','Spiritomb','Steelix','Swinub','Swoobat','Teddiursa','Throh','Torkoal','Turtonator','Tynamo','Type: Null','Typhlosion','Tyranitar','Umbreon','Unown','Ursaring','Vanillish','Vanillite','Vanilluxe','Victreebel','Volcarona','Vullaby','Weavile','Weepinbell','Whismur','Wigglytuff','Wobbuffet','Woobat','Wynaut','Xatu','Zubat','Zweilous'],
    },
    {
        id: 'desert',
        icon: '🏜️',
        label: 'Desert',
        pokemon: ['Burmy','Cacnea','Cacturne','Camerupt','Cofagrigus','Crustle','Darmanitan','Darumakka','Dodrio','Doduo','Donphan','Dunsparce','Durant','Dwebble','Flygon','Gabite','Garchomp','Gible','Gligar','Golett','Golurk','Heatmor','Hippopotas','Hippowdon','Krokorok','Krookodile','Mandibuzz','Maractus','Mothim','Nincada','Ninjask','Numel','Salandit','Salazzle','Sandile','Sandshrew','Sandslash','Scrafty','Scraggy','Seviper','Shedinja','Sigilyph','Steelix','Torkoal','Trapinch','Vibrava','Vullaby','Wormadam','Xatu','Yamask','Zangoose'],
    },
    {
        id: 'forest',
        icon: '🌲',
        label: 'Forest',
        pokemon: ['Abra','Absol','Accelgor','Aipom','Altaria','Ambipom','Amoongus','Ariados','Aromatisse','Audino','Bayleef','Beautifly','Beedrill','Bellsprout','Bewear','Bibarel','Bidoof','Bonsly','Bounsweet','Braixen','Braviary','Breloom','Bronzor','Budew','Bulbasaur','Buneary','Bunnelby','Burmy','Butterfree','Cascoon','Castform','Caterpie','Charjabug','Chatot','Cherrim','Cherubi','Chesnaught','Chespin','Chikorita','Cinccino','Combee','Comfey','Cutiefly','Dartrix','Decidueye','Dedenne','Deerling','Delcatty','Delphox','Diggersby','Ditto','Drapion','Drifblim','Drifloon','Dugtrio','Dunsparce','Duosion','Dusclops','Dusknoir','Duskull','Dustox','Eevee','Electabuzz','Electivire','Electrike','Elekid','Emolga','Escavalier','Espeon','Espurr','Exeggcute','Exeggutor','Fennekin','Flabebe','Fletchinder','Fletchling','Floette','Florges','Fomantis','Foongus','Forretress','Furfrou','Furret','Gallade','Galvantula','Gardevoir','Glameow','Gligar','Gloom','Gothita','Gothorita','Gourgeist','Granbull','Grotle','Grubbin','Grumpig','Gumshoos','Heracross','Honchkrow','Hoothoot','Hoppip','Illumise','Ivysaur','Jolteon','Joltik','Jumpluff','Kadabra','Kakuna','Karrablast','Kecleon','Kirlia','Komala','Kricketot','Kricketune','Leafeon','Leavanny','Ledian','Ledyba','Lickilicky','Lickitung','Liepard','Lilligant','Linoone','Lopunny','Lucario','Ludicolo','Lurantis','Lycanroc','Manectric','Mankey','Mawile','Meganium','Meowstic','Meowth','Metapod','Mightyena','Mimikyu','Minccino','Minun','Misdreavus','Mismagius','Morelull','Mothim','Munchlax','Munna','Murkrow','Musharna','Natu','Nincada','Ninjask','Noctowl','Nuzleaf','Oddish','Oranguru','Oricorio','Pachirisu','Pancham','Pangoro','Panpour','Pansage','Pansear','Passimian','Patrat','Persian','Petilil','Phanpy','Phantump','Pichu','Pidgeot','Pidgeotto','Pidgey','Pidove','Pikachu','Pikipek','Pineco','Pinsir','Plusle','Poochyena','Primeape','Pumpkaboo','Purrloin','Purugly','Quilladin','Raichu','Ralts','Raticate','Rattata','Reuniclus','Ribombee','Rockruff','Roselia','Roserade','Rowlet','Rufflet','Sawsbuck','Scatterbug','Scolipede','Scyther','Seedot','Sentret','Serperior','Servine','Seviper','Sewaddle','Shedinja','Shelmet','Shiftry','Shiinotic','Shroomish','Shuckle','Silcoon','Simipour','Simisage','Simisear','Skiploom','Skitty','Skorupi','Skuntank','Slaking','Slakoth','Slurpuff','Smeargle','Snivy','Snorlax','Snubbull','Solosis','Spewpa','Spinarak','Spinda','Spiritomb','Spoink','Spritzee','Stantler','Staraptor','Staravia','Starly','Steenee','Stufful','Stunky','Sudowoodo','Sunkern','Swablu','Swadloon','Swellow','Swirlix','Sylveon','Taillow','Talonflame','Tangela','Tepig','Togedemaru','Togekiss','Togepi','Togetic','Torterra','Toucannon','Tranquill','Trevenant','Tropius','Trumbeak','Tsareena','Turtwig','Type: Null','Umbreon','Unfezant','Vaporeon','Venipede','Venomoth','Venonat','Venusaur','Vespiquen','Victreebel','Vigoroth','Vikavolt','Vileplume','Vivillon','Volbeat','Watchog','Weedle','Weepinbell','Whimsicott','Whirlipede','Wormadam','Wurmple','Xatu','Yanma','Yanmega','Yungoos','Zangoose','Zigzagoon','Zoroark','Zorua'],
    },
    {
        id: 'freshwater',
        icon: '🏞️',
        label: 'Freshwater',
        pokemon: ['Araquanid','Azumarill','Azurill','Barboach','Blastoise','Buizel','Carvanha','Croagunk','Croconaw','Dewpider','Dragonair','Dragonite','Dratini','Ducklett','Eelektrik','Eelektross','Farfetch\'d','Feebas','Feraligatr','Floatzel','Froakie','Frogadier','Goldeen','Golduck','Greninja','Gyarados','Lombre','Lotad','Ludicolo','Magikarp','Marill','Masquerain','Milotic','Palpitoad','Politoed','Poliwag','Poliwhirl','Poliwrath','Psyduck','Quagsire','Seaking','Seismitoad','Sharpedo','Slowbro','Slowking','Slowpoke','Squirtle','Stunfisk','Surskit','Swanna','Totodile','Toxicroak','Tympole','Tynamo','Vaporeon','Wartortle','Whiscash','Wooper'],
    },
    {
        id: 'grasslands',
        icon: '🌾',
        label: 'Grasslands',
        pokemon: ['Absol','Amoonguss','Ampharos','Arbok','Arcanine','Aromatisse','Audino','Bayleef','Bewear','Bibarel','Bidoof','Blaziken','Blissey','Blitzle','Bonsly','Bouffalant','Bounsweet','Braixen','Budew','Buizel','Bulbasaur','Buneary','Bunnelby','Chansey','Charjabug','Chesnaught','Chespin','Chikorita','Cinccino','Combusken','Comfey','Cottonee','Crustle','Cutiefly','Deerling','Delcatty','Delphox','Diggersby','Diglett','Ditto','Dodrio','Doduo','Drowzee','Dugtrio','Dunsparce','Dwebble','Eevee','Ekans','Electabuzz','Electivire','Electrike','Elekid','Emboar','Espeon','Espurr','Farfetch\'d','Fearow','Fennekin','Flaaffy','Flabebe','Fletchinder','Fletchling','Floatzel','Floette','Florges','Foongus','Furfrou','Furret','Garbodor','Girafarig','Glameow','Gloom','Gogoat','Growlithe','Grubbin','Grumpig','Gulpin','Gumshoos','Hakamo-o','Happiny','Herdier','Hoppip','Hypno','Igglybuff','Illumise','Incineroar','Ivysaur','Jangmo-o','Jigglypuff','Jumpluff','Kangaskhan','Karrablast','Komala','Kommo-o','Kricketot','Kricketune','Leafeon','Lickilicky','Lickitung','Liepard','Lillipup','Linoone','Litleo','Litten','Lopunny','Luxio','Luxray','Lycanroc','Manectric','Mankey','Mareep','Meganium','Meowstic','Mightyena','Miltank','Mimikyu','Minccino','Minun','Mudbray','Mudsdale','Musharna','Nidoking','Nidoqueen','Nidoran F','Nidoran M','Nidorina','Nidorino','Ninetales','Oddish','Oranguru','Oricorio','Pancham','Pangoro','Patrat','Pichu','Pidove','Pignite','Pikachu','Pikipek','Plusle','Ponyta','Poochyena','Primeape','Purrloin','Purugly','Pyroar','Quilladin','Rapidash','Raticate','Rattata','Rhydon','Rhyhorn','Ribombee','Rockruff','Roselia','Roserade','Sandshrew','Sandslash','Sawsbuck','Scizor','Scyther','Sentret','Shinx','Skiddo','Skiploom','Skitty','Skuntank','Slurpuff','Spearow','Spinda','Spoink','Spritzee','Staraptor','Staravia','Starly','Steenee','Stoutland','Stufful','Stunky','Sunflora','Sunkern','Swalot','Swellow','Swirlix','Sylveon','Taillow','Talonflame','Tangela','Tauros','Tepig','Torchic','Torracat','Toucannon','Tranquill','Trubbish','Trumbeak','Tsareena','Unfezant','Venusaur','Vikavolt','Vileplume','Volbeat','Vulpix','Watchog','Whimsicott','Wigglytuff','Wobbuffet','Wynaut','Yungoos','Zebstrika','Zigzagoon','Zorua'],
    },
    {
        id: 'marsh',
        icon: '🌿',
        label: 'Marsh',
        pokemon: ['Barboach','Bellossom','Bellsprout','Bibarel','Bidoof','Breloom','Carnivine','Corphish','Crawdaunt','Croagunk','Croconaw','Drapion','Drowzee','Ducklett','Ekans','Farfetch\'d','Feraligatr','Froakie','Frogadier','Garbodor','Gloom','Goodra','Goomy','Greninja','Grotle','Gulpin','Honchkrow','Hypno','Koffing','Marshtomp','Mudkip','Murkrow','Oddish','Palpitoad','Politoed','Poliwag','Poliwhirl','Poliwrath','Quagsire','Seismitoad','Shelmet','Shroomish','Skorupi','Sliggoo','Stunfisk','Swalot','Swanna','Tangrowth','Torterra','Totodile','Toxicroak','Tropius','Turtwig','Tympole','Victreebel','Vileplume','Weepinbell','Weezing','Whiscash','Wooper','Yanma','Yanmega'],
    },
    {
        id: 'mountain',
        icon: '⛰️',
        label: 'Mountain',
        pokemon: ['Absol','Aegislash','Aerodactyl','Aggron','Amaura','Ampharos','Arcanine','Archen','Archeops','Aron','Aurorus','Axew','Bagon','Bastiodon','Beheeyem','Bisharp','Boldore','Braixen','Braviary','Bronzong','Bronzor','Camerupt','Charizard','Charjabug','Charmander','Charmeleon','Chimchar','Clefable','Clefairy','Cleffa','Conkeldurr','Crabominable','Cranidos','Crustle','Cubone','Cyndaquil','Darmanitan','Darumakka','Deino','Delibird','Delphox','Donphan','Doublade','Dragonite','Drampa','Drilbur','Durant','Dusclops','Duskull','Dwebble','Elgyem','Emboar','Excadrill','Fearow','Fennekin','Flareon','Flygon','Fraxure','Garchomp','Geodude','Gigalith','Girafarig','Gligar','Gliscor','Gogoat','Golem','Golett','Golurk','Graveler','Growlithe','Grubbin','Gumshoos','Gurdurr','Hakamo-o','Hariyama','Haxorus','Heatmor','Heliolisk','Helioptile','Hitmonchan','Hitmonlee','Hitmontop','Honedge','Houndoom','Houndour','Hydreigon','Infernape','Jangmo-o','Koffing','Kommo-o','Lairon','Larvesta','Larvitar','Litleo','Lucario','Lunatone','Luxray','Lycanroc','Machamp','Machoke','Machop','Magby','Magcargo','Magmar','Magmortar','Magnemite','Magneton','Magnezone','Makuhita','Mandibuzz','Mankey','Maractus','Marowak','Mawile','Medicham','Meditite','Metagross','Mienfoo','Mienshao','Minior','Monferno','Munchlax','Nidoking','Nidoqueen','Ninetales','Noibat','Noivern','Nosepass','Numel','Onix','Pawniard','Phanpy','Pignite','Primeape','Probopass','Pupitar','Pyroar','Quilava','Rampardos','Raticate','Rattata','Rhydon','Rhyhorn','Rhyperior','Riolu','Rockruff','Roggenrola','Rufflet','Sableye','Salamence','Salandit','Salazzle','Sawk','Scizor','Scrafty','Scraggy','Seviper','Shelgon','Shieldon','Shuckle','Skarmory','Skiddo','Slugma','Smeargle','Snorlax','Solrock','Spearow','Steelix','Swoobat','Teddiursa','Tepig','Throh','Timburr','Torkoal','Turtonator','Type: Null','Typhlosion','Tyranitar','Tyrantrum','Tyrogue','Tyrunt','Ursaring','Vikavolt','Volcarona','Vullaby','Vulpix','Weezing','Wobbuffet','Wormadam','Wynaut','Yungoos','Zangoose','Zweilous'],
    },
    {
        id: 'ocean',
        icon: '🌊',
        label: 'Ocean',
        pokemon: ['Alomomola','Anorith','Basculin','Blastoise','Brionne','Bruxish','Carracosta','Carvanha','Chinchou','Clamperl','Clauncher','Clawitzer','Cloyster','Corphish','Corsola','Cradily','Crawdaunt','Dewgong','Dewott','Dhelmise','Dragalge','Finneon','Frillish','Gastrodon','Golisopod','Gorebyss','Gyarados','Horsea','Huntail','Inkay','Jellicent','Kabuto','Kabutops','Kingdra','Lanturn','Lapras','Lileep','Lumineon','Luvdisc','Magikarp','Malamar','Mantine','Mantyke','Mareanie','Octillery','Omanyte','Omastar','Oshawott','Popplio','Primarina','Pyukumuku','Qwilfish','Relicanth','Remoraid','Samurott','Seadra','Sealeo','Seel','Sharpedo','Shellder','Shellos','Skrelp','Spheal','Squirtle','Starmie','Staryu','Tentacool','Tentacruel','Tirtouga','Toxapex','Wailmer','Wailord','Walrein','Wartortle','Wimpod','Wishiwashi'],
    },
    {
        id: 'rainforest',
        icon: '🌴',
        label: 'Rainforest',
        pokemon: ['Aipom','Altaria','Ambipom','Ariados','Beautifly','Bellossom','Bellsprout','Bounsweet','Breloom','Budew','Bulbasaur','Burmy','Carnivine','Cascoon','Chatot','Cherubi','Comfey','Cutiefly','Dartrix','Decidueye','Drapion','Dustox','Exeggcute','Exeggutor','Fomantis','Froakie','Frogadier','Gloom','Greninja','Grotle','Grovyle','Heracross','Illumise','Ivysaur','Kangaskhan','Leafeon','Ledian','Ledyba','Lickilicky','Lickitung','Liepard','Lilligant','Lurantis','Mankey','Morelull','Mothim','Nuzleaf','Oddish','Panpour','Pansage','Pansear','Paras','Parasect','Passimian','Petilil','Pinsir','Primeape','Purrloin','Ribombee','Roselia','Roserade','Rowlet','Sceptile','Scyther','Seedot','Serperior','Servine','Shiftry','Shiinotic','Shroomish','Shuckle','Silcoon','Simipour','Simisage','Simisear','Skorupi','Slaking','Slakoth','Snivy','Spinarak','Steenee','Swablu','Sylveon','Tangela','Tangrowth','Togekiss','Togepi','Togetic','Torterra','Treecko','Tropius','Tsareena','Turtwig','Venomoth','Venonat','Venusaur','Victreebel','Vigoroth','Vileplume','Volbeat','Weepinbell','Wormadam','Wurmple'],
    },
    {
        id: 'taiga',
        icon: '🌨️',
        label: 'Taiga',
        pokemon: ['Abomasnow','Avalugg','Beartic','Bergmite','Bonsly','Cubchoo','Delibird','Empoleon','Froslass','Glaceon','Glalie','Grumpig','Jynx','Munchlax','Piloswine','Piplup','Prinplup','Slaking','Slakoth','Smoochum','Sneasel','Snorlax','Snorunt','Snover','Spoink','Stantler','Sudowoodo','Swinub','Teddiursa','Ursaring','Vanillish','Vanillite','Vanilluxe','Vigoroth','Weavile'],
    },
    {
        id: 'tundra',
        icon: '❄️',
        label: 'Tundra',
        pokemon: ['Avalugg','Beartic','Bergmite','Cryogonal','Cubchoo','Delibird','Empoleon','Froslass','Glaceon','Glalie','Jynx','Mamoswine','Piloswine','Piplup','Prinplup','Sealeo','Smoochum','Sneasel','Snorunt','Spheal','Swinub','Vanillish','Vanillite','Vanilluxe','Walrein','Weavile'],
    },
    {
        id: 'urban',
        icon: '🏙️',
        label: 'Urban',
        pokemon: ['Abra','Alakazam','Banette','Bewear','Blissey','Buneary','Burmy','Castform','Chandelure','Chansey','Chimecho','Chingling','Cubone','Dedenne','Ditto','Drifblim','Drifloon','Eevee','Electabuzz','Electivire','Electrike','Electrode','Elekid','Elgyem','Emolga','Espeon','Espurr','Flareon','Fletchinder','Fletchling','Gallade','Garbodor','Gardevoir','Gastly','Gengar','Glameow','Gothita','Gothitelle','Gothorita','Granbull','Grimer','Gulpin','Gurdurr','Happiny','Haunter','Herdier','Hitmonchan','Hitmonlee','Hitmontop','Igglybuff','Incineroar','Jigglypuff','Jolteon','Jynx','Kadabra','Kirlia','Klang','Klefki','Klink','Koffing','Lampent','Lillipup','Litten','Litwick','Machoke','Magnemite','Magneton','Marowak','Meowstic','Meowth','Mime Jr.','Mimikyu','Minccino','Minun','Misdreavus','Mothim','Mr. Mime','Muk','Munchlax','Murkrow','Pachirisu','Persian','Pichu','Pidgey','Pidove','Pikachu','Plusle','Porygon','Porygon-Z','Porygon2','Purrloin','Purugly','Ralts','Rattata','Rotom','Sawk','Shuppet','Smeargle','Smoochum','Snorlax','Snubbull','Spearow','Spiritomb','Staravia','Starly','Stoutland','Stufful','Swalot','Talonflame','Throh','Timburr','Togedemaru','Torracat','Tranquill','Trubbish','Type: Null','Tyrogue','Umbreon','Unown','Voltorb','Vulpix','Weezing','Wormadam'],
    },
];

const BiomeEncounters = () => {
    const [selectedBiome, setSelectedBiome] = useState('forest');
    const [search, setSearch] = useState('');
    const [rolled, setRolled] = useState(null);

    const biome = BIOMES.find(b => b.id === selectedBiome);

    const rollRandom = useCallback(() => {
        const pool = biome.pokemon;
        const pick = pool[Math.floor(Math.random() * pool.length)];
        setRolled(pick);
        toast.success(`Rolled: ${pick}`);
    }, [biome]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return biome.pokemon;
        return biome.pokemon.filter(p => p.toLowerCase().includes(q));
    }, [biome, search]);

    return (
        <div>
            <h3 style={{ marginBottom: 4, color: 'var(--text-primary)', fontWeight: 700 }}>
                🗺️ Habitat Encounter Tables
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                Pokémon lists organized by habitat biome for quick encounter generation.
                Source: PTA GM Guide, pp.27–39.
            </p>

            {/* Biome selector */}
            <div className="card-orange" style={{ marginBottom: 14 }}>
                <h3 className="card-header font-bold">🌍 Select Biome</h3>
                <div style={{ paddingTop: 14 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {BIOMES.map(b => (
                            <button
                                key={b.id}
                                onClick={() => { setSelectedBiome(b.id); setSearch(''); setRolled(null); }}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: 20,
                                    border: selectedBiome === b.id
                                        ? '2px solid var(--poke-orange)'
                                        : '1px solid var(--border-light)',
                                    background: selectedBiome === b.id
                                        ? 'linear-gradient(135deg, var(--poke-orange), var(--poke-orange-dark))'
                                        : 'var(--surface-bg)',
                                    color: selectedBiome === b.id ? 'white' : 'var(--text-secondary)',
                                    fontWeight: selectedBiome === b.id ? 700 : 500,
                                    fontSize: 13,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {b.icon} {b.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Pokémon list */}
            <div className="card-orange">
                <h3 className="card-header font-bold" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <span>{biome.icon} {biome.label} — {biome.pokemon.length} Pokémon</span>
                    <button
                        onClick={rollRandom}
                        style={{
                            padding: '5px 14px', borderRadius: 20,
                            border: '1px solid var(--border-light)',
                            background: 'var(--gradient-purple)',
                            color: 'white', fontWeight: 700, fontSize: 13,
                            cursor: 'pointer', whiteSpace: 'nowrap',
                        }}
                    >
                        🎲 Roll Random
                    </button>
                </h3>
                {rolled && (
                    <div style={{
                        margin: '10px 0 0', padding: '8px 14px', borderRadius: 8,
                        background: 'var(--tint-purple-bg)', border: '1px solid var(--tint-purple-border)',
                        fontSize: 14, fontWeight: 700, color: 'var(--color-purple)',
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <span>🎲 Last roll:</span>
                        <span>{rolled}</span>
                        <button
                            onClick={() => navigator.clipboard.writeText(rolled).then(() => toast.success('Copied!'))}
                            style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 5, border: '1px solid var(--border-light)', background: 'var(--surface-bg)', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}
                        >
                            📋 Copy
                        </button>
                        <button
                            onClick={() => setRolled(null)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-muted)' }}
                        >
                            ✕
                        </button>
                    </div>
                )}
                <div style={{ paddingTop: 14 }}>
                    <input
                        type="search"
                        placeholder="Filter Pokémon…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            width: '100%', padding: '7px 12px',
                            borderRadius: 8, marginBottom: 12,
                            border: '1px solid var(--border-light)',
                            background: 'var(--surface-bg)',
                            color: 'var(--text-primary)', fontSize: 14,
                            boxSizing: 'border-box',
                        }}
                    />
                    {filtered.length === 0 ? (
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                            No Pokémon match "{search}"
                        </p>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                            gap: 6,
                        }}>
                            {filtered.map(p => (
                                <div
                                    key={p}
                                    style={{
                                        padding: '4px 10px',
                                        borderRadius: 6,
                                        background: 'var(--surface-bg)',
                                        border: '1px solid var(--border-light)',
                                        fontSize: 13,
                                        color: 'var(--text-secondary)',
                                    }}
                                >
                                    {p}
                                </div>
                            ))}
                        </div>
                    )}
                    {search && (
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
                            {filtered.length} of {biome.pokemon.length} shown
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BiomeEncounters;
