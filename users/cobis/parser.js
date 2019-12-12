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

    // Get wikidata options
    let wikidataOptions = parseWikidataOptions(wikidataBody);
    let viafOptions = parseViafOptions(viafBody, wikidataOptions.filter(el => el.viaf).map(el => el.getViafId()));
    let options = wikidataOptions.concat(viafOptions);

    // Enrich all options with VIAF and return them
    Promise.all(options.map(el => el.enrichObjectWithViaf())).then(() => {

        // Parse titles in order to find suggested options
        options.map(option => suggestOption(author, option));
        // Set up option string identifier
        options.map(option => option.getString());

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
    let results = body.result || [];
    // Filter current results removing known authors and options with invalid fields
    results = results.filter(el => !viafUris.includes(el['viafid']) && !invalidFields.includes(el['nametype']));

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