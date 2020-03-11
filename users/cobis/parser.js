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

function getAuthorSimilarOptions(author, options, callback){

    // Parse all options
    options.forEach((option) => {
        if(author.titles && author.titles.length > 0 && option.titles) {
            if (!Array.isArray(author.titles)) {
                author.titles = [author.titles]

            }
            // Match with author titles
            author.titles.forEach((title) => {
                if (title.length > 0) {
                    let titleClean = title.replace(/[0-9]+ \~ /, '');

                    // Threshold 0.8 match result
                    let results = fuzz.extract(titleClean, option.titles, {scorer: fuzz.token_set_ratio, cutoff: 80});

                    // Check similarity
                    results.forEach((result) => {
                        if (result.length > 0)
                        // Set option suggested
                            option.setOptionAsSuggested();
                    });
                }
            });
        }
    });

    options = options.sort((a, b) => (b.suggested - a.suggested));
    // Callback suggested options
    callback(options);

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

        getAuthorSimilarOptions(author, options, function(options) {
            callback(options);
        });
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
    results = results.filter((object, index, array) => array.map((el) => el.viafid).indexOf(object.viafid) === index);
    results = results.filter(el => !viafUris.includes(el['viafid']) && !invalidFields.includes(el['nametype']));

    // Construct options from query results
    return results.map(el => new Option(el, 'viaf', config));

}


// Exports
exports.parseAuthor = (body) => {
    return parseAuthor(body);
};

exports.parseAuthorOptions = (author, bodies, callback) => {
    parseAuthorOptions(author, bodies, callback);
};

exports.parseOutput = (data) => {
    return parseOutput(data);
};

exports.configInit = (configObj) => {
    configInit(configObj);
};

exports.config = config;