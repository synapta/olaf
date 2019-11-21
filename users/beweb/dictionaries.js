/**
 * Dictionary to map Beweb fields to OLAF author fields
 **/
module.exports.bewebDictionary = {
    authorUri         : 'Idrecord',
    authorName        : 'Visualizzazione_su_BEWEB',
    authorTitles      : null,
    authorRoles       : 'Qualifica',
    authorCategory    : 'Categoria',
    authorBirthDate   : 'Data_di_nascita_Data_istituzione',
    authorDeathDate   : 'Data_di_morte_Data_soppressione',
    authorBirthPlace  : 'Luogo_di_nascita_Luogo_istituzione',
    authorDeathPlace  : 'Luogo_di_morte_Luogo_soppressione',
    authorGender      : 'Info_di_genere',
    authorCommons     : 'Wikipedia',
    authorHeading     : 'Intestazione',
    authorVariant     : 'Varianti',
    authorSources     : 'Fonti_archivistiche_e_bibliografiche',
    authorLinks       : 'Link'
};

/**
 * Dictionary to map Wikidata fields to OLAF option fields
 * **/
module.exports.wikidataDictionary = {
    optionWikidata        : 'wikidata',
    optionName            : 'nome',
    optionType            : 'tipologia',
    optionDescription     : 'descrizione',
    optionPositionHeld    : 'positionHeld',
    optionGender          : 'gender',
    optionTitles          : 'titles',
    optionBirthDate       : 'birthDate',
    optionBirthPlace      : 'birthPlace',
    optionDeathDate       : 'deathDate',
    optionDeathPlace      : 'deathPlace',
    optionImage           : 'immagine',
    optionWikipediaIt     : 'itwikipedia',
    optionWikimediaCommons: 'wikimediaCommons',
    optionTreccani        : 'treccani',
    optionViaf            : 'viafurl',
    optionSbn             : 'sbn',
    optionSuggested       : null
};

/**
 * Dictionary to map VIAF fields to OLAF option fields
 * **/
module.exports.viafDictionary = {
    optionWikidata    : null,
    optionName        : 'term',
    optionType        : 'nametype',
    optionDescription : null,
    optionGender      : null,
    optionTitles      : null,
    optionBirthDate   : null,
    optionDeathDate   : null,
    optionImage       : null,
    optionWikipediaIt : null,
    optionTreccani    : null,
    optionViaf        : 'viafid',
    optionSbn         : 'iccu',
    optionSuggested   : null
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
