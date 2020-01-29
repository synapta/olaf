// Requirements
const fuzz           = require('fuzzball');
const Option         = require('../../option').Option;
const Author         = require('../../author').Author;

// Configuration
let config           = null;

/**
 * Initialize module with user configuration
 * **/
function configInit(configObj) {
    config = configObj;
}

/**
 * Parse author response in order to obtain OLAF author object
 * **/
function parseAuthor(body){

    // Map Cobis result to standard format
    let binding = body.results.bindings[0];
    let parsedBody = {};

    Object.keys(binding).map((key) => {

        if(binding[key].value.includes('###'))
            binding[key].value = binding[key].value.split('###');

        parsedBody[key] = binding[key].value

    });

    return new Author(parsedBody, config);
}

/**
 * Extract feasible options for current author.
 * Compare Wikidata results and VIAF results in order to remove duplicates.
 * **/
function parseAuthorOptions(author, bodies, callback) {

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
                enrichAllViafOptions(options, 0, function (options) {
                    getAuthorSimilarOptions(author, options, (result) => {
                        // Sort result
                        result = result.sort((a, b) => (b.optionSuggested - a.optionSuggested));
                        // Callback
                        callback({'options': result, 'fields': authorFields});
                    });
                });
            } else
                // Callback
                callback({'options': [], 'fields': authorFields});
        });
    });

}


function enrichAllViafOptions(options, position, callback) {
    position++;
    if (position === options.length) {
        callback(options)

    } else {

        let option = options[position];
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

                enrichAllViafOptions(options, position, callback)
            });
        } else {
            enrichAllViafOptions(options, position, callback)
        }
    }
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
    let results = body.results.bindings;

    // Construct options from query results
    return results.map(el => new Option(el, 'wikidata', config));

}

function parseViafOptions(body, viafUris) {

    // Invalid fields
    let invalidFields = ['uniformtitleexpression', 'uniformtitlework'];

    // Parse results
    let results = viafBody.result;
    if(results && results !== null ) {
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

    // Construct options from query results
    return results.map(el => new Option(el, 'viaf', config));

}

function suggestOption(author, option){

    // Parse all options
    if(author.titles && option.titles) {

        // Threshold 0.8 match result
        let isSuggested = author.titles
            .map(title => fuzz.extract(title, option.titles, {scorer: fuzz.token_set_ratio, cutoff: 80}))
            .some(result => !!result.length);

        if(isSuggested)
            // Set option as suggested
            option.setOptionsAsSuggested()

    }

}

// Exports
exports.parseAuthor = (body) => {
    return parseAuthor(body);
};

exports.parseAuthorOptions = (author, bodies, callback) => {
    parseAuthorOptions(author, bodies, callback);
};

exports.configInit = (configObj) => {
    configInit(configObj);
};

exports.config = config;