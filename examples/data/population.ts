// Example data for the demo. Values are approximate.

/** Residents per region. */
export const POPULATION: Record<string, number> = {
  'Lombardia': 10060574, 'Lazio': 5879082, 'Campania': 5712143,
  'Sicilia': 4875290, 'Veneto': 4905854, 'Piemonte': 4311217,
  'Emilia-Romagna': 4464119, 'Puglia': 3953305, 'Toscana': 3692555,
  'Calabria': 1894110, 'Sardegna': 1611621, 'Liguria': 1524826,
  'Marche': 1512672, 'Abruzzo': 1293941, 'Friuli-Venezia Giulia': 1206216,
  'Trentino-Alto Adige': 1072276, 'Umbria': 870165, 'Basilicata': 545131,
  'Molise': 290769, "Valle d'Aosta": 125034,
};

// Population per province (fonte: ISTAT, valori approssimati; Sardegna con le province del 2025)
export const PROVINCE_POP: Record<string, number> = {
  // Lombardia
  'Milano': 3250315, 'Brescia': 1259378, 'Bergamo': 1111950,
  'Monza e Brianza': 874621, 'Varese': 876889, 'Como': 597413,
  'Pavia': 534490, 'Mantova': 409279, 'Lecco': 336428,
  'Cremona': 355430, 'Sondrio': 181913, 'Lodi': 233645,
  // Lazio
  'Roma': 4343000, 'Latina': 571000, 'Frosinone': 480000,
  'Viterbo': 318000, 'Rieti': 154000,
  // Campania
  'Napoli': 3115320, 'Salerno': 1090000, 'Caserta': 933000,
  'Avellino': 416000, 'Benevento': 278000,
  // Sicilia
  'Palermo': 1252588, 'Catania': 1107702, 'Messina': 626876,
  'Agrigento': 432958, 'Trapani': 430179, 'Siracusa': 398854,
  'Ragusa': 320024, 'Caltanissetta': 260552, 'Enna': 163877,
  // Veneto
  'Padova': 940000, 'Verona': 924000, 'Treviso': 886000,
  'Vicenza': 860000, 'Venezia': 840000, 'Rovigo': 240000, 'Belluno': 199000,
  // Piemonte
  'Torino': 2247780, 'Cuneo': 590000, 'Alessandria': 420000,
  'Novara': 369000, 'Asti': 216000, 'Vercelli': 174000,
  'Biella': 174000, 'Verbano-Cusio-Ossola': 159000,
  // Emilia-Romagna
  'Bologna': 1014000, 'Modena': 703000, 'Reggio Emilia': 530000,
  'Parma': 445000, 'Ferrara': 349000, 'Forlì-Cesena': 394000,
  'Rimini': 335000, 'Ravenna': 389000, 'Piacenza': 286000,
  // Puglia
  'Bari': 1248000, 'Lecce': 797000, 'Foggia': 617000,
  'Taranto': 576000, 'Barletta-Andria-Trani': 392000, 'Brindisi': 389000,
  // Toscana
  'Firenze': 1014000, 'Pisa': 418000, 'Arezzo': 344000,
  'Lucca': 388000, 'Livorno': 332000, 'Pistoia': 293000,
  'Siena': 271000, 'Prato': 253000, 'Grosseto': 225000, 'Massa-Carrara': 198000,
  // Calabria
  'Cosenza': 700000, 'Reggio Calabria': 548000, 'Catanzaro': 360000,
  'Crotone': 170000, 'Vibo Valentia': 160000,
  // Sardegna
  'Cagliari': 480000, 'Sassari': 330000, 'Gallura Nord-Est Sardegna': 160000,
  'Oristano': 150000, 'Nuoro': 150000, 'Sulcis Iglesiente': 120000,
  'Medio Campidano': 90000, 'Ogliastra': 55000,
  // Liguria
  'Genova': 850000, 'Savona': 280000, 'La Spezia': 222000, 'Imperia': 218000,
  // Marche
  'Pesaro e Urbino': 363000, 'Ancona': 477000, 'Macerata': 317000,
  'Fermo': 175000, 'Ascoli Piceno': 205000,
  // Abruzzo
  "L'Aquila": 296000, 'Chieti': 387000, 'Pescara': 320000, 'Teramo': 311000,
  // Friuli-Venezia Giulia
  'Udine': 533000, 'Trieste': 232000, 'Pordenone': 316000, 'Gorizia': 142000,
  // Trentino-Alto Adige
  'Bolzano': 533000, 'Trento': 541000,
  // Umbria
  'Perugia': 667000, 'Terni': 232000,
  // Basilicata
  'Potenza': 362000, 'Matera': 200000,
  // Molise
  'Campobasso': 221000, 'Isernia': 81000,
  // Valle d'Aosta
  'Aosta': 125000,
};
