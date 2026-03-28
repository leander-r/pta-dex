// ============================================================
// EVOLUTION CHAIN DATA
// ============================================================
// Format: { species: { evolvesTo: [{species, method, requirement, regionalForm?}], evolvesFrom: {species, method, requirement, regionalForm?} } }
// Methods: 'level' (minimum level), 'stone' (evolution stone), 'trade', 'happiness', 'other'

export const EVOLUTION_CHAINS = {
    // Gen 1 Starters
    'Bulbasaur': { evolvesTo: [{ species: 'Ivysaur', method: 'level', requirement: 16 }] },
    'Ivysaur': { evolvesFrom: { species: 'Bulbasaur', method: 'level', requirement: 16 }, evolvesTo: [{ species: 'Venusaur', method: 'level', requirement: 32 }] },
    'Venusaur': { evolvesFrom: { species: 'Ivysaur', method: 'level', requirement: 32 } },

    'Charmander': { evolvesTo: [{ species: 'Charmeleon', method: 'level', requirement: 16 }] },
    'Charmeleon': { evolvesFrom: { species: 'Charmander', method: 'level', requirement: 16 }, evolvesTo: [{ species: 'Charizard', method: 'level', requirement: 36 }] },
    'Charizard': { evolvesFrom: { species: 'Charmeleon', method: 'level', requirement: 36 } },

    'Squirtle': { evolvesTo: [{ species: 'Wartortle', method: 'level', requirement: 16 }] },
    'Wartortle': { evolvesFrom: { species: 'Squirtle', method: 'level', requirement: 16 }, evolvesTo: [{ species: 'Blastoise', method: 'level', requirement: 36 }] },
    'Blastoise': { evolvesFrom: { species: 'Wartortle', method: 'level', requirement: 36 } },

    // Pikachu line (with Alolan)
    'Pichu': { evolvesTo: [{ species: 'Pikachu', method: 'happiness', requirement: 'High Happiness' }] },
    'Pikachu': { evolvesFrom: { species: 'Pichu', method: 'happiness', requirement: 'High Happiness' }, evolvesTo: [
        { species: 'Raichu', method: 'stone', requirement: 'Thunder Stone' },
        { species: 'Raichu', method: 'stone', requirement: 'Thunder Stone', regionalForm: 'Alolan', note: 'In Alola', types: ['Electric', 'Psychic'] }
    ]},
    'Raichu': { evolvesFrom: { species: 'Pikachu', method: 'stone', requirement: 'Thunder Stone' } },

    // Sandshrew line (with Alolan)
    'Sandshrew': { evolvesTo: [{ species: 'Sandslash', method: 'level', requirement: 22 }] },
    'Sandslash': { evolvesFrom: { species: 'Sandshrew', method: 'level', requirement: 22 } },

    // Vulpix line (with Alolan)
    'Vulpix': { evolvesTo: [
        { species: 'Ninetales', method: 'stone', requirement: 'Fire Stone' },
        { species: 'Ninetales', method: 'stone', requirement: 'Ice Stone', regionalForm: 'Alolan', note: 'Alolan Vulpix', types: ['Ice', 'Fairy'] }
    ]},
    'Ninetales': { evolvesFrom: { species: 'Vulpix', method: 'stone', requirement: 'Fire Stone' } },

    // Clefairy line
    'Cleffa': { evolvesTo: [{ species: 'Clefairy', method: 'happiness', requirement: 'High Happiness' }] },
    'Clefairy': { evolvesFrom: { species: 'Cleffa', method: 'happiness', requirement: 'High Happiness' }, evolvesTo: [{ species: 'Clefable', method: 'stone', requirement: 'Moon Stone' }] },
    'Clefable': { evolvesFrom: { species: 'Clefairy', method: 'stone', requirement: 'Moon Stone' } },

    // Jigglypuff line
    'Igglybuff': { evolvesTo: [{ species: 'Jigglypuff', method: 'happiness', requirement: 'High Happiness' }] },
    'Jigglypuff': { evolvesFrom: { species: 'Igglybuff', method: 'happiness', requirement: 'High Happiness' }, evolvesTo: [{ species: 'Wigglytuff', method: 'stone', requirement: 'Moon Stone' }] },
    'Wigglytuff': { evolvesFrom: { species: 'Jigglypuff', method: 'stone', requirement: 'Moon Stone' } },

    // Oddish line
    'Oddish': { evolvesTo: [{ species: 'Gloom', method: 'level', requirement: 21 }] },
    'Gloom': { evolvesFrom: { species: 'Oddish', method: 'level', requirement: 21 }, evolvesTo: [
        { species: 'Vileplume', method: 'stone', requirement: 'Leaf Stone' },
        { species: 'Bellossom', method: 'stone', requirement: 'Sun Stone' }
    ]},
    'Vileplume': { evolvesFrom: { species: 'Gloom', method: 'stone', requirement: 'Leaf Stone' } },
    'Bellossom': { evolvesFrom: { species: 'Gloom', method: 'stone', requirement: 'Sun Stone' } },

    // Growlithe line
    'Growlithe': { evolvesTo: [{ species: 'Arcanine', method: 'stone', requirement: 'Fire Stone' }] },
    'Arcanine': { evolvesFrom: { species: 'Growlithe', method: 'stone', requirement: 'Fire Stone' } },

    // Poliwag line
    'Poliwag': { evolvesTo: [{ species: 'Poliwhirl', method: 'level', requirement: 25 }] },
    'Poliwhirl': { evolvesFrom: { species: 'Poliwag', method: 'level', requirement: 25 }, evolvesTo: [
        { species: 'Poliwrath', method: 'stone', requirement: 'Water Stone' },
        { species: 'Politoed', method: 'trade', requirement: "King's Rock" }
    ]},
    'Poliwrath': { evolvesFrom: { species: 'Poliwhirl', method: 'stone', requirement: 'Water Stone' } },
    'Politoed': { evolvesFrom: { species: 'Poliwhirl', method: 'trade', requirement: "King's Rock" } },

    // Abra line
    'Abra': { evolvesTo: [{ species: 'Kadabra', method: 'level', requirement: 16 }] },
    'Kadabra': { evolvesFrom: { species: 'Abra', method: 'level', requirement: 16 }, evolvesTo: [{ species: 'Alakazam', method: 'trade', requirement: 'Trade' }] },
    'Alakazam': { evolvesFrom: { species: 'Kadabra', method: 'trade', requirement: 'Trade' } },

    // Machop line
    'Machop': { evolvesTo: [{ species: 'Machoke', method: 'level', requirement: 28 }] },
    'Machoke': { evolvesFrom: { species: 'Machop', method: 'level', requirement: 28 }, evolvesTo: [{ species: 'Machamp', method: 'trade', requirement: 'Trade' }] },
    'Machamp': { evolvesFrom: { species: 'Machoke', method: 'trade', requirement: 'Trade' } },

    // Geodude line (with Alolan)
    'Geodude': { evolvesTo: [{ species: 'Graveler', method: 'level', requirement: 25 }] },
    'Graveler': { evolvesFrom: { species: 'Geodude', method: 'level', requirement: 25 }, evolvesTo: [{ species: 'Golem', method: 'trade', requirement: 'Trade' }] },
    'Golem': { evolvesFrom: { species: 'Graveler', method: 'trade', requirement: 'Trade' } },

    // Ponyta line
    'Ponyta': { evolvesTo: [{ species: 'Rapidash', method: 'level', requirement: 40 }] },
    'Rapidash': { evolvesFrom: { species: 'Ponyta', method: 'level', requirement: 40 } },

    // Slowpoke line
    'Slowpoke': { evolvesTo: [
        { species: 'Slowbro', method: 'level', requirement: 37 },
        { species: 'Slowking', method: 'trade', requirement: "King's Rock" }
    ]},
    'Slowbro': { evolvesFrom: { species: 'Slowpoke', method: 'level', requirement: 37 } },
    'Slowking': { evolvesFrom: { species: 'Slowpoke', method: 'trade', requirement: "King's Rock" } },

    // Magnemite line
    'Magnemite': { evolvesTo: [{ species: 'Magneton', method: 'level', requirement: 30 }] },
    'Magneton': { evolvesFrom: { species: 'Magnemite', method: 'level', requirement: 30 }, evolvesTo: [{ species: 'Magnezone', method: 'other', requirement: 'Magnetic Field' }] },
    'Magnezone': { evolvesFrom: { species: 'Magneton', method: 'other', requirement: 'Magnetic Field' } },

    // Grimer line (with Alolan)
    'Grimer': { evolvesTo: [{ species: 'Muk', method: 'level', requirement: 38 }] },
    'Muk': { evolvesFrom: { species: 'Grimer', method: 'level', requirement: 38 } },

    // Shellder line
    'Shellder': { evolvesTo: [{ species: 'Cloyster', method: 'stone', requirement: 'Water Stone' }] },
    'Cloyster': { evolvesFrom: { species: 'Shellder', method: 'stone', requirement: 'Water Stone' } },

    // Gastly line
    'Gastly': { evolvesTo: [{ species: 'Haunter', method: 'level', requirement: 25 }] },
    'Haunter': { evolvesFrom: { species: 'Gastly', method: 'level', requirement: 25 }, evolvesTo: [{ species: 'Gengar', method: 'trade', requirement: 'Trade' }] },
    'Gengar': { evolvesFrom: { species: 'Haunter', method: 'trade', requirement: 'Trade' } },

    // Drowzee line
    'Drowzee': { evolvesTo: [{ species: 'Hypno', method: 'level', requirement: 26 }] },
    'Hypno': { evolvesFrom: { species: 'Drowzee', method: 'level', requirement: 26 } },

    // Exeggcute line (with Alolan)
    'Exeggcute': { evolvesTo: [
        { species: 'Exeggutor', method: 'stone', requirement: 'Leaf Stone' },
        { species: 'Exeggutor', method: 'stone', requirement: 'Leaf Stone', regionalForm: 'Alolan', note: 'In Alola', types: ['Grass', 'Dragon'] }
    ]},
    'Exeggutor': { evolvesFrom: { species: 'Exeggcute', method: 'stone', requirement: 'Leaf Stone' } },

    // Cubone line (with Alolan Marowak)
    'Cubone': { evolvesTo: [
        { species: 'Marowak', method: 'level', requirement: 28 },
        { species: 'Marowak', method: 'level', requirement: 28, regionalForm: 'Alolan', note: 'In Alola at night', types: ['Fire', 'Ghost'] }
    ]},
    'Marowak': { evolvesFrom: { species: 'Cubone', method: 'level', requirement: 28 } },

    // Koffing line
    'Koffing': { evolvesTo: [{ species: 'Weezing', method: 'level', requirement: 35 }] },
    'Weezing': { evolvesFrom: { species: 'Koffing', method: 'level', requirement: 35 } },

    // Rhyhorn line
    'Rhyhorn': { evolvesTo: [{ species: 'Rhydon', method: 'level', requirement: 42 }] },
    'Rhydon': { evolvesFrom: { species: 'Rhyhorn', method: 'level', requirement: 42 }, evolvesTo: [{ species: 'Rhyperior', method: 'trade', requirement: 'Protector' }] },
    'Rhyperior': { evolvesFrom: { species: 'Rhydon', method: 'trade', requirement: 'Protector' } },

    // Chansey line
    'Happiny': { evolvesTo: [{ species: 'Chansey', method: 'other', requirement: 'Oval Stone (Day)' }] },
    'Chansey': { evolvesFrom: { species: 'Happiny', method: 'other', requirement: 'Oval Stone (Day)' }, evolvesTo: [{ species: 'Blissey', method: 'happiness', requirement: 'High Happiness' }] },
    'Blissey': { evolvesFrom: { species: 'Chansey', method: 'happiness', requirement: 'High Happiness' } },

    // Horsea line
    'Horsea': { evolvesTo: [{ species: 'Seadra', method: 'level', requirement: 32 }] },
    'Seadra': { evolvesFrom: { species: 'Horsea', method: 'level', requirement: 32 }, evolvesTo: [{ species: 'Kingdra', method: 'trade', requirement: 'Dragon Scale' }] },
    'Kingdra': { evolvesFrom: { species: 'Seadra', method: 'trade', requirement: 'Dragon Scale' } },

    // Staryu line
    'Staryu': { evolvesTo: [{ species: 'Starmie', method: 'stone', requirement: 'Water Stone' }] },
    'Starmie': { evolvesFrom: { species: 'Staryu', method: 'stone', requirement: 'Water Stone' } },

    // Scyther line
    'Scyther': { evolvesTo: [{ species: 'Scizor', method: 'trade', requirement: 'Metal Coat' }] },
    'Scizor': { evolvesFrom: { species: 'Scyther', method: 'trade', requirement: 'Metal Coat' } },

    // Magikarp line
    'Magikarp': { evolvesTo: [{ species: 'Gyarados', method: 'level', requirement: 20 }] },
    'Gyarados': { evolvesFrom: { species: 'Magikarp', method: 'level', requirement: 20 } },

    // Eevee line
    'Eevee': { evolvesTo: [
        { species: 'Vaporeon', method: 'stone', requirement: 'Water Stone' },
        { species: 'Jolteon', method: 'stone', requirement: 'Thunder Stone' },
        { species: 'Flareon', method: 'stone', requirement: 'Fire Stone' },
        { species: 'Espeon', method: 'happiness', requirement: 'High Happiness (Day)' },
        { species: 'Umbreon', method: 'happiness', requirement: 'High Happiness (Night)' },
        { species: 'Leafeon', method: 'stone', requirement: 'Leaf Stone' },
        { species: 'Glaceon', method: 'stone', requirement: 'Ice Stone' },
        { species: 'Sylveon', method: 'other', requirement: 'Affection + Fairy Move' }
    ]},
    'Vaporeon': { evolvesFrom: { species: 'Eevee', method: 'stone', requirement: 'Water Stone' } },
    'Jolteon': { evolvesFrom: { species: 'Eevee', method: 'stone', requirement: 'Thunder Stone' } },
    'Flareon': { evolvesFrom: { species: 'Eevee', method: 'stone', requirement: 'Fire Stone' } },
    'Espeon': { evolvesFrom: { species: 'Eevee', method: 'happiness', requirement: 'High Happiness (Day)' } },
    'Umbreon': { evolvesFrom: { species: 'Eevee', method: 'happiness', requirement: 'High Happiness (Night)' } },
    'Leafeon': { evolvesFrom: { species: 'Eevee', method: 'stone', requirement: 'Leaf Stone' } },
    'Glaceon': { evolvesFrom: { species: 'Eevee', method: 'stone', requirement: 'Ice Stone' } },
    'Sylveon': { evolvesFrom: { species: 'Eevee', method: 'other', requirement: 'Affection + Fairy Move' } },

    // Porygon line
    'Porygon': { evolvesTo: [{ species: 'Porygon2', method: 'trade', requirement: 'Up-Grade' }] },
    'Porygon2': { evolvesFrom: { species: 'Porygon', method: 'trade', requirement: 'Up-Grade' }, evolvesTo: [{ species: 'Porygon-Z', method: 'trade', requirement: 'Dubious Disc' }] },
    'Porygon-Z': { evolvesFrom: { species: 'Porygon2', method: 'trade', requirement: 'Dubious Disc' } },

    // Dratini line
    'Dratini': { evolvesTo: [{ species: 'Dragonair', method: 'level', requirement: 30 }] },
    'Dragonair': { evolvesFrom: { species: 'Dratini', method: 'level', requirement: 30 }, evolvesTo: [{ species: 'Dragonite', method: 'level', requirement: 55 }] },
    'Dragonite': { evolvesFrom: { species: 'Dragonair', method: 'level', requirement: 55 } },

    // Gen 2 Starters
    'Chikorita': { evolvesTo: [{ species: 'Bayleef', method: 'level', requirement: 16 }] },
    'Bayleef': { evolvesFrom: { species: 'Chikorita', method: 'level', requirement: 16 }, evolvesTo: [{ species: 'Meganium', method: 'level', requirement: 32 }] },
    'Meganium': { evolvesFrom: { species: 'Bayleef', method: 'level', requirement: 32 } },

    'Cyndaquil': { evolvesTo: [{ species: 'Quilava', method: 'level', requirement: 14 }] },
    'Quilava': { evolvesFrom: { species: 'Cyndaquil', method: 'level', requirement: 14 }, evolvesTo: [{ species: 'Typhlosion', method: 'level', requirement: 36 }] },
    'Typhlosion': { evolvesFrom: { species: 'Quilava', method: 'level', requirement: 36 } },

    'Totodile': { evolvesTo: [{ species: 'Croconaw', method: 'level', requirement: 18 }] },
    'Croconaw': { evolvesFrom: { species: 'Totodile', method: 'level', requirement: 18 }, evolvesTo: [{ species: 'Feraligatr', method: 'level', requirement: 30 }] },
    'Feraligatr': { evolvesFrom: { species: 'Croconaw', method: 'level', requirement: 30 } },

    // Togepi line
    'Togepi': { evolvesTo: [{ species: 'Togetic', method: 'happiness', requirement: 'High Happiness' }] },
    'Togetic': { evolvesFrom: { species: 'Togepi', method: 'happiness', requirement: 'High Happiness' }, evolvesTo: [{ species: 'Togekiss', method: 'stone', requirement: 'Shiny Stone' }] },
    'Togekiss': { evolvesFrom: { species: 'Togetic', method: 'stone', requirement: 'Shiny Stone' } },

    // Mareep line
    'Mareep': { evolvesTo: [{ species: 'Flaaffy', method: 'level', requirement: 15 }] },
    'Flaaffy': { evolvesFrom: { species: 'Mareep', method: 'level', requirement: 15 }, evolvesTo: [{ species: 'Ampharos', method: 'level', requirement: 30 }] },
    'Ampharos': { evolvesFrom: { species: 'Flaaffy', method: 'level', requirement: 30 } },

    // Marill line
    'Azurill': { evolvesTo: [{ species: 'Marill', method: 'happiness', requirement: 'High Happiness' }] },
    'Marill': { evolvesFrom: { species: 'Azurill', method: 'happiness', requirement: 'High Happiness' }, evolvesTo: [{ species: 'Azumarill', method: 'level', requirement: 18 }] },
    'Azumarill': { evolvesFrom: { species: 'Marill', method: 'level', requirement: 18 } },

    // Hoppip line
    'Hoppip': { evolvesTo: [{ species: 'Skiploom', method: 'level', requirement: 18 }] },
    'Skiploom': { evolvesFrom: { species: 'Hoppip', method: 'level', requirement: 18 }, evolvesTo: [{ species: 'Jumpluff', method: 'level', requirement: 27 }] },
    'Jumpluff': { evolvesFrom: { species: 'Skiploom', method: 'level', requirement: 27 } },

    // Sunkern line
    'Sunkern': { evolvesTo: [{ species: 'Sunflora', method: 'stone', requirement: 'Sun Stone' }] },
    'Sunflora': { evolvesFrom: { species: 'Sunkern', method: 'stone', requirement: 'Sun Stone' } },

    // Murkrow line
    'Murkrow': { evolvesTo: [{ species: 'Honchkrow', method: 'stone', requirement: 'Dusk Stone' }] },
    'Honchkrow': { evolvesFrom: { species: 'Murkrow', method: 'stone', requirement: 'Dusk Stone' } },

    // Misdreavus line
    'Misdreavus': { evolvesTo: [{ species: 'Mismagius', method: 'stone', requirement: 'Dusk Stone' }] },
    'Mismagius': { evolvesFrom: { species: 'Misdreavus', method: 'stone', requirement: 'Dusk Stone' } },

    // Sneasel line
    'Sneasel': { evolvesTo: [{ species: 'Weavile', method: 'other', requirement: 'Razor Claw (Night)' }] },
    'Weavile': { evolvesFrom: { species: 'Sneasel', method: 'other', requirement: 'Razor Claw (Night)' } },

    // Teddiursa line
    'Teddiursa': { evolvesTo: [{ species: 'Ursaring', method: 'level', requirement: 30 }] },
    'Ursaring': { evolvesFrom: { species: 'Teddiursa', method: 'level', requirement: 30 } },

    // Swinub line
    'Swinub': { evolvesTo: [{ species: 'Piloswine', method: 'level', requirement: 33 }] },
    'Piloswine': { evolvesFrom: { species: 'Swinub', method: 'level', requirement: 33 }, evolvesTo: [{ species: 'Mamoswine', method: 'other', requirement: 'Ancient Power' }] },
    'Mamoswine': { evolvesFrom: { species: 'Piloswine', method: 'other', requirement: 'Ancient Power' } },

    // Larvitar line
    'Larvitar': { evolvesTo: [{ species: 'Pupitar', method: 'level', requirement: 30 }] },
    'Pupitar': { evolvesFrom: { species: 'Larvitar', method: 'level', requirement: 30 }, evolvesTo: [{ species: 'Tyranitar', method: 'level', requirement: 55 }] },
    'Tyranitar': { evolvesFrom: { species: 'Pupitar', method: 'level', requirement: 55 } },

    // Gen 3 Starters
    'Treecko': { evolvesTo: [{ species: 'Grovyle', method: 'level', requirement: 16 }] },
    'Grovyle': { evolvesFrom: { species: 'Treecko', method: 'level', requirement: 16 }, evolvesTo: [{ species: 'Sceptile', method: 'level', requirement: 36 }] },
    'Sceptile': { evolvesFrom: { species: 'Grovyle', method: 'level', requirement: 36 } },

    'Torchic': { evolvesTo: [{ species: 'Combusken', method: 'level', requirement: 16 }] },
    'Combusken': { evolvesFrom: { species: 'Torchic', method: 'level', requirement: 16 }, evolvesTo: [{ species: 'Blaziken', method: 'level', requirement: 36 }] },
    'Blaziken': { evolvesFrom: { species: 'Combusken', method: 'level', requirement: 36 } },

    'Mudkip': { evolvesTo: [{ species: 'Marshtomp', method: 'level', requirement: 16 }] },
    'Marshtomp': { evolvesFrom: { species: 'Mudkip', method: 'level', requirement: 16 }, evolvesTo: [{ species: 'Swampert', method: 'level', requirement: 36 }] },
    'Swampert': { evolvesFrom: { species: 'Marshtomp', method: 'level', requirement: 36 } },

    // Lotad line
    'Lotad': { evolvesTo: [{ species: 'Lombre', method: 'level', requirement: 14 }] },
    'Lombre': { evolvesFrom: { species: 'Lotad', method: 'level', requirement: 14 }, evolvesTo: [{ species: 'Ludicolo', method: 'stone', requirement: 'Water Stone' }] },
    'Ludicolo': { evolvesFrom: { species: 'Lombre', method: 'stone', requirement: 'Water Stone' } },

    // Ralts line
    'Ralts': { evolvesTo: [{ species: 'Kirlia', method: 'level', requirement: 20 }] },
    'Kirlia': { evolvesFrom: { species: 'Ralts', method: 'level', requirement: 20 }, evolvesTo: [
        { species: 'Gardevoir', method: 'level', requirement: 30 },
        { species: 'Gallade', method: 'stone', requirement: 'Dawn Stone', note: 'Male only' }
    ]},
    'Gardevoir': { evolvesFrom: { species: 'Kirlia', method: 'level', requirement: 30 } },
    'Gallade': { evolvesFrom: { species: 'Kirlia', method: 'stone', requirement: 'Dawn Stone' } },

    // Slakoth line
    'Slakoth': { evolvesTo: [{ species: 'Vigoroth', method: 'level', requirement: 18 }] },
    'Vigoroth': { evolvesFrom: { species: 'Slakoth', method: 'level', requirement: 18 }, evolvesTo: [{ species: 'Slaking', method: 'level', requirement: 36 }] },
    'Slaking': { evolvesFrom: { species: 'Vigoroth', method: 'level', requirement: 36 } },

    // Aron line
    'Aron': { evolvesTo: [{ species: 'Lairon', method: 'level', requirement: 32 }] },
    'Lairon': { evolvesFrom: { species: 'Aron', method: 'level', requirement: 32 }, evolvesTo: [{ species: 'Aggron', method: 'level', requirement: 42 }] },
    'Aggron': { evolvesFrom: { species: 'Lairon', method: 'level', requirement: 42 } },

    // Roselia line
    'Budew': { evolvesTo: [{ species: 'Roselia', method: 'happiness', requirement: 'High Happiness (Day)' }] },
    'Roselia': { evolvesFrom: { species: 'Budew', method: 'happiness', requirement: 'High Happiness (Day)' }, evolvesTo: [{ species: 'Roserade', method: 'stone', requirement: 'Shiny Stone' }] },
    'Roserade': { evolvesFrom: { species: 'Roselia', method: 'stone', requirement: 'Shiny Stone' } },

    // Swablu line
    'Swablu': { evolvesTo: [{ species: 'Altaria', method: 'level', requirement: 35 }] },
    'Altaria': { evolvesFrom: { species: 'Swablu', method: 'level', requirement: 35 } },

    // Feebas line
    'Feebas': { evolvesTo: [{ species: 'Milotic', method: 'other', requirement: 'High Beauty / Prism Scale' }] },
    'Milotic': { evolvesFrom: { species: 'Feebas', method: 'other', requirement: 'High Beauty / Prism Scale' } },

    // Snorunt line
    'Snorunt': { evolvesTo: [
        { species: 'Glalie', method: 'level', requirement: 42 },
        { species: 'Froslass', method: 'stone', requirement: 'Dawn Stone', note: 'Female only' }
    ]},
    'Glalie': { evolvesFrom: { species: 'Snorunt', method: 'level', requirement: 42 } },
    'Froslass': { evolvesFrom: { species: 'Snorunt', method: 'stone', requirement: 'Dawn Stone' } },

    // Bagon line
    'Bagon': { evolvesTo: [{ species: 'Shelgon', method: 'level', requirement: 30 }] },
    'Shelgon': { evolvesFrom: { species: 'Bagon', method: 'level', requirement: 30 }, evolvesTo: [{ species: 'Salamence', method: 'level', requirement: 50 }] },
    'Salamence': { evolvesFrom: { species: 'Shelgon', method: 'level', requirement: 50 } },

    // Beldum line
    'Beldum': { evolvesTo: [{ species: 'Metang', method: 'level', requirement: 20 }] },
    'Metang': { evolvesFrom: { species: 'Beldum', method: 'level', requirement: 20 }, evolvesTo: [{ species: 'Metagross', method: 'level', requirement: 45 }] },
    'Metagross': { evolvesFrom: { species: 'Metang', method: 'level', requirement: 45 } },

    // Gen 4 Starters
    'Turtwig': { evolvesTo: [{ species: 'Grotle', method: 'level', requirement: 18 }] },
    'Grotle': { evolvesFrom: { species: 'Turtwig', method: 'level', requirement: 18 }, evolvesTo: [{ species: 'Torterra', method: 'level', requirement: 32 }] },
    'Torterra': { evolvesFrom: { species: 'Grotle', method: 'level', requirement: 32 } },

    'Chimchar': { evolvesTo: [{ species: 'Monferno', method: 'level', requirement: 14 }] },
    'Monferno': { evolvesFrom: { species: 'Chimchar', method: 'level', requirement: 14 }, evolvesTo: [{ species: 'Infernape', method: 'level', requirement: 36 }] },
    'Infernape': { evolvesFrom: { species: 'Monferno', method: 'level', requirement: 36 } },

    'Piplup': { evolvesTo: [{ species: 'Prinplup', method: 'level', requirement: 16 }] },
    'Prinplup': { evolvesFrom: { species: 'Piplup', method: 'level', requirement: 16 }, evolvesTo: [{ species: 'Empoleon', method: 'level', requirement: 36 }] },
    'Empoleon': { evolvesFrom: { species: 'Prinplup', method: 'level', requirement: 36 } },

    // Shinx line
    'Shinx': { evolvesTo: [{ species: 'Luxio', method: 'level', requirement: 15 }] },
    'Luxio': { evolvesFrom: { species: 'Shinx', method: 'level', requirement: 15 }, evolvesTo: [{ species: 'Luxray', method: 'level', requirement: 30 }] },
    'Luxray': { evolvesFrom: { species: 'Luxio', method: 'level', requirement: 30 } },

    // Gible line
    'Gible': { evolvesTo: [{ species: 'Gabite', method: 'level', requirement: 24 }] },
    'Gabite': { evolvesFrom: { species: 'Gible', method: 'level', requirement: 24 }, evolvesTo: [{ species: 'Garchomp', method: 'level', requirement: 48 }] },
    'Garchomp': { evolvesFrom: { species: 'Gabite', method: 'level', requirement: 48 } },

    // Riolu line
    'Riolu': { evolvesTo: [{ species: 'Lucario', method: 'happiness', requirement: 'High Happiness (Day)' }] },
    'Lucario': { evolvesFrom: { species: 'Riolu', method: 'happiness', requirement: 'High Happiness (Day)' } },

    // Snover line
    'Snover': { evolvesTo: [{ species: 'Abomasnow', method: 'level', requirement: 40 }] },
    'Abomasnow': { evolvesFrom: { species: 'Snover', method: 'level', requirement: 40 } },

    // Pansage/Simisage line
    'Pansage': { evolvesTo: [{ species: 'Simisage', method: 'stone', requirement: 'Leaf Stone' }] },
    'Simisage': { evolvesFrom: { species: 'Pansage', method: 'stone', requirement: 'Leaf Stone' } },

    // Pansear/Simisear line
    'Pansear': { evolvesTo: [{ species: 'Simisear', method: 'stone', requirement: 'Fire Stone' }] },
    'Simisear': { evolvesFrom: { species: 'Pansear', method: 'stone', requirement: 'Fire Stone' } },

    // Panpour/Simipour line
    'Panpour': { evolvesTo: [{ species: 'Simipour', method: 'stone', requirement: 'Water Stone' }] },
    'Simipour': { evolvesFrom: { species: 'Panpour', method: 'stone', requirement: 'Water Stone' } },

    // Munna line
    'Munna': { evolvesTo: [{ species: 'Musharna', method: 'stone', requirement: 'Moon Stone' }] },
    'Musharna': { evolvesFrom: { species: 'Munna', method: 'stone', requirement: 'Moon Stone' } },

    // Minccino line
    'Minccino': { evolvesTo: [{ species: 'Cinccino', method: 'stone', requirement: 'Shiny Stone' }] },
    'Cinccino': { evolvesFrom: { species: 'Minccino', method: 'stone', requirement: 'Shiny Stone' } },

    // Litwick line
    'Litwick': { evolvesTo: [{ species: 'Lampent', method: 'level', requirement: 41 }] },
    'Lampent': { evolvesFrom: { species: 'Litwick', method: 'level', requirement: 41 }, evolvesTo: [{ species: 'Chandelure', method: 'stone', requirement: 'Dusk Stone' }] },
    'Chandelure': { evolvesFrom: { species: 'Lampent', method: 'stone', requirement: 'Dusk Stone' } },

    // Axew line
    'Axew': { evolvesTo: [{ species: 'Fraxure', method: 'level', requirement: 38 }] },
    'Fraxure': { evolvesFrom: { species: 'Axew', method: 'level', requirement: 38 }, evolvesTo: [{ species: 'Haxorus', method: 'level', requirement: 48 }] },
    'Haxorus': { evolvesFrom: { species: 'Fraxure', method: 'level', requirement: 48 } },

    // Deino line
    'Deino': { evolvesTo: [{ species: 'Zweilous', method: 'level', requirement: 50 }] },
    'Zweilous': { evolvesFrom: { species: 'Deino', method: 'level', requirement: 50 }, evolvesTo: [{ species: 'Hydreigon', method: 'level', requirement: 64 }] },
    'Hydreigon': { evolvesFrom: { species: 'Zweilous', method: 'level', requirement: 64 } },

    // Skitty line
    'Skitty': { evolvesTo: [{ species: 'Delcatty', method: 'stone', requirement: 'Moon Stone' }] },
    'Delcatty': { evolvesFrom: { species: 'Skitty', method: 'stone', requirement: 'Moon Stone' } },

    // Helioptile line
    'Helioptile': { evolvesTo: [{ species: 'Heliolisk', method: 'stone', requirement: 'Sun Stone' }] },
    'Heliolisk': { evolvesFrom: { species: 'Helioptile', method: 'stone', requirement: 'Sun Stone' } },

    // Flabebe line
    'Flabébé': { evolvesTo: [{ species: 'Floette', method: 'level', requirement: 19 }] },
    'Floette': { evolvesFrom: { species: 'Flabébé', method: 'level', requirement: 19 }, evolvesTo: [{ species: 'Florges', method: 'stone', requirement: 'Shiny Stone' }] },
    'Florges': { evolvesFrom: { species: 'Floette', method: 'stone', requirement: 'Shiny Stone' } },

    // Goomy line
    'Goomy': { evolvesTo: [{ species: 'Sliggoo', method: 'level', requirement: 40 }] },
    'Sliggoo': { evolvesFrom: { species: 'Goomy', method: 'level', requirement: 40 }, evolvesTo: [{ species: 'Goodra', method: 'level', requirement: 50, note: 'In rain' }] },
    'Goodra': { evolvesFrom: { species: 'Sliggoo', method: 'level', requirement: 50 } },

    // Rattata line (with Alolan)
    'Rattata': { evolvesTo: [{ species: 'Raticate', method: 'level', requirement: 20 }] },
    'Raticate': { evolvesFrom: { species: 'Rattata', method: 'level', requirement: 20 } },

    // Meowth line (with Alolan)
    'Meowth': { evolvesTo: [{ species: 'Persian', method: 'level', requirement: 28 }] },
    'Persian': { evolvesFrom: { species: 'Meowth', method: 'level', requirement: 28 } },

    // Diglett line (with Alolan)
    'Diglett': { evolvesTo: [{ species: 'Dugtrio', method: 'level', requirement: 26 }] },
    'Dugtrio': { evolvesFrom: { species: 'Diglett', method: 'level', requirement: 26 } },

    // Rockruff line (with form choices)
    'Rockruff': { evolvesTo: [
        { species: 'Lycanroc', method: 'level', requirement: 25, note: 'Day Form' },
        { species: 'Lycanroc', method: 'level', requirement: 25, regionalForm: 'Night', note: 'Night Form' },
        { species: 'Lycanroc', method: 'level', requirement: 25, regionalForm: 'Dusk', note: 'Dusk Form' }
    ]},
    'Lycanroc': { evolvesFrom: { species: 'Rockruff', method: 'level', requirement: 25 } },

    // Pumpkaboo line (size form preserved on evolution)
    'Pumpkaboo': { evolvesTo: [{ species: 'Gourgeist', method: 'level', requirement: 25 }] },
    'Gourgeist': { evolvesFrom: { species: 'Pumpkaboo', method: 'level', requirement: 25 } },

    // Gen 7 Starters
    'Rowlet': { evolvesTo: [{ species: 'Dartrix', method: 'level', requirement: 17 }] },
    'Dartrix': { evolvesFrom: { species: 'Rowlet', method: 'level', requirement: 17 }, evolvesTo: [{ species: 'Decidueye', method: 'level', requirement: 34 }] },
    'Decidueye': { evolvesFrom: { species: 'Dartrix', method: 'level', requirement: 34 } },

    'Litten': { evolvesTo: [{ species: 'Torracat', method: 'level', requirement: 17 }] },
    'Torracat': { evolvesFrom: { species: 'Litten', method: 'level', requirement: 17 }, evolvesTo: [{ species: 'Incineroar', method: 'level', requirement: 34 }] },
    'Incineroar': { evolvesFrom: { species: 'Torracat', method: 'level', requirement: 34 } },

    'Popplio': { evolvesTo: [{ species: 'Brionne', method: 'level', requirement: 17 }] },
    'Brionne': { evolvesFrom: { species: 'Popplio', method: 'level', requirement: 17 }, evolvesTo: [{ species: 'Primarina', method: 'level', requirement: 34 }] },
    'Primarina': { evolvesFrom: { species: 'Brionne', method: 'level', requirement: 34 } },

    // Pikipek line
    'Pikipek': { evolvesTo: [{ species: 'Trumbeak', method: 'level', requirement: 14 }] },
    'Trumbeak': { evolvesFrom: { species: 'Pikipek', method: 'level', requirement: 14 }, evolvesTo: [{ species: 'Toucannon', method: 'level', requirement: 28 }] },
    'Toucannon': { evolvesFrom: { species: 'Trumbeak', method: 'level', requirement: 28 } },

    // Yungoos line
    'Yungoos': { evolvesTo: [{ species: 'Gumshoos', method: 'level', requirement: 20 }] },
    'Gumshoos': { evolvesFrom: { species: 'Yungoos', method: 'level', requirement: 20 } },

    // Grubbin line
    'Grubbin': { evolvesTo: [{ species: 'Charjabug', method: 'level', requirement: 20 }] },
    'Charjabug': { evolvesFrom: { species: 'Grubbin', method: 'level', requirement: 20 }, evolvesTo: [{ species: 'Vikavolt', method: 'stone', requirement: 'Thunder Stone' }] },
    'Vikavolt': { evolvesFrom: { species: 'Charjabug', method: 'stone', requirement: 'Thunder Stone' } },

    // Cutiefly line
    'Cutiefly': { evolvesTo: [{ species: 'Ribombee', method: 'level', requirement: 25 }] },
    'Ribombee': { evolvesFrom: { species: 'Cutiefly', method: 'level', requirement: 25 } },

    // Crabrawler line
    'Crabrawler': { evolvesTo: [{ species: 'Crabominable', method: 'stone', requirement: 'Ice Stone' }] },
    'Crabominable': { evolvesFrom: { species: 'Crabrawler', method: 'stone', requirement: 'Ice Stone' } },

    // Mareanie line
    'Mareanie': { evolvesTo: [{ species: 'Toxapex', method: 'level', requirement: 38 }] },
    'Toxapex': { evolvesFrom: { species: 'Mareanie', method: 'level', requirement: 38 } },

    // Mudbray line
    'Mudbray': { evolvesTo: [{ species: 'Mudsdale', method: 'level', requirement: 30 }] },
    'Mudsdale': { evolvesFrom: { species: 'Mudbray', method: 'level', requirement: 30 } },

    // Dewpider line
    'Dewpider': { evolvesTo: [{ species: 'Araquanid', method: 'level', requirement: 22 }] },
    'Araquanid': { evolvesFrom: { species: 'Dewpider', method: 'level', requirement: 22 } },

    // Fomantis line
    'Fomantis': { evolvesTo: [{ species: 'Lurantis', method: 'level', requirement: 34 }] },
    'Lurantis': { evolvesFrom: { species: 'Fomantis', method: 'level', requirement: 34 } },

    // Morelull line
    'Morelull': { evolvesTo: [{ species: 'Shiinotic', method: 'level', requirement: 24 }] },
    'Shiinotic': { evolvesFrom: { species: 'Morelull', method: 'level', requirement: 24 } },

    // Salandit line
    'Salandit': { evolvesTo: [{ species: 'Salazzle', method: 'level', requirement: 33, note: 'Female only' }] },
    'Salazzle': { evolvesFrom: { species: 'Salandit', method: 'level', requirement: 33 } },

    // Stufful line
    'Stufful': { evolvesTo: [{ species: 'Bewear', method: 'level', requirement: 27 }] },
    'Bewear': { evolvesFrom: { species: 'Stufful', method: 'level', requirement: 27 } },

    // Bounsweet line
    'Bounsweet': { evolvesTo: [{ species: 'Steenee', method: 'level', requirement: 18 }] },
    'Steenee': { evolvesFrom: { species: 'Bounsweet', method: 'level', requirement: 18 }, evolvesTo: [{ species: 'Tsareena', method: 'other', requirement: 'Knows Stomp' }] },
    'Tsareena': { evolvesFrom: { species: 'Steenee', method: 'other', requirement: 'Knows Stomp' } },

    // Wimpod line
    'Wimpod': { evolvesTo: [{ species: 'Golisopod', method: 'level', requirement: 30 }] },
    'Golisopod': { evolvesFrom: { species: 'Wimpod', method: 'level', requirement: 30 } },

    // Sandygast line
    'Sandygast': { evolvesTo: [{ species: 'Palossand', method: 'level', requirement: 42 }] },
    'Palossand': { evolvesFrom: { species: 'Sandygast', method: 'level', requirement: 42 } },

    // Type: Null line
    'Type: Null': { evolvesTo: [{ species: 'Silvally', method: 'happiness', requirement: 'High Friendship' }] },
    'Silvally': { evolvesFrom: { species: 'Type: Null', method: 'happiness', requirement: 'High Friendship' } },

    // Jangmo-o line
    'Jangmo-O': { evolvesTo: [{ species: 'Hakamo-O', method: 'level', requirement: 35 }] },
    'Hakamo-O': { evolvesFrom: { species: 'Jangmo-O', method: 'level', requirement: 35 }, evolvesTo: [{ species: 'Kommo-O', method: 'level', requirement: 45 }] },
    'Kommo-O': { evolvesFrom: { species: 'Hakamo-O', method: 'level', requirement: 45 } },

    // Cosmog line
    'Cosmog': { evolvesTo: [{ species: 'Cosmoem', method: 'level', requirement: 43 }] },
    'Cosmoem': { evolvesFrom: { species: 'Cosmog', method: 'level', requirement: 43 }, evolvesTo: [
        { species: 'Solgaleo', method: 'level', requirement: 53, note: 'Sun' },
        { species: 'Lunala', method: 'level', requirement: 53, note: 'Moon' }
    ]},
    'Solgaleo': { evolvesFrom: { species: 'Cosmoem', method: 'level', requirement: 53 } },
    'Lunala': { evolvesFrom: { species: 'Cosmoem', method: 'level', requirement: 53 } },

    // Poipole line
    'Poipole': { evolvesTo: [{ species: 'Naganadel', method: 'other', requirement: 'Knows Dragon Pulse' }] },
    'Naganadel': { evolvesFrom: { species: 'Poipole', method: 'other', requirement: 'Knows Dragon Pulse' } },

    // Meltan line
    'Meltan': { evolvesTo: [{ species: 'Melmetal', method: 'level', requirement: 40 }] },
    'Melmetal': { evolvesFrom: { species: 'Meltan', method: 'level', requirement: 40 } },

    // Note: Zygarde forms (10%, Complete) are battle-only transformations handled via BATTLE_FORM_CHANGES in BattleTab.

    // ── Gen 1 missing lines ────────────────────────────────────────────────

    // Pidgey line
    'Pidgey': { evolvesTo: [{ species: 'Pidgeotto', method: 'level', requirement: 18 }] },
    'Pidgeotto': { evolvesFrom: { species: 'Pidgey', method: 'level', requirement: 18 }, evolvesTo: [{ species: 'Pidgeot', method: 'level', requirement: 36 }] },
    'Pidgeot': { evolvesFrom: { species: 'Pidgeotto', method: 'level', requirement: 36 } },

    // Spearow line
    'Spearow': { evolvesTo: [{ species: 'Fearow', method: 'level', requirement: 20 }] },
    'Fearow': { evolvesFrom: { species: 'Spearow', method: 'level', requirement: 20 } },

    // Ekans line
    'Ekans': { evolvesTo: [{ species: 'Arbok', method: 'level', requirement: 22 }] },
    'Arbok': { evolvesFrom: { species: 'Ekans', method: 'level', requirement: 22 } },

    // Nidoran lines
    'Nidoran-F': { evolvesTo: [{ species: 'Nidorina', method: 'level', requirement: 16 }] },
    'Nidorina': { evolvesFrom: { species: 'Nidoran-F', method: 'level', requirement: 16 }, evolvesTo: [{ species: 'Nidoqueen', method: 'stone', requirement: 'Moon Stone' }] },
    'Nidoqueen': { evolvesFrom: { species: 'Nidorina', method: 'stone', requirement: 'Moon Stone' } },
    'Nidoran-M': { evolvesTo: [{ species: 'Nidorino', method: 'level', requirement: 16 }] },
    'Nidorino': { evolvesFrom: { species: 'Nidoran-M', method: 'level', requirement: 16 }, evolvesTo: [{ species: 'Nidoking', method: 'stone', requirement: 'Moon Stone' }] },
    'Nidoking': { evolvesFrom: { species: 'Nidorino', method: 'stone', requirement: 'Moon Stone' } },

    // Caterpie line
    'Caterpie': { evolvesTo: [{ species: 'Metapod', method: 'level', requirement: 7 }] },
    'Metapod': { evolvesFrom: { species: 'Caterpie', method: 'level', requirement: 7 }, evolvesTo: [{ species: 'Butterfree', method: 'level', requirement: 10 }] },
    'Butterfree': { evolvesFrom: { species: 'Metapod', method: 'level', requirement: 10 } },

    // Weedle line
    'Weedle': { evolvesTo: [{ species: 'Kakuna', method: 'level', requirement: 7 }] },
    'Kakuna': { evolvesFrom: { species: 'Weedle', method: 'level', requirement: 7 }, evolvesTo: [{ species: 'Beedrill', method: 'level', requirement: 10 }] },
    'Beedrill': { evolvesFrom: { species: 'Kakuna', method: 'level', requirement: 10 } },

    // Zubat line
    'Zubat': { evolvesTo: [{ species: 'Golbat', method: 'level', requirement: 22 }] },
    'Golbat': { evolvesFrom: { species: 'Zubat', method: 'level', requirement: 22 }, evolvesTo: [{ species: 'Crobat', method: 'happiness', requirement: 'High Happiness' }] },
    'Crobat': { evolvesFrom: { species: 'Golbat', method: 'happiness', requirement: 'High Happiness' } },

    // Bellsprout line
    'Bellsprout': { evolvesTo: [{ species: 'Weepinbell', method: 'level', requirement: 21 }] },
    'Weepinbell': { evolvesFrom: { species: 'Bellsprout', method: 'level', requirement: 21 }, evolvesTo: [{ species: 'Victreebel', method: 'stone', requirement: 'Leaf Stone' }] },
    'Victreebel': { evolvesFrom: { species: 'Weepinbell', method: 'stone', requirement: 'Leaf Stone' } },

    // Tentacool line
    'Tentacool': { evolvesTo: [{ species: 'Tentacruel', method: 'level', requirement: 30 }] },
    'Tentacruel': { evolvesFrom: { species: 'Tentacool', method: 'level', requirement: 30 } },

    // Doduo line
    'Doduo': { evolvesTo: [{ species: 'Dodrio', method: 'level', requirement: 31 }] },
    'Dodrio': { evolvesFrom: { species: 'Doduo', method: 'level', requirement: 31 } },

    // Seel line
    'Seel': { evolvesTo: [{ species: 'Dewgong', method: 'level', requirement: 34 }] },
    'Dewgong': { evolvesFrom: { species: 'Seel', method: 'level', requirement: 34 } },

    // Voltorb line
    'Voltorb': { evolvesTo: [{ species: 'Electrode', method: 'level', requirement: 30 }] },
    'Electrode': { evolvesFrom: { species: 'Voltorb', method: 'level', requirement: 30 } },

    // Krabby line
    'Krabby': { evolvesTo: [{ species: 'Kingler', method: 'level', requirement: 28 }] },
    'Kingler': { evolvesFrom: { species: 'Krabby', method: 'level', requirement: 28 } },

    // Goldeen line
    'Goldeen': { evolvesTo: [{ species: 'Seaking', method: 'level', requirement: 33 }] },
    'Seaking': { evolvesFrom: { species: 'Goldeen', method: 'level', requirement: 33 } },

    // Omanyte line
    'Omanyte': { evolvesTo: [{ species: 'Omastar', method: 'level', requirement: 40 }] },
    'Omastar': { evolvesFrom: { species: 'Omanyte', method: 'level', requirement: 40 } },

    // Kabuto line
    'Kabuto': { evolvesTo: [{ species: 'Kabutops', method: 'level', requirement: 40 }] },
    'Kabutops': { evolvesFrom: { species: 'Kabuto', method: 'level', requirement: 40 } },

    // Jynx line
    'Smoochum': { evolvesTo: [{ species: 'Jynx', method: 'level', requirement: 30 }] },
    'Jynx': { evolvesFrom: { species: 'Smoochum', method: 'level', requirement: 30 } },

    // Mr. Mime line
    'Mime Jr.': { evolvesTo: [{ species: 'Mr. Mime', method: 'other', requirement: 'Knows Mimic' }] },
    'Mr. Mime': { evolvesFrom: { species: 'Mime Jr.', method: 'other', requirement: 'Knows Mimic' } },

    // Tangela line
    'Tangela': { evolvesTo: [{ species: 'Tangrowth', method: 'other', requirement: 'Knows Ancient Power' }] },
    'Tangrowth': { evolvesFrom: { species: 'Tangela', method: 'other', requirement: 'Knows Ancient Power' } },

    // Natu line
    'Natu': { evolvesTo: [{ species: 'Xatu', method: 'level', requirement: 25 }] },
    'Xatu': { evolvesFrom: { species: 'Natu', method: 'level', requirement: 25 } },

    // Aipom line
    'Aipom': { evolvesTo: [{ species: 'Ambipom', method: 'other', requirement: 'Knows Double Hit' }] },
    'Ambipom': { evolvesFrom: { species: 'Aipom', method: 'other', requirement: 'Knows Double Hit' } },

    // Wooper line
    'Wooper': { evolvesTo: [{ species: 'Quagsire', method: 'level', requirement: 20 }] },
    'Quagsire': { evolvesFrom: { species: 'Wooper', method: 'level', requirement: 20 } },

    // Wynaut line
    'Wynaut': { evolvesTo: [{ species: 'Wobbuffet', method: 'level', requirement: 15 }] },
    'Wobbuffet': { evolvesFrom: { species: 'Wynaut', method: 'level', requirement: 15 } },

    // Snubbull line
    'Snubbull': { evolvesTo: [{ species: 'Granbull', method: 'level', requirement: 23 }] },
    'Granbull': { evolvesFrom: { species: 'Snubbull', method: 'level', requirement: 23 } },

    // Spinarak line
    'Spinarak': { evolvesTo: [{ species: 'Ariados', method: 'level', requirement: 22 }] },
    'Ariados': { evolvesFrom: { species: 'Spinarak', method: 'level', requirement: 22 } },

    // Ledyba line
    'Ledyba': { evolvesTo: [{ species: 'Ledian', method: 'level', requirement: 18 }] },
    'Ledian': { evolvesFrom: { species: 'Ledyba', method: 'level', requirement: 18 } },

    // Chinchou line
    'Chinchou': { evolvesTo: [{ species: 'Lanturn', method: 'level', requirement: 27 }] },
    'Lanturn': { evolvesFrom: { species: 'Chinchou', method: 'level', requirement: 27 } },

    // Sentret line
    'Sentret': { evolvesTo: [{ species: 'Furret', method: 'level', requirement: 15 }] },
    'Furret': { evolvesFrom: { species: 'Sentret', method: 'level', requirement: 15 } },

    // Hoothoot line
    'Hoothoot': { evolvesTo: [{ species: 'Noctowl', method: 'level', requirement: 20 }] },
    'Noctowl': { evolvesFrom: { species: 'Hoothoot', method: 'level', requirement: 20 } },

    // Sudowoodo line
    'Bonsly': { evolvesTo: [{ species: 'Sudowoodo', method: 'other', requirement: 'Knows Mimic' }] },
    'Sudowoodo': { evolvesFrom: { species: 'Bonsly', method: 'other', requirement: 'Knows Mimic' } },

    // Yanma line
    'Yanma': { evolvesTo: [{ species: 'Yanmega', method: 'other', requirement: 'Knows Ancient Power' }] },
    'Yanmega': { evolvesFrom: { species: 'Yanma', method: 'other', requirement: 'Knows Ancient Power' } },

    // Steelix line (Onix not in file yet)
    'Onix': { evolvesTo: [{ species: 'Steelix', method: 'trade', requirement: 'Metal Coat' }] },
    'Steelix': { evolvesFrom: { species: 'Onix', method: 'trade', requirement: 'Metal Coat' } },

    // Spoink line
    'Spoink': { evolvesTo: [{ species: 'Grumpig', method: 'level', requirement: 32 }] },
    'Grumpig': { evolvesFrom: { species: 'Spoink', method: 'level', requirement: 32 } },

    // Nosepass line
    'Nosepass': { evolvesTo: [{ species: 'Probopass', method: 'other', requirement: 'Magnetic Field' }] },
    'Probopass': { evolvesFrom: { species: 'Nosepass', method: 'other', requirement: 'Magnetic Field' } },

    // Surskit line
    'Surskit': { evolvesTo: [{ species: 'Masquerain', method: 'level', requirement: 22 }] },
    'Masquerain': { evolvesFrom: { species: 'Surskit', method: 'level', requirement: 22 } },

    // Shroomish line
    'Shroomish': { evolvesTo: [{ species: 'Breloom', method: 'level', requirement: 23 }] },
    'Breloom': { evolvesFrom: { species: 'Shroomish', method: 'level', requirement: 23 } },

    // Whismur line
    'Whismur': { evolvesTo: [{ species: 'Loudred', method: 'level', requirement: 20 }] },
    'Loudred': { evolvesFrom: { species: 'Whismur', method: 'level', requirement: 20 }, evolvesTo: [{ species: 'Exploud', method: 'level', requirement: 40 }] },
    'Exploud': { evolvesFrom: { species: 'Loudred', method: 'level', requirement: 40 } },

    // Makuhita line
    'Makuhita': { evolvesTo: [{ species: 'Hariyama', method: 'level', requirement: 24 }] },
    'Hariyama': { evolvesFrom: { species: 'Makuhita', method: 'level', requirement: 24 } },

    // Nincada line
    'Nincada': { evolvesTo: [
        { species: 'Ninjask', method: 'level', requirement: 20 },
        { species: 'Shedinja', method: 'other', requirement: 'Level 20 with empty party slot and Poké Ball' }
    ]},
    'Ninjask': { evolvesFrom: { species: 'Nincada', method: 'level', requirement: 20 } },
    'Shedinja': { evolvesFrom: { species: 'Nincada', method: 'other', requirement: 'Level 20 with empty party slot and Poké Ball' } },

    // Manectric line
    'Electrike': { evolvesTo: [{ species: 'Manectric', method: 'level', requirement: 26 }] },
    'Manectric': { evolvesFrom: { species: 'Electrike', method: 'level', requirement: 26 } },

    // Carvanha line
    'Carvanha': { evolvesTo: [{ species: 'Sharpedo', method: 'level', requirement: 30 }] },
    'Sharpedo': { evolvesFrom: { species: 'Carvanha', method: 'level', requirement: 30 } },

    // Wailmer line
    'Wailmer': { evolvesTo: [{ species: 'Wailord', method: 'level', requirement: 40 }] },
    'Wailord': { evolvesFrom: { species: 'Wailmer', method: 'level', requirement: 40 } },

    // Numel line
    'Numel': { evolvesTo: [{ species: 'Camerupt', method: 'level', requirement: 33 }] },
    'Camerupt': { evolvesFrom: { species: 'Numel', method: 'level', requirement: 33 } },

    // Slugma line
    'Slugma': { evolvesTo: [{ species: 'Magcargo', method: 'level', requirement: 38 }] },
    'Magcargo': { evolvesFrom: { species: 'Slugma', method: 'level', requirement: 38 } },

    // Torchic/Blaziken already in file — Combee
    'Combee': { evolvesTo: [{ species: 'Vespiquen', method: 'level', requirement: 21, note: 'Female only' }] },
    'Vespiquen': { evolvesFrom: { species: 'Combee', method: 'level', requirement: 21 } },

    // Seedot line
    'Seedot': { evolvesTo: [{ species: 'Nuzleaf', method: 'level', requirement: 14 }] },
    'Nuzleaf': { evolvesFrom: { species: 'Seedot', method: 'level', requirement: 14 }, evolvesTo: [{ species: 'Shiftry', method: 'stone', requirement: 'Leaf Stone' }] },
    'Shiftry': { evolvesFrom: { species: 'Nuzleaf', method: 'stone', requirement: 'Leaf Stone' } },

    // Taillow line
    'Taillow': { evolvesTo: [{ species: 'Swellow', method: 'level', requirement: 22 }] },
    'Swellow': { evolvesFrom: { species: 'Taillow', method: 'level', requirement: 22 } },

    // Wingull line
    'Wingull': { evolvesTo: [{ species: 'Pelipper', method: 'level', requirement: 25 }] },
    'Pelipper': { evolvesFrom: { species: 'Wingull', method: 'level', requirement: 25 } },

    // Cacnea line
    'Cacnea': { evolvesTo: [{ species: 'Cacturne', method: 'level', requirement: 32 }] },
    'Cacturne': { evolvesFrom: { species: 'Cacnea', method: 'level', requirement: 32 } },

    // Mantine line
    'Mantyke': { evolvesTo: [{ species: 'Mantine', method: 'other', requirement: 'Level up with Remoraid in party' }] },
    'Mantine': { evolvesFrom: { species: 'Mantyke', method: 'other', requirement: 'Level up with Remoraid in party' } },

    // Corphish line
    'Corphish': { evolvesTo: [{ species: 'Crawdaunt', method: 'level', requirement: 30 }] },
    'Crawdaunt': { evolvesFrom: { species: 'Corphish', method: 'level', requirement: 30 } },

    // Baltoy line
    'Baltoy': { evolvesTo: [{ species: 'Claydol', method: 'level', requirement: 36 }] },
    'Claydol': { evolvesFrom: { species: 'Baltoy', method: 'level', requirement: 36 } },

    // Lileep line
    'Lileep': { evolvesTo: [{ species: 'Cradily', method: 'level', requirement: 40 }] },
    'Cradily': { evolvesFrom: { species: 'Lileep', method: 'level', requirement: 40 } },

    // Anorith line
    'Anorith': { evolvesTo: [{ species: 'Armaldo', method: 'level', requirement: 40 }] },
    'Armaldo': { evolvesFrom: { species: 'Anorith', method: 'level', requirement: 40 } },

    // Wurmple line
    'Wurmple': { evolvesTo: [
        { species: 'Silcoon', method: 'level', requirement: 7, note: 'Personality dependent' },
        { species: 'Cascoon', method: 'level', requirement: 7, note: 'Personality dependent' }
    ]},
    'Silcoon': { evolvesFrom: { species: 'Wurmple', method: 'level', requirement: 7 }, evolvesTo: [{ species: 'Beautifly', method: 'level', requirement: 10 }] },
    'Beautifly': { evolvesFrom: { species: 'Silcoon', method: 'level', requirement: 10 } },
    'Cascoon': { evolvesFrom: { species: 'Wurmple', method: 'level', requirement: 7 }, evolvesTo: [{ species: 'Dustox', method: 'level', requirement: 10 }] },
    'Dustox': { evolvesFrom: { species: 'Cascoon', method: 'level', requirement: 10 } },

    // Clamperl line
    'Clamperl': { evolvesTo: [
        { species: 'Huntail', method: 'trade', requirement: 'DeepSeaTooth' },
        { species: 'Gorebyss', method: 'trade', requirement: 'DeepSeaScale' }
    ]},
    'Huntail': { evolvesFrom: { species: 'Clamperl', method: 'trade', requirement: 'DeepSeaTooth' } },
    'Gorebyss': { evolvesFrom: { species: 'Clamperl', method: 'trade', requirement: 'DeepSeaScale' } },

    // Luvdisc — no evolution in PTA

    // Remoraid line
    'Remoraid': { evolvesTo: [{ species: 'Octillery', method: 'level', requirement: 25 }] },
    'Octillery': { evolvesFrom: { species: 'Remoraid', method: 'level', requirement: 25 } },

    // Elekid line
    'Elekid': { evolvesTo: [{ species: 'Electabuzz', method: 'level', requirement: 30 }] },
    'Electabuzz': { evolvesFrom: { species: 'Elekid', method: 'level', requirement: 30 }, evolvesTo: [{ species: 'Electivire', method: 'trade', requirement: 'Electirizer' }] },
    'Electivire': { evolvesFrom: { species: 'Electabuzz', method: 'trade', requirement: 'Electirizer' } },

    // Magby line
    'Magby': { evolvesTo: [{ species: 'Magmar', method: 'level', requirement: 30 }] },
    'Magmar': { evolvesFrom: { species: 'Magby', method: 'level', requirement: 30 }, evolvesTo: [{ species: 'Magmortar', method: 'trade', requirement: 'Magmarizer' }] },
    'Magmortar': { evolvesFrom: { species: 'Magmar', method: 'trade', requirement: 'Magmarizer' } },

    // Barboach line
    'Barboach': { evolvesTo: [{ species: 'Whiscash', method: 'level', requirement: 30 }] },
    'Whiscash': { evolvesFrom: { species: 'Barboach', method: 'level', requirement: 30 } },

    // Paras line
    'Paras': { evolvesTo: [{ species: 'Parasect', method: 'level', requirement: 24 }] },
    'Parasect': { evolvesFrom: { species: 'Paras', method: 'level', requirement: 24 } },

    // Venonat line
    'Venonat': { evolvesTo: [{ species: 'Venomoth', method: 'level', requirement: 31 }] },
    'Venomoth': { evolvesFrom: { species: 'Venonat', method: 'level', requirement: 31 } },

    // Mankey line
    'Mankey': { evolvesTo: [{ species: 'Primeape', method: 'level', requirement: 28 }] },
    'Primeape': { evolvesFrom: { species: 'Mankey', method: 'level', requirement: 28 } },

    // Tyrogue line
    'Tyrogue': { evolvesTo: [
        { species: 'Hitmonlee', method: 'other', requirement: 'Level 20, ATK > DEF' },
        { species: 'Hitmonchan', method: 'other', requirement: 'Level 20, DEF > ATK' },
        { species: 'Hitmontop', method: 'other', requirement: 'Level 20, ATK = DEF' }
    ]},
    'Hitmonlee': { evolvesFrom: { species: 'Tyrogue', method: 'other', requirement: 'Level 20, ATK > DEF' } },
    'Hitmonchan': { evolvesFrom: { species: 'Tyrogue', method: 'other', requirement: 'Level 20, DEF > ATK' } },
    'Hitmontop': { evolvesFrom: { species: 'Tyrogue', method: 'other', requirement: 'Level 20, ATK = DEF' } },

    // Lickitung line
    'Lickitung': { evolvesTo: [{ species: 'Lickilicky', method: 'other', requirement: 'Knows Rollout' }] },
    'Lickilicky': { evolvesFrom: { species: 'Lickitung', method: 'other', requirement: 'Knows Rollout' } },

    // Psyduck line
    'Psyduck': { evolvesTo: [{ species: 'Golduck', method: 'level', requirement: 33 }] },
    'Golduck': { evolvesFrom: { species: 'Psyduck', method: 'level', requirement: 33 } },

    // Munchlax line
    'Munchlax': { evolvesTo: [{ species: 'Snorlax', method: 'happiness', requirement: 'High Happiness' }] },
    'Snorlax': { evolvesFrom: { species: 'Munchlax', method: 'happiness', requirement: 'High Happiness' } },

    // Pineco line
    'Pineco': { evolvesTo: [{ species: 'Forretress', method: 'level', requirement: 31 }] },
    'Forretress': { evolvesFrom: { species: 'Pineco', method: 'level', requirement: 31 } },

    // Gligar line
    'Gligar': { evolvesTo: [{ species: 'Gliscor', method: 'other', requirement: 'Razor Fang (Night)' }] },
    'Gliscor': { evolvesFrom: { species: 'Gligar', method: 'other', requirement: 'Razor Fang (Night)' } },

    // Phanpy line
    'Phanpy': { evolvesTo: [{ species: 'Donphan', method: 'level', requirement: 25 }] },
    'Donphan': { evolvesFrom: { species: 'Phanpy', method: 'level', requirement: 25 } },

    // Houndour line
    'Houndour': { evolvesTo: [{ species: 'Houndoom', method: 'level', requirement: 24 }] },
    'Houndoom': { evolvesFrom: { species: 'Houndour', method: 'level', requirement: 24 } },

    // Swinub → already in file (Piloswine→Mamoswine). Skipping.
    // Corsola — no evolution in PTA

    // Chingling line
    'Chingling': { evolvesTo: [{ species: 'Chimecho', method: 'happiness', requirement: 'High Happiness (Night)' }] },
    'Chimecho': { evolvesFrom: { species: 'Chingling', method: 'happiness', requirement: 'High Happiness (Night)' } },

    // Zigzagoon line
    'Zigzagoon': { evolvesTo: [{ species: 'Linoone', method: 'level', requirement: 20 }] },
    'Linoone': { evolvesFrom: { species: 'Zigzagoon', method: 'level', requirement: 20 } },

    // Buizel line
    'Buizel': { evolvesTo: [{ species: 'Floatzel', method: 'level', requirement: 26 }] },
    'Floatzel': { evolvesFrom: { species: 'Buizel', method: 'level', requirement: 26 } },

    // Shellos line
    'Shellos': { evolvesTo: [{ species: 'Gastrodon', method: 'level', requirement: 30 }] },
    'Gastrodon': { evolvesFrom: { species: 'Shellos', method: 'level', requirement: 30 } },

    // Finneon line
    'Finneon': { evolvesTo: [{ species: 'Lumineon', method: 'level', requirement: 31 }] },
    'Lumineon': { evolvesFrom: { species: 'Finneon', method: 'level', requirement: 31 } },

    // Starly line
    'Starly': { evolvesTo: [{ species: 'Staravia', method: 'level', requirement: 14 }] },
    'Staravia': { evolvesFrom: { species: 'Starly', method: 'level', requirement: 14 }, evolvesTo: [{ species: 'Staraptor', method: 'level', requirement: 34 }] },
    'Staraptor': { evolvesFrom: { species: 'Staravia', method: 'level', requirement: 34 } },

    // Bidoof line
    'Bidoof': { evolvesTo: [{ species: 'Bibarel', method: 'level', requirement: 15 }] },
    'Bibarel': { evolvesFrom: { species: 'Bidoof', method: 'level', requirement: 15 } },

    // Cranidos line
    'Cranidos': { evolvesTo: [{ species: 'Rampardos', method: 'level', requirement: 30 }] },
    'Rampardos': { evolvesFrom: { species: 'Cranidos', method: 'level', requirement: 30 } },

    // Shieldon line
    'Shieldon': { evolvesTo: [{ species: 'Bastiodon', method: 'level', requirement: 30 }] },
    'Bastiodon': { evolvesFrom: { species: 'Shieldon', method: 'level', requirement: 30 } },

    // Bronzor line
    'Bronzor': { evolvesTo: [{ species: 'Bronzong', method: 'level', requirement: 33 }] },
    'Bronzong': { evolvesFrom: { species: 'Bronzor', method: 'level', requirement: 33 } },

    // Hippopotas line
    'Hippopotas': { evolvesTo: [{ species: 'Hippowdon', method: 'level', requirement: 34 }] },
    'Hippowdon': { evolvesFrom: { species: 'Hippopotas', method: 'level', requirement: 34 } },

    // Skorupi line
    'Skorupi': { evolvesTo: [{ species: 'Drapion', method: 'level', requirement: 40 }] },
    'Drapion': { evolvesFrom: { species: 'Skorupi', method: 'level', requirement: 40 } },

    // Croagunk line
    'Croagunk': { evolvesTo: [{ species: 'Toxicroak', method: 'level', requirement: 37 }] },
    'Toxicroak': { evolvesFrom: { species: 'Croagunk', method: 'level', requirement: 37 } },

    // Duskull line
    'Duskull': { evolvesTo: [{ species: 'Dusclops', method: 'level', requirement: 37 }] },
    'Dusclops': { evolvesFrom: { species: 'Duskull', method: 'level', requirement: 37 }, evolvesTo: [{ species: 'Dusknoir', method: 'trade', requirement: 'Reaper Cloth' }] },
    'Dusknoir': { evolvesFrom: { species: 'Dusclops', method: 'trade', requirement: 'Reaper Cloth' } },

    // Shuppet line
    'Shuppet': { evolvesTo: [{ species: 'Banette', method: 'level', requirement: 37 }] },
    'Banette': { evolvesFrom: { species: 'Shuppet', method: 'level', requirement: 37 } },

    // Drifloon line
    'Drifloon': { evolvesTo: [{ species: 'Drifblim', method: 'level', requirement: 28 }] },
    'Drifblim': { evolvesFrom: { species: 'Drifloon', method: 'level', requirement: 28 } },

    // Buneary line
    'Buneary': { evolvesTo: [{ species: 'Lopunny', method: 'happiness', requirement: 'High Happiness' }] },
    'Lopunny': { evolvesFrom: { species: 'Buneary', method: 'happiness', requirement: 'High Happiness' } },

    // Glameow line
    'Glameow': { evolvesTo: [{ species: 'Purugly', method: 'level', requirement: 38 }] },
    'Purugly': { evolvesFrom: { species: 'Glameow', method: 'level', requirement: 38 } },

    // Kricketot line
    'Kricketot': { evolvesTo: [{ species: 'Kricketune', method: 'level', requirement: 10 }] },
    'Kricketune': { evolvesFrom: { species: 'Kricketot', method: 'level', requirement: 10 } },

    // Stunky line
    'Stunky': { evolvesTo: [{ species: 'Skuntank', method: 'level', requirement: 34 }] },
    'Skuntank': { evolvesFrom: { species: 'Stunky', method: 'level', requirement: 34 } },

    // ── Gen 5 ─────────────────────────────────────────────────────────────

    // Gen 5 starters
    'Snivy': { evolvesTo: [{ species: 'Servine', method: 'level', requirement: 17 }] },
    'Servine': { evolvesFrom: { species: 'Snivy', method: 'level', requirement: 17 }, evolvesTo: [{ species: 'Serperior', method: 'level', requirement: 36 }] },
    'Serperior': { evolvesFrom: { species: 'Servine', method: 'level', requirement: 36 } },

    'Tepig': { evolvesTo: [{ species: 'Pignite', method: 'level', requirement: 17 }] },
    'Pignite': { evolvesFrom: { species: 'Tepig', method: 'level', requirement: 17 }, evolvesTo: [{ species: 'Emboar', method: 'level', requirement: 36 }] },
    'Emboar': { evolvesFrom: { species: 'Pignite', method: 'level', requirement: 36 } },

    'Oshawott': { evolvesTo: [{ species: 'Dewott', method: 'level', requirement: 17 }] },
    'Dewott': { evolvesFrom: { species: 'Oshawott', method: 'level', requirement: 17 }, evolvesTo: [{ species: 'Samurott', method: 'level', requirement: 36 }] },
    'Samurott': { evolvesFrom: { species: 'Dewott', method: 'level', requirement: 36 } },

    // Patrat line
    'Patrat': { evolvesTo: [{ species: 'Watchog', method: 'level', requirement: 20 }] },
    'Watchog': { evolvesFrom: { species: 'Patrat', method: 'level', requirement: 20 } },

    // Lillipup line
    'Lillipup': { evolvesTo: [{ species: 'Herdier', method: 'level', requirement: 16 }] },
    'Herdier': { evolvesFrom: { species: 'Lillipup', method: 'level', requirement: 16 }, evolvesTo: [{ species: 'Stoutland', method: 'level', requirement: 32 }] },
    'Stoutland': { evolvesFrom: { species: 'Herdier', method: 'level', requirement: 32 } },

    // Purrloin line
    'Purrloin': { evolvesTo: [{ species: 'Liepard', method: 'level', requirement: 20 }] },
    'Liepard': { evolvesFrom: { species: 'Purrloin', method: 'level', requirement: 20 } },

    // Pidove line
    'Pidove': { evolvesTo: [{ species: 'Tranquill', method: 'level', requirement: 21 }] },
    'Tranquill': { evolvesFrom: { species: 'Pidove', method: 'level', requirement: 21 }, evolvesTo: [{ species: 'Unfezant', method: 'level', requirement: 32 }] },
    'Unfezant': { evolvesFrom: { species: 'Tranquill', method: 'level', requirement: 32 } },

    // Blitzle line
    'Blitzle': { evolvesTo: [{ species: 'Zebstrika', method: 'level', requirement: 27 }] },
    'Zebstrika': { evolvesFrom: { species: 'Blitzle', method: 'level', requirement: 27 } },

    // Roggenrola line
    'Roggenrola': { evolvesTo: [{ species: 'Boldore', method: 'level', requirement: 25 }] },
    'Boldore': { evolvesFrom: { species: 'Roggenrola', method: 'level', requirement: 25 }, evolvesTo: [{ species: 'Gigalith', method: 'trade', requirement: 'Trade' }] },
    'Gigalith': { evolvesFrom: { species: 'Boldore', method: 'trade', requirement: 'Trade' } },

    // Woobat line
    'Woobat': { evolvesTo: [{ species: 'Swoobat', method: 'happiness', requirement: 'High Happiness' }] },
    'Swoobat': { evolvesFrom: { species: 'Woobat', method: 'happiness', requirement: 'High Happiness' } },

    // Drilbur line
    'Drilbur': { evolvesTo: [{ species: 'Excadrill', method: 'level', requirement: 31 }] },
    'Excadrill': { evolvesFrom: { species: 'Drilbur', method: 'level', requirement: 31 } },

    // Timburr line
    'Timburr': { evolvesTo: [{ species: 'Gurdurr', method: 'level', requirement: 25 }] },
    'Gurdurr': { evolvesFrom: { species: 'Timburr', method: 'level', requirement: 25 }, evolvesTo: [{ species: 'Conkeldurr', method: 'trade', requirement: 'Trade' }] },
    'Conkeldurr': { evolvesFrom: { species: 'Gurdurr', method: 'trade', requirement: 'Trade' } },

    // Tympole line
    'Tympole': { evolvesTo: [{ species: 'Palpitoad', method: 'level', requirement: 25 }] },
    'Palpitoad': { evolvesFrom: { species: 'Tympole', method: 'level', requirement: 25 }, evolvesTo: [{ species: 'Seismitoad', method: 'level', requirement: 36 }] },
    'Seismitoad': { evolvesFrom: { species: 'Palpitoad', method: 'level', requirement: 36 } },

    // Sewaddle line
    'Sewaddle': { evolvesTo: [{ species: 'Swadloon', method: 'level', requirement: 20 }] },
    'Swadloon': { evolvesFrom: { species: 'Sewaddle', method: 'level', requirement: 20 }, evolvesTo: [{ species: 'Leavanny', method: 'happiness', requirement: 'High Happiness' }] },
    'Leavanny': { evolvesFrom: { species: 'Swadloon', method: 'happiness', requirement: 'High Happiness' } },

    // Venipede line
    'Venipede': { evolvesTo: [{ species: 'Whirlipede', method: 'level', requirement: 22 }] },
    'Whirlipede': { evolvesFrom: { species: 'Venipede', method: 'level', requirement: 22 }, evolvesTo: [{ species: 'Scolipede', method: 'level', requirement: 30 }] },
    'Scolipede': { evolvesFrom: { species: 'Whirlipede', method: 'level', requirement: 30 } },

    // Cottonee line
    'Cottonee': { evolvesTo: [{ species: 'Whimsicott', method: 'stone', requirement: 'Sun Stone' }] },
    'Whimsicott': { evolvesFrom: { species: 'Cottonee', method: 'stone', requirement: 'Sun Stone' } },

    // Petilil line
    'Petilil': { evolvesTo: [{ species: 'Lilligant', method: 'stone', requirement: 'Sun Stone' }] },
    'Lilligant': { evolvesFrom: { species: 'Petilil', method: 'stone', requirement: 'Sun Stone' } },

    // Sandile line
    'Sandile': { evolvesTo: [{ species: 'Krokorok', method: 'level', requirement: 29 }] },
    'Krokorok': { evolvesFrom: { species: 'Sandile', method: 'level', requirement: 29 }, evolvesTo: [{ species: 'Krookodile', method: 'level', requirement: 40 }] },
    'Krookodile': { evolvesFrom: { species: 'Krokorok', method: 'level', requirement: 40 } },

    // Darumaka line
    'Darumaka': { evolvesTo: [{ species: 'Darmanitan', method: 'level', requirement: 35 }] },
    'Darmanitan': { evolvesFrom: { species: 'Darumaka', method: 'level', requirement: 35 } },

    // Scraggy line
    'Scraggy': { evolvesTo: [{ species: 'Scrafty', method: 'level', requirement: 39 }] },
    'Scrafty': { evolvesFrom: { species: 'Scraggy', method: 'level', requirement: 39 } },

    // Yamask line
    'Yamask': { evolvesTo: [{ species: 'Cofagrigus', method: 'level', requirement: 34 }] },
    'Cofagrigus': { evolvesFrom: { species: 'Yamask', method: 'level', requirement: 34 } },

    // Tirtouga line
    'Tirtouga': { evolvesTo: [{ species: 'Carracosta', method: 'level', requirement: 37 }] },
    'Carracosta': { evolvesFrom: { species: 'Tirtouga', method: 'level', requirement: 37 } },

    // Archen line
    'Archen': { evolvesTo: [{ species: 'Archeops', method: 'level', requirement: 37 }] },
    'Archeops': { evolvesFrom: { species: 'Archen', method: 'level', requirement: 37 } },

    // Trubbish line
    'Trubbish': { evolvesTo: [{ species: 'Garbodor', method: 'level', requirement: 36 }] },
    'Garbodor': { evolvesFrom: { species: 'Trubbish', method: 'level', requirement: 36 } },

    // Zorua line
    'Zorua': { evolvesTo: [{ species: 'Zoroark', method: 'level', requirement: 30 }] },
    'Zoroark': { evolvesFrom: { species: 'Zorua', method: 'level', requirement: 30 } },

    // Gothita line
    'Gothita': { evolvesTo: [{ species: 'Gothorita', method: 'level', requirement: 32 }] },
    'Gothorita': { evolvesFrom: { species: 'Gothita', method: 'level', requirement: 32 }, evolvesTo: [{ species: 'Gothitelle', method: 'level', requirement: 41 }] },
    'Gothitelle': { evolvesFrom: { species: 'Gothorita', method: 'level', requirement: 41 } },

    // Solosis line
    'Solosis': { evolvesTo: [{ species: 'Duosion', method: 'level', requirement: 32 }] },
    'Duosion': { evolvesFrom: { species: 'Solosis', method: 'level', requirement: 32 }, evolvesTo: [{ species: 'Reuniclus', method: 'level', requirement: 41 }] },
    'Reuniclus': { evolvesFrom: { species: 'Duosion', method: 'level', requirement: 41 } },

    // Ducklett line
    'Ducklett': { evolvesTo: [{ species: 'Swanna', method: 'level', requirement: 35 }] },
    'Swanna': { evolvesFrom: { species: 'Ducklett', method: 'level', requirement: 35 } },

    // Vanillite line
    'Vanillite': { evolvesTo: [{ species: 'Vanillish', method: 'level', requirement: 35 }] },
    'Vanillish': { evolvesFrom: { species: 'Vanillite', method: 'level', requirement: 35 }, evolvesTo: [{ species: 'Vanilluxe', method: 'level', requirement: 47 }] },
    'Vanilluxe': { evolvesFrom: { species: 'Vanillish', method: 'level', requirement: 47 } },

    // Deerling line
    'Deerling': { evolvesTo: [{ species: 'Sawsbuck', method: 'level', requirement: 34 }] },
    'Sawsbuck': { evolvesFrom: { species: 'Deerling', method: 'level', requirement: 34 } },

    // Karrablast/Shelmet linked trade
    'Karrablast': { evolvesTo: [{ species: 'Escavalier', method: 'trade', requirement: 'Trade for Shelmet' }] },
    'Escavalier': { evolvesFrom: { species: 'Karrablast', method: 'trade', requirement: 'Trade for Shelmet' } },
    'Shelmet': { evolvesTo: [{ species: 'Accelgor', method: 'trade', requirement: 'Trade for Karrablast' }] },
    'Accelgor': { evolvesFrom: { species: 'Shelmet', method: 'trade', requirement: 'Trade for Karrablast' } },

    // Foongus line
    'Foongus': { evolvesTo: [{ species: 'Amoonguss', method: 'level', requirement: 39 }] },
    'Amoonguss': { evolvesFrom: { species: 'Foongus', method: 'level', requirement: 39 } },

    // Frillish line
    'Frillish': { evolvesTo: [{ species: 'Jellicent', method: 'level', requirement: 40 }] },
    'Jellicent': { evolvesFrom: { species: 'Frillish', method: 'level', requirement: 40 } },

    // Joltik line
    'Joltik': { evolvesTo: [{ species: 'Galvantula', method: 'level', requirement: 36 }] },
    'Galvantula': { evolvesFrom: { species: 'Joltik', method: 'level', requirement: 36 } },

    // Ferroseed line
    'Ferroseed': { evolvesTo: [{ species: 'Ferrothorn', method: 'level', requirement: 40 }] },
    'Ferrothorn': { evolvesFrom: { species: 'Ferroseed', method: 'level', requirement: 40 } },

    // Klink line
    'Klink': { evolvesTo: [{ species: 'Klang', method: 'level', requirement: 38 }] },
    'Klang': { evolvesFrom: { species: 'Klink', method: 'level', requirement: 38 }, evolvesTo: [{ species: 'Klinklang', method: 'level', requirement: 49 }] },
    'Klinklang': { evolvesFrom: { species: 'Klang', method: 'level', requirement: 49 } },

    // Tynamo line
    'Tynamo': { evolvesTo: [{ species: 'Eelektrik', method: 'level', requirement: 39 }] },
    'Eelektrik': { evolvesFrom: { species: 'Tynamo', method: 'level', requirement: 39 }, evolvesTo: [{ species: 'Eelektross', method: 'stone', requirement: 'Thunder Stone' }] },
    'Eelektross': { evolvesFrom: { species: 'Eelektrik', method: 'stone', requirement: 'Thunder Stone' } },

    // Elgyem line
    'Elgyem': { evolvesTo: [{ species: 'Beheeyem', method: 'level', requirement: 42 }] },
    'Beheeyem': { evolvesFrom: { species: 'Elgyem', method: 'level', requirement: 42 } },

    // Cubchoo line
    'Cubchoo': { evolvesTo: [{ species: 'Beartic', method: 'level', requirement: 37 }] },
    'Beartic': { evolvesFrom: { species: 'Cubchoo', method: 'level', requirement: 37 } },

    // Golett line
    'Golett': { evolvesTo: [{ species: 'Golurk', method: 'level', requirement: 43 }] },
    'Golurk': { evolvesFrom: { species: 'Golett', method: 'level', requirement: 43 } },

    // Pawniard line
    'Pawniard': { evolvesTo: [{ species: 'Bisharp', method: 'level', requirement: 52 }] },
    'Bisharp': { evolvesFrom: { species: 'Pawniard', method: 'level', requirement: 52 } },

    // Rufflet line
    'Rufflet': { evolvesTo: [{ species: 'Braviary', method: 'level', requirement: 54 }] },
    'Braviary': { evolvesFrom: { species: 'Rufflet', method: 'level', requirement: 54 } },

    // Vullaby line
    'Vullaby': { evolvesTo: [{ species: 'Mandibuzz', method: 'level', requirement: 54 }] },
    'Mandibuzz': { evolvesFrom: { species: 'Vullaby', method: 'level', requirement: 54 } },

    // Larvesta line
    'Larvesta': { evolvesTo: [{ species: 'Volcarona', method: 'level', requirement: 59 }] },
    'Volcarona': { evolvesFrom: { species: 'Larvesta', method: 'level', requirement: 59 } },

    // Mienfoo line
    'Mienfoo': { evolvesTo: [{ species: 'Mienshao', method: 'level', requirement: 50 }] },
    'Mienshao': { evolvesFrom: { species: 'Mienfoo', method: 'level', requirement: 50 } },

    // Druddigon — no evolution

    // Bouffalant — no evolution

    // ── Gen 6 ─────────────────────────────────────────────────────────────

    // Gen 6 starters
    'Chespin': { evolvesTo: [{ species: 'Quilladin', method: 'level', requirement: 16 }] },
    'Quilladin': { evolvesFrom: { species: 'Chespin', method: 'level', requirement: 16 }, evolvesTo: [{ species: 'Chesnaught', method: 'level', requirement: 36 }] },
    'Chesnaught': { evolvesFrom: { species: 'Quilladin', method: 'level', requirement: 36 } },

    'Fennekin': { evolvesTo: [{ species: 'Braixen', method: 'level', requirement: 16 }] },
    'Braixen': { evolvesFrom: { species: 'Fennekin', method: 'level', requirement: 16 }, evolvesTo: [{ species: 'Delphox', method: 'level', requirement: 36 }] },
    'Delphox': { evolvesFrom: { species: 'Braixen', method: 'level', requirement: 36 } },

    'Froakie': { evolvesTo: [{ species: 'Frogadier', method: 'level', requirement: 16 }] },
    'Frogadier': { evolvesFrom: { species: 'Froakie', method: 'level', requirement: 16 }, evolvesTo: [{ species: 'Greninja', method: 'level', requirement: 36 }] },
    'Greninja': { evolvesFrom: { species: 'Frogadier', method: 'level', requirement: 36 } },

    // Bunnelby line
    'Bunnelby': { evolvesTo: [{ species: 'Diggersby', method: 'level', requirement: 20 }] },
    'Diggersby': { evolvesFrom: { species: 'Bunnelby', method: 'level', requirement: 20 } },

    // Fletchling line
    'Fletchling': { evolvesTo: [{ species: 'Fletchinder', method: 'level', requirement: 17 }] },
    'Fletchinder': { evolvesFrom: { species: 'Fletchling', method: 'level', requirement: 17 }, evolvesTo: [{ species: 'Talonflame', method: 'level', requirement: 35 }] },
    'Talonflame': { evolvesFrom: { species: 'Fletchinder', method: 'level', requirement: 35 } },

    // Scatterbug line
    'Scatterbug': { evolvesTo: [{ species: 'Spewpa', method: 'level', requirement: 9 }] },
    'Spewpa': { evolvesFrom: { species: 'Scatterbug', method: 'level', requirement: 9 }, evolvesTo: [{ species: 'Vivillon', method: 'level', requirement: 12 }] },
    'Vivillon': { evolvesFrom: { species: 'Spewpa', method: 'level', requirement: 12 } },

    // Litleo line
    'Litleo': { evolvesTo: [{ species: 'Pyroar', method: 'level', requirement: 35 }] },
    'Pyroar': { evolvesFrom: { species: 'Litleo', method: 'level', requirement: 35 } },

    // Skiddo line
    'Skiddo': { evolvesTo: [{ species: 'Gogoat', method: 'level', requirement: 32 }] },
    'Gogoat': { evolvesFrom: { species: 'Skiddo', method: 'level', requirement: 32 } },

    // Pancham line
    'Pancham': { evolvesTo: [{ species: 'Pangoro', method: 'other', requirement: 'Level 32 with Dark-type in party' }] },
    'Pangoro': { evolvesFrom: { species: 'Pancham', method: 'other', requirement: 'Level 32 with Dark-type in party' } },

    // Espurr line
    'Espurr': { evolvesTo: [{ species: 'Meowstic', method: 'level', requirement: 25 }] },
    'Meowstic': { evolvesFrom: { species: 'Espurr', method: 'level', requirement: 25 } },

    // Honedge line
    'Honedge': { evolvesTo: [{ species: 'Doublade', method: 'level', requirement: 35 }] },
    'Doublade': { evolvesFrom: { species: 'Honedge', method: 'level', requirement: 35 }, evolvesTo: [{ species: 'Aegislash', method: 'stone', requirement: 'Dusk Stone' }] },
    'Aegislash': { evolvesFrom: { species: 'Doublade', method: 'stone', requirement: 'Dusk Stone' } },

    // Spritzee line
    'Spritzee': { evolvesTo: [{ species: 'Aromatisse', method: 'trade', requirement: 'Sachet' }] },
    'Aromatisse': { evolvesFrom: { species: 'Spritzee', method: 'trade', requirement: 'Sachet' } },

    // Swirlix line
    'Swirlix': { evolvesTo: [{ species: 'Slurpuff', method: 'trade', requirement: 'Whipped Dream' }] },
    'Slurpuff': { evolvesFrom: { species: 'Swirlix', method: 'trade', requirement: 'Whipped Dream' } },

    // Inkay line
    'Inkay': { evolvesTo: [{ species: 'Malamar', method: 'other', requirement: 'Level 30 (special condition)' }] },
    'Malamar': { evolvesFrom: { species: 'Inkay', method: 'other', requirement: 'Level 30 (special condition)' } },

    // Binacle line
    'Binacle': { evolvesTo: [{ species: 'Barbaracle', method: 'level', requirement: 39 }] },
    'Barbaracle': { evolvesFrom: { species: 'Binacle', method: 'level', requirement: 39 } },

    // Skrelp line
    'Skrelp': { evolvesTo: [{ species: 'Dragalge', method: 'level', requirement: 48 }] },
    'Dragalge': { evolvesFrom: { species: 'Skrelp', method: 'level', requirement: 48 } },

    // Clauncher line
    'Clauncher': { evolvesTo: [{ species: 'Clawitzer', method: 'level', requirement: 37 }] },
    'Clawitzer': { evolvesFrom: { species: 'Clauncher', method: 'level', requirement: 37 } },

    // Tyrunt line
    'Tyrunt': { evolvesTo: [{ species: 'Tyrantrum', method: 'level', requirement: 39, note: 'During daytime' }] },
    'Tyrantrum': { evolvesFrom: { species: 'Tyrunt', method: 'level', requirement: 39 } },

    // Amaura line
    'Amaura': { evolvesTo: [{ species: 'Aurorus', method: 'level', requirement: 39, note: 'During nighttime' }] },
    'Aurorus': { evolvesFrom: { species: 'Amaura', method: 'level', requirement: 39 } },

    // Bergmite line
    'Bergmite': { evolvesTo: [{ species: 'Avalugg', method: 'level', requirement: 37 }] },
    'Avalugg': { evolvesFrom: { species: 'Bergmite', method: 'level', requirement: 37 } },

    // Noibat line
    'Noibat': { evolvesTo: [{ species: 'Noivern', method: 'level', requirement: 48 }] },
    'Noivern': { evolvesFrom: { species: 'Noibat', method: 'level', requirement: 48 } },

    // Phantump line
    'Phantump': { evolvesTo: [{ species: 'Trevenant', method: 'trade', requirement: 'Trade' }] },
    'Trevenant': { evolvesFrom: { species: 'Phantump', method: 'trade', requirement: 'Trade' } },

    // Meditite line
    'Meditite': { evolvesTo: [{ species: 'Medicham', method: 'level', requirement: 37 }] },
    'Medicham': { evolvesFrom: { species: 'Meditite', method: 'level', requirement: 37 } },

    // Gulpin line
    'Gulpin': { evolvesTo: [{ species: 'Swalot', method: 'level', requirement: 26 }] },
    'Swalot': { evolvesFrom: { species: 'Gulpin', method: 'level', requirement: 26 } },

    // Trapinch line
    'Trapinch': { evolvesTo: [{ species: 'Vibrava', method: 'level', requirement: 35 }] },
    'Vibrava': { evolvesFrom: { species: 'Trapinch', method: 'level', requirement: 35 }, evolvesTo: [{ species: 'Flygon', method: 'level', requirement: 45 }] },
    'Flygon': { evolvesFrom: { species: 'Vibrava', method: 'level', requirement: 45 } },

    // Poochyena line
    'Poochyena': { evolvesTo: [{ species: 'Mightyena', method: 'level', requirement: 18 }] },
    'Mightyena': { evolvesFrom: { species: 'Poochyena', method: 'level', requirement: 18 } },

    // Cherubi line
    'Cherubi': { evolvesTo: [{ species: 'Cherrim', method: 'level', requirement: 25 }] },
    'Cherrim': { evolvesFrom: { species: 'Cherubi', method: 'level', requirement: 25 } },

    // Spheal line
    'Spheal': { evolvesTo: [{ species: 'Sealeo', method: 'level', requirement: 32 }] },
    'Sealeo': { evolvesFrom: { species: 'Spheal', method: 'level', requirement: 32 }, evolvesTo: [{ species: 'Walrein', method: 'level', requirement: 44 }] },
    'Walrein': { evolvesFrom: { species: 'Sealeo', method: 'level', requirement: 44 } },

    // Burmy line
    'Burmy': { evolvesTo: [
        { species: 'Wormadam', method: 'level', requirement: 20, note: 'Female only' },
        { species: 'Mothim', method: 'level', requirement: 20, note: 'Male only' }
    ]},
    'Wormadam': { evolvesFrom: { species: 'Burmy', method: 'level', requirement: 20 } },
    'Mothim': { evolvesFrom: { species: 'Burmy', method: 'level', requirement: 20 } },

    // Electrike line (Manectric already added above; skipping duplicate check handled by JS — last wins, OK since both identical)

    // Drifloon already added above

    // Dwebble line
    'Dwebble': { evolvesTo: [{ species: 'Crustle', method: 'level', requirement: 34 }] },
    'Crustle': { evolvesFrom: { species: 'Dwebble', method: 'level', requirement: 34 } },

    // Snivy / Zorua / etc already added above

    // Jangmo-o line — already in file
};
