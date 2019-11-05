// Requirements
const nodeRequest    = require('request');
const fuzz           = require('fuzzball');

// Parse author
function parseAuthorName(authorName){

    // Initialize name object
    let nameObject = {};
    // Store complete name
    nameObject['nameFull'] = authorName;

    // Split name
    let tokens = authorName.split(', ');

    // Parse name
    let surname = tokens[0].split('<')[0].trim() || "";
    let name = "";
    if(tokens[1])
        name = tokens[1].split('<')[0].trim() || tokens[1].split('(')[0].trim() || "";

    // Store firstName and lastName
    nameObject['nameFirst'] = name;
    nameObject['nameLast'] = surname;

    // Return name object
    return nameObject;

}

function parseAuthorRoles(authorRoles){

    return {'rolesNumber': authorRoles.length, 'rolesItem': authorRoles}

}

function parseAuthorBirthAndDate(author){

    // Collect birth and date infos
    author.authorBirth = {'birthDate': author.authorBirthDate, 'birthPlace': author.authorBirthPlace};
    author.authorDeath = {'deathDate': author.authorDeathDate, 'deathPlace': author.authorDeathPlace};

    // Remove useless fields
    delete author.authorBirthDate;
    delete author.authorBirthPlace;
    delete author.authorDeathDate;
    delete author.authorDeathPlace;

}

function parseAuthor(body){

    // Author map
    let authorMap = {
        'authorUri': null,
        'authorName': 'Visualizzazione_su_BEWEB',
        'authorTitles': null,
        'authorRoles': 'Qualifica',
        'authorBirthDate': 'Data_di_nascita_Data_istituzione',
        'authorDeathDate': 'Data_di_morte_Luogo_soppressione',
        'authorBirthPlace': 'Luogo_di_nascita_Luogo_istituzione',
        'authorDeathPlace': 'Luogo_di_morte_Data_soppressione',
        'authorGenre': 'Info_di_genere',
        'authorWikipedia': 'Wikipedia',
        'authorViaf': 'VIAF',
        "authorIsni": 'ISNI'
    };

    // Author object
    let author = {};

    // Parse bindings
    if(body) {

        // Map fields
        Object.keys(authorMap).map(key => {
            if (body[authorMap[key]] && body[authorMap[key]] !== '')
                author[key] = body[authorMap[key]];
            else
                author[key] = null;
        });

        // Parse name, titles and roles
        if(author.authorName)
            author.authorName = parseAuthorName(author.authorName);
        if(author.authorRoles)
            author.authorRoles = parseAuthorRoles(author.authorRoles);
        if(author.authorBirthDate || author.authorDeathDate || author.authorBirthPlace || author.authorDeathPlace)
            parseAuthorBirthAndDate(author)

    }

    return author;

}

/*
------------------------------------------------------------------------------------------------------------------------
 */

// Parse author options
function parseAuthorOptions(author, bodies, callback) {

    // Set author labels
    let authorFields = ["optionWikidata", "optionViaf", "optionSbn"];

    // Store bodies
    let wikidataBody = bodies[0];
    let viafBody = bodies[1];

    // Parse wikidata body
    let knownViaf = [];
    let parseCounter = 0;
    parseWikidataOptions(wikidataBody, knownViaf, (wikidataOptions) => {
        parseViafOptions(viafBody, knownViaf, (viafOptions) => {
            // Compose options object
            let options = wikidataOptions.concat(viafOptions);
            // Get viaf details
            if(options.length > 0) {
                options.forEach((option) => {
                    // Parse option
                    if (option.optionViaf) {
                        let viafUriParameters = option.optionViaf.split('/');
                        getViafDetails(viafUriParameters[viafUriParameters.length - 1], (result) => {

                            // Store titles
                            if(result.optionTitles) {
                                // Generate object
                                let optionTitlesObject = {'titlesSource': 'VIAF', 'titlesItem': result.optionTitles};
                                // Handle Wikidata titles
                                if(!option.optionTitles)
                                    option.optionTitles = [optionTitlesObject];
                                else
                                    option.optionTitles.push(optionTitlesObject);
                            }

                            // Store occupations
                            if(result.optionOccupations) {
                                // Merge occupations into description
                                if(option.optionDescription)
                                    result.optionOccupations.unshift(option.optionDescription);
                                option.optionDescription = result.optionOccupations.join(', ');
                            }

                            // Store birthDate
                            if (!option.optionBirthDate && result.optionBirthDate !== '0')
                                option.optionBirthDate = result.optionBirthDate;

                            // Store deathDate
                            if (!option.optionDeathDate && result.optionDeathDate !== '0')
                                option.optionDeathDate = result.optionDeathDate;

                            // Callback
                            if (++parseCounter === options.length)
                            // Option similarity
                                getAuthorSimilarOptions(author, options, (result) => {
                                    // Sort result
                                    result = result.sort((a, b) => (b.optionSuggested - a.optionSuggested));
                                    // Callback
                                    callback({'options': result, 'fields': authorFields});
                                });

                        });
                    } else
                        parseCounter++;
                });
            } else
            // Callback
                callback({'options': [], 'fields': authorFields});
        });
    });

}

function parseWikidataOptions(wikidataBody, knownViaf, callback) {

    // Wikidata map
    let wikidataMap = {
        'optionWikidata': 'wikidata',
        'optionName': 'nome',
        'optionType': 'tipologia',
        'optionDescription': 'descrizione',
        'optionTitles': 'titles',
        'optionBirthDate': 'birthDate',
        'optionDeathDate': 'deathDate',
        'optionImage': 'immagine',
        'optionWikipediaIt': 'itwikipedia',
        'optionTreccani': 'treccani',
        'optionViaf': 'viafurl',
        'optionSbn': 'sbn',
        'optionSuggested': null
    };

    // Results array
    let wikidataOptions = [];

    // Parse results
    let bindings = wikidataBody.results.bindings;
    bindings.forEach((binding) => {
        // Generate new option
        let wikidataOption = {};
        // Map result
        Object.keys(wikidataMap).forEach((key) => {
            if(binding[wikidataMap[key]] && binding[wikidataMap[key]].value !== '') {
                wikidataOption[key] = binding[wikidataMap[key]].value;
                if(key === 'optionViaf') {
                    // Replace https
                    wikidataOption[key] = wikidataOption[key].replace('https', 'http');
                    // Handle VIAF
                    let viafUriParameters = wikidataOption[key].split('/');
                    knownViaf.push(viafUriParameters[viafUriParameters.length - 1]);
                } else if(key === 'optionBirthDate' || key === 'optionDeathDate')
                // Handle dates
                    wikidataOption[key] = wikidataOption[key].substr(0, 10);
                else if(key === 'optionTitles')
                // Handle Wikidata titles
                    wikidataOption[key] = [{'titlesSource': 'Wikidata', 'titlesItem': wikidataOption[key].split('###')}];
            } else
                wikidataOption[key] = null;
        });
        // Parse option for selection
        wikidataOption['optionItem'] = JSON.stringify(wikidataOption);
        // Push option
        wikidataOptions.push(wikidataOption)
    });

    // Callback
    callback(wikidataOptions);

}

function parseViafOptions(viafBody, knownViaf, callback) {

    // VIAF map
    let viafMap = {
        'optionWikidata': null,
        'optionName': 'term',
        'optionType': 'nametype',
        'optionDescription': null,
        'optionTitles': null,
        'optionBirthDate': null,
        'optionDeathDate': null,
        'optionImage': null,
        'optionWikiperdiaIt': null,
        'optionTreccani': null,
        'optionViaf': 'viafid',
        'optionSbn': 'iccu',
        'optionSuggested': null
    };

    // Results array
    let viafOptions = [];
    // Invalid fields
    let invalidFields = ['uniformtitleexpression', 'uniformtitlework'];

    // Parse results
    let results = viafBody.result;
    if(results) {
        results.forEach((result) => {
            // Generate new option
            let viafOption = {};
            // Check VIAF id
            if (!knownViaf.includes(result['viafid']) && !invalidFields.includes(result['nametype'])) {
                // Map result
                Object.keys(viafMap).forEach((key) => {
                    if (viafMap[key] && result[viafMap[key]] && result[viafMap[key]] !== '') {
                        viafOption[key] = result[viafMap[key]];
                        if(key === 'optionViaf') {
                            knownViaf.push(viafOption[key]);
                            // Get titles for option
                            viafOption[key] = 'http://viaf.org/viaf/' + viafOption[key];
                        }
                        if(key === 'optionSbn')
                            viafOption[key] = "IT_ICCU_" + viafOption[key].substring(0, 4).toUpperCase() + "_" + viafOption[key].substring(4, 10);
                    } else
                        viafOption[key] = null;
                });
                // Parse option for selection
                viafOption['optionItem'] = JSON.stringify(viafOption);
                // Push option
                viafOptions.push(viafOption);
            }
        });
    }

    // Callback
    callback(viafOptions);

}

function getViafDetails(optionViaf, callback){

    // Store titles
    let viafQuery = 'https://www.viaf.org/viaf/' + optionViaf + '/?httpAccept=application/json';
    let titles = [];
    let occupations = [];
    let optionBirthDate = null;
    let optionDeathDate = null;

    nodeRequest(viafQuery, (err, res, body) => {

        // Parse response
        let viafResponse = JSON.parse(body);
        if(viafResponse) {

            // Store birthDate and deathDate
            optionBirthDate = viafResponse.birthDate;
            optionDeathDate = viafResponse.deathDate;

            // Store titles
            if (viafResponse.titles){
                // Parse works
                if(viafResponse.titles.work) {
                    let optionTitles = viafResponse.titles.work;
                    if(!Array.isArray(optionTitles))
                        optionTitles = [optionTitles];
                    optionTitles.forEach((optionTitle) => {
                        // Store title name
                        titles.push(optionTitle.title);
                    })
                }
            }

            // Store occupations
            if(viafResponse.occupation){
                // Parse occupations
                if(viafResponse.occupation.data) {
                    let optionOccupations = viafResponse.occupation.data;
                    if(!Array.isArray(optionOccupations))
                        optionOccupations = [optionOccupations];
                    optionOccupations.forEach((optionOccupation) => {
                        // Store occupation name
                        occupations.push(optionOccupation.text);
                    })
                }

            }

        }

        // Check titles and occupations emptiness
        if(titles.length === 0)
            titles = null;
        if(occupations.length === 0)
            occupations = null;

        // Callback
        callback({'optionTitles': titles, 'optionOccupations': occupations, 'optionBirthDate': optionBirthDate, 'optionDeathDate': optionDeathDate});

    });

}

function getAuthorSimilarOptions(author, options, callback){

    // Parse all options
    options.forEach((option) => {
        if(author.authorTitles) {

            // Match author by titles
            let optionTitles = [];
            if (option.optionTitles) {
                option.optionTitles.forEach((titles) => {
                    optionTitles = optionTitles.concat(titles.titlesItem);
                })
            }

            // Match with author titles
            author.authorTitles.titlesItem.forEach((title) => {
                if (optionTitles.length > 0) {
                    // Threshold 0.8 match result
                    let results = fuzz.extract(title, optionTitles, {scorer: fuzz.token_set_ratio, cutoff: 80});
                    // Check similarity
                    results.forEach((result) => {
                        if (result.length > 0)
                        // Set option suggested
                            option.optionSuggested = true;
                    });
                }
            });
        }
    });

    // Callback suggested options
    callback(options);


}

// Exports
exports.parseAuthor = (body) => {
    return parseAuthor(body);
};

exports.parseAuthorOptions = (author, bodies, callback) => {
    parseAuthorOptions(author, bodies, (options) => {
        callback(options);
    });
};