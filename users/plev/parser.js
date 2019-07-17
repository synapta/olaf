// Requirements
const nodeRequest    = require('request');

// Parse author
function parseAuthor(body){

    // Author map
    let authorMap = {
        'authorUri': 'personURI',
        'authorName': 'personName',
        'authorTitles': 'title',
        'authorRoles': 'personRole'
    };

    // Get bindings
    let bindings = body.results.bindings[0];
    // Author object
    let author = {};

    // Parse bindings
    if(bindings) {

        // Map fields
        Object.keys(authorMap).map(key => {
            if (bindings[authorMap[key]] && bindings[authorMap[key]].value !== '')
                author[key] = bindings[authorMap[key]].value;
            else
                author[key] = null;
        });

        // Parse name, titles and roles
        if(author.authorName)
            author.authorName = parseAuthorName(author.authorName);
        if(author.authorTitles)
            author.authorTitles = parseAuthorTitles(author.authorTitles);
        if(author.authorRoles)
            author.authorRoles = parseAuthorRoles(author.authorRoles);

    }

    return author;

}

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
    if(tokens[1]) {
        name = tokens[1].split('<')[0].trim() || tokens[1].split('(')[0].trim() || "";
    }

    // Store firstName and lastName
    nameObject['nameFirst'] = name;
    nameObject['nameLast'] = surname;

    // Return name object
    return nameObject;

}

function parseAuthorTitles(authorTitles){

    // Split titles
    let titles = authorTitles.split('###');
    return {'titlesNumber': titles.length, 'titlesItems': [titles[0], titles[1], titles[2]]}

}

function parseAuthorRoles(authorRoles){

    // Split titles
    let roles = authorRoles.split('###');
    return {'rolesNumber': roles.length, 'rolesItems': roles}

}

// Parse author options
function parseAuthorOptions(bodies, callback) {

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

                            // Store birthDate
                            if (!option.optionBirthDate && result.optionBirthDate !== '0')
                                option.optionBirthDate = result.optionBirthDate;

                            // Store deathDate
                            if (!option.optionDeathDate && result.optionDeathDate !== '0')
                                option.optionDeathDate = result.optionDeathDate;

                            // Callback
                            if (++parseCounter === options.length)
                                // Callback
                                callback({'options': options, 'fields': authorFields});

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
        'optionWikiperdiaIt': 'itwikipedia',
        'optionTreccani': 'treccani',
        'optionViaf': 'viafurl',
        'optionSbn': 'sbn'
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
        'optionSbn': 'iccu'
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
    let viafQuery = 'https://www.viaf.org/viaf/search?query=cql.any+=+"' + optionViaf + '"&maximumRecords=1&httpAccept=application/json';
    let titles = [];
    let optionBirthDate = null;
    let optionDeathDate = null;

    nodeRequest(viafQuery, (err, res, body) => {

        // Parse response
        let viafResponse = JSON.parse(body);
        if(viafResponse.searchRetrieveResponse.records) {

            // Store VIAF record
            let viafRecord = viafResponse.searchRetrieveResponse.records[0].record.recordData;

            // Store birthDate and deathDate
            optionBirthDate = viafRecord.birthDate;
            optionDeathDate = viafRecord.deathDate;

            // Store titles
            if (viafRecord.titles) {
                // Store works
                let optionTitles = viafRecord.titles.work;
                // Parse works
                if (optionTitles) {
                    if (!Array.isArray(optionTitles))
                        optionTitles = [optionTitles];
                    optionTitles.forEach((optionTitle) => {

                        // Store title sources
                        if(optionTitle.sources) {
                            let titleSrcs = optionTitle.sources.s;
                            if (!Array.isArray(titleSrcs))
                                titleSrcs = [titleSrcs];
                        }

                        // Store title name
                        let titleName = optionTitle.title;
                        titles.push(titleName)

                    })
                }
            }
        }

        // Check titles emptiness
        if(titles.length === 0)
            titles = null;

        // Callback
        callback({'optionTitles': titles, 'optionBirthDate': optionBirthDate, 'optionDeathDate': optionDeathDate});

    });

}

// Exports
exports.parseAuthor = (body) => {
    return parseAuthor(body);
};

exports.parseAuthorOptions = (bodies, callback) => {
    parseAuthorOptions(bodies, (options) => {
        callback(options);
    });
};