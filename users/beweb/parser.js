// Requirements
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
    let results = body.result || [];
    // Filter current results removing known authors and options with invalid fields
    results = results.filter(el => !viafUris.includes(el['viafid']) && !invalidFields.includes(el['nametype']));

    // Construct options from query results
    return results.map(el => new Option(el, 'viaf', config));

}

function parseOutput(data){

    let output = {};
    let outputDictionary = config.getInputDictionary();
    let configFields = config.getConfig().fields;

    // Translate data output to Beweb dictionary
    Object.keys(data).map((field) => {
        if((configFields[field].limit === null || configFields[field].limit > 1) && !Array.isArray(data[field]))
            data[field] = [data[field]];
        output[outputDictionary[field]] = data[field];
    });

    // Get composite fields
    Object.keys(configFields).filter(field => configFields[field].composite).forEach(compositeField => {
        // Initialize output composite object
        output[outputDictionary[compositeField]] = [];
        // Populate output composite object and remove unnecessary composite fields
        Object.keys(data).filter(field => field.includes(compositeField)).map(field => {
            if((configFields[field].limit === null || configFields[field].limit > 1) && !Array.isArray(data[field]))
                data[field] = [data[field]];
            let subfieldKey = field.replace(compositeField, '').toLowerCase();
            output[outputDictionary[compositeField]].push({[subfieldKey]: data[field]});
            delete output[outputDictionary[field]];
        });
    });

    return output;

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