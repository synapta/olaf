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

            // Handle non-array titles
            if (!Array.isArray(author.titles))
                author.titles = [author.titles];

            // Similar authors collection and count
            let similarTitles = [];
            let similarCount = 0;

            // Match with author titles
            option.titles.forEach((title) => {
                if(title.length > 0){

                    // Clean title and make a 0.8 cutoff comparison between titles
                    let results = fuzz.extract(title.replace(/[0-9]+ \~ /, ''), author.titles, {
                        scorer: fuzz.token_set_ratio,
                        cutoff: 80
                    });

                    // Count similar results
                    let isSimilar = results.map((result) => result.length > 0).some(() => true);
                    similarTitles.push(isSimilar);
                    similarCount = similarCount + isSimilar;

                }
            });

            if(similarCount > 0) {

                // Set current option as suggest
                option.setOptionAsSuggested(similarCount);

                // Highlight similar titles
                option.titles.forEach((title, index) => {
                    if(similarTitles[index])
                        option.titles[index] = '<b>' + title + '</b>';
                });

                // Order title by highlighting
                option.titles = option.titles.sort((a, b) => b.includes('<b>') - a.includes('<b>'));

            }

        }
    });

    options = options.sort((a, b) => (b.suggested - a.suggested));
    // Callback suggested options
    callback(options);

}

function parseOutput(data){	

    let output = {};	
    let outputDictionary = config.getInputDictionary();	
    let configFields = config.getConfig().fields;	

    // Translate data output to Cobis dictionary	
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
exports.parseAuthor = parseAuthor;
exports.parseAuthorOptions = parseAuthorOptions;
exports.parseOutput = parseOutput;
exports.configInit = configInit;
exports.config = config;