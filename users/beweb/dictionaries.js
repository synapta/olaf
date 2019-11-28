/**
 * Dictionary to map Beweb fields to OLAF author fields
 **/
module.exports.bewebDictionary = {
    uri         : 'Idrecord',
    name        : 'Visualizzazione_su_BEWEB',
    titles      : null,
    roles       : 'Qualifica',
    type        : 'Categoria',
    birthDate   : 'Data_di_nascita_Data_istituzione',
    deathDate   : 'Data_di_morte_Data_soppressione',
    birthPlace  : 'Luogo_di_nascita_Luogo_istituzione',
    deathPlace  : 'Luogo_di_morte_Luogo_soppressione',
    gender      : 'Info_di_genere',
    commons     : 'Wikipedia',
    heading     : 'Intestazione',
    variant     : 'Varianti',
    sources     : 'Fonti_archivistiche_e_bibliografiche',
    links       : 'Link'
};

prova = {
    "uri"               : {
        "input"     : 'Idrecord',
        "wikidata"  : null,
        "viaf"      : null,
        "group"     : null,
        "limit"     : 1,
        "label"     : 'Id record'
    },
    "name"              : {
        "input"     : 'Visualizzazione_su_BEWEB',
        "wikidata"  : 'nome',
        "viaf"      : 'term',
        "group"     : 'Nome',
        "limit"     : 1,
        "label"     : 'Visualizzazione su BEWEB'
    },
    "titles"            : {
        "input"     : null,
        "wikidata"  : 'titles',
        "viaf"      : null,
        "group"     : null,
        "limit"     : null,
        "label"     : null
    },
    "roles"             : {
        "input"     : 'Qualifica',
        "wikidata"  : 'positionHeld',
        "viaf"      : null,
        "group"     : null,
        "limit"     : null,
        "label"     : 'Qualifica'
    },
    "type"              : {
        "input"     : 'Categoria',
        "wikidata"  : 'tipologia',
        "viaf"      : 'nametype',
        "group"     : 'Bio',
        "limit"     : 1,
        "label"     : 'Categoria'
    },
    "description"       : {
        "input"     : null,
        "wikidata"  : 'descrizione',
        "viaf"      : null,
        "group"     : null,
        "limit"     : null,
        "label"     : null
    },
    "birthDate"         : {
        "input"     : 'Data_di_nascita_Data_istituzione',
        "wikidata"  : 'birthDate',
        "viaf"      : null,
        "group"     : 'Bio',
        "limit"     : 1,
        "label"     : 'Data di nascita/Data istituzione'
    },
    "deathDate"         : {
        "input"     : 'Data_di_morte_Data_soppressione',
        "wikidata"  : 'deathDate',
        "viaf"      : null,
        "group"     : 'Bio',
        "limit"     : 1,
        "label"     : 'Data di morte/Luogo soppressione'
    },
    "birthPlace"        : {
        "input"     : 'Luogo_di_nascita_Luogo_istituzione',
        "wikidata"  : 'birthPlace',
        "viaf"      : null,
        "group"     : 'Bio',
        "limit"     : 1,
        "label"     : 'Luogo di nascita/Luogo istituzione'
    },
    "deathPlace"        : {
        "input"     : 'Luogo_di_morte_Luogo_soppressione',
        "wikidata"  : 'deathPlace',
        "viaf"      : null,
        "group"     : 'Bio',
        "limit"     : 1,
        "label"     : 'Luogo di morte/Data soppressione'
    },
    "image"             : {
        "input"     : null,
        "wikidata"  : 'immagine',
        "viaf"      : null,
        "group"     : null,
        "limit"     : 1,
        "label"     : 'Immagine'
    },
    "gender"            : {
        "input"     : 'Info_di_genere',
        "wikidata"  : 'gender',
        "viaf"      : null,
        "group"     : 'Bio',
        "limit"     : 1,
        "label"     : 'Info di genere'
    },
    "heading"           : {
        "input"     : 'Intestazione',
        "wikidata"  : null,
        "viaf"      : null,
        "group"     : null,
        "limit"     : null,
        "label"     : 'Intestazione'
    },
    "variant"           : {
        "input"     : 'Varianti',
        "wikidata"  : null,
        "viaf"      : null,
        "group"     : 'Nome',
        "limit"     : null,
        "label"     : 'Varianti'
    },
    "sources"           : {
        "input"     : 'Fonti_archivistiche_e_bibliografiche',
        "wikidata"  : null,
        "viaf"      : null,
        "group"     : null,
        "limit"     : null,
        "label"     : 'Fonti archivistiche e bibliografiche'
    },
    "links"             : {
        "input"     : 'Link',
        "wikidata"  : null,
        "viaf"      : null,
        "group"     : null,
        "limit"     : null,
        "label"     : 'Link'
    },
    "wikipediaIt"       : {
        "input"     : null,
        "wikidata"  : 'itwikipedia',
        "viaf"      : null,
        "group"     : 'Identificativi',
        "limit"     : 1,
        "label"     : 'Wikipedia'
    },
    "wikipediaId"       : {
        "input"     : null,
        "wikidata"  : 'wikidata',
        "viaf"      : null,
        "group"     : null,
        "limit"     : 1,
        "label"     : 'Id Wikipedia'
    },
    "wikimediaCommons"  : {
        "input"     : 'Commons',
        "wikidata"  : 'wikimediaCommons',
        "viaf"      : null,
        "group"     : 'Identificativi',
        "limit"     : 1,
        "label"     : 'Commons'
    },
    "treccani"          : {
        "input"     : null,
        "wikidata"  : 'treccani',
        "viaf"      : null,
        "group"     : 'Identificativi',
        "limit"     : 1,
        "label"     : 'Treccani'
    },
    "viaf"              : {
        "input"     : null,
        "wikidata"  : 'viafurl',
        "viaf"      : 'viafid',
        "group"     : 'Identificativi',
        "limit"     : null,
        "label"     : 'VIAF'
    },
    "sbn"               : {
        "input"     : null,
        "wikidata"  : 'sbn',
        "viaf"      : 'iccu',
        "group"     : 'Identificativi',
        "limit"     : null,
        "label"     : 'SBN'
    },
    "suggested"         : {
        "input"     : null,
        "wikidata"  : null,
        "viaf"      : null,
        "group"     : null,
        "limit"     : null,
        "label"     : null
    }
};

/*module.exports.dictionary = {
    wikidata        : 'wikidata',
    name            : 'nome',
    type            : 'tipologia',
    description     : 'descrizione',
    positionHeld    : 'positionHeld',
    gender          : 'gender',
    titles          : 'titles',
    birthDate       : 'birthDate',
    birthPlace      : 'birthPlace',
    deathDate       : 'deathDate',
    deathPlace      : 'deathPlace',
    image           : 'immagine',
    wikipediaIt     : 'itwikipedia',
    wikimediaCommons: 'wikimediaCommons',
    treccani        : 'treccani',
    viaf            : 'viafurl',
    sbn             : 'sbn',
    suggested       : null
};*/

/**
 * Dictionary to map Wikidata fields to OLAF option fields
 * **/
module.exports.wikidataDictionary = {
    wikidata        : 'wikidata',
    name            : 'nome',
    type            : 'tipologia',
    description     : 'descrizione',
    positionHeld    : 'positionHeld',
    gender          : 'gender',
    titles          : 'titles',
    birthDate       : 'birthDate',
    birthPlace      : 'birthPlace',
    deathDate       : 'deathDate',
    deathPlace      : 'deathPlace',
    image           : 'immagine',
    wikipediaIt     : 'itwikipedia',
    wikimediaCommons: 'wikimediaCommons',
    treccani        : 'treccani',
    viaf            : 'viafurl',
    sbn             : 'sbn',
    suggested       : null
};

/**
 * Dictionary to map VIAF fields to OLAF option fields
 * **/
module.exports.viafDictionary = {
    wikidata    : null,
    name        : 'term',
    type        : 'nametype',
    description : null,
    gender      : null,
    titles      : null,
    birthDate   : null,
    deathDate   : null,
    image       : null,
    wikipediaIt : null,
    treccani    : null,
    viaf        : 'viafid',
    sbn         : 'iccu',
    suggested   : null
};

/**
 * Active selectable fields
 * **/
module.exports.selectableFields = [
    'optionWikidata',
    'optionViaf',
    'optionSbn',
    'optionName',
    'optionType',
    'optionGender',
    'optionDescription',
    'optionHeading',
    'optionVariant',
    'optionBirthPlace',
    'optionBirthDate',
    'optionDeathPlace',
    'optionDeathDate',
];
