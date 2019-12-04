// Requirements
const nodeRequest    = require('request');
const fuzz           = require('fuzzball');
const dictionaries   = require('./dictionaries');
const Option         = require('./option').Option;
const Author         = require('./author').Author;
const Config         = require('./config').Config;

// Configuration
let config           = null;

/**
 * Initialize module with user configuration
 * **/
function configInit(configObj) {
    config = new Config(configObj);
}

/**
 * Parse author response in order to obtain OLAF author object
 * **/
function parseAuthor(body){
    return new Author(body, config);
}

/**
 * Extract feasible options for current author.
 * Compare Wikidata results and VIAF results in order to remove duplicates.
 * **/
function parseAuthorOptions(author, bodies, callback) {

    // Store bodies
    let wikidataBody = bodies[0];
    let viafBody = bodies[1];

    // Get wikidata options
    let wikidataOptions = parseWikidataOptions(wikidataBody);
    let viafOptions = parseViafOptions(viafBody, wikidataOptions.filter(el => el.viaf).map(el => el.getViafId()));
    let options = wikidataOptions.concat(viafOptions);

    // Enrich all options with VIAF and return them
    Promise.all(options.map(el => el.enrichObjectWithViaf())).then(() => {
        options.map(el => el.getString());
        callback(options);
    });

}

function parseWikidataOptions(body) {

    // Parse results
    let results = body.results.bindings;

    // Construct options from query results
    return results.map(el => new Option(el, 'wikidata', config));

}

function parseViafOptions(body, viafUris) {

    // Invalid fields
    let invalidFields = ['uniformtitleexpression', 'uniformtitlework'];

    // Parse results
    let results = body.result;
    // Filter current results removing known authors and options with invalid fields
    results = results.filter(el => !viafUris.includes(el['viafid']) && !invalidFields.includes(el['nametype']));

    // Construct options from query results
    return results.map(el => new Option(el, 'viaf', config));

}

/*function getAuthorSimilarOptions(author, options, callback){

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
                            // Set option as suggested
                            option.optionSuggested = true;
                    });
                }
            });
        }
    });

    // Callback suggested options
    callback(options);


}*/

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