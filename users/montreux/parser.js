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
    //let binding = body.results.bindings[0];
    let parsedBody = {};

    Object.keys(body).map((key) => {

        if(body[key].includes('###'))
            body[key] = body[key].split('###');

        parsedBody[key] = body[key]

    });

    return new Author(parsedBody, config);
}

function getAuthorSimilarOptions(author, options, callback){

    // Parse all options
    options.forEach((option) => {
        if(author.titles && author.titles.length > 0 && option.titles) {
            if (!Array.isArray(author.titles)) {
                author.titles = [author.titles];
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
    let musicBrainzBody = bodies[0];

    /*console.log(musicBrainzBody);
    console.log(musicBrainzBody.artists.map(artist => artist["tags"]));
    console.log(musicBrainzBody.aliases);*/

    // Get wikidata options
    let options = parseMusicBrainzBody(musicBrainzBody);
    callback(options);

    // Enrich all options with VIAF and return them
    /*Promise.all(options.map(el => el.enrichObjectWithViaf())).then(() => {
        options.map(el => el.getString());
        getAuthorSimilarOptions(author, options, function(options) {
            callback(options);
        });
    });*/

}

function parseMusicBrainzBody(body) {

    // Parse results
    let results = body.artists;

    // Store lifespans
    results.forEach(result => {

        console.log(result);

        // Store begin and end date
        result['birth-date'] = result['life-span'].begin;
        result['death-date'] = result['life-span'].end;

        if(result['begin_area']) result['birth-place'] = result['begin_area']['sort-name'];
        if(result['end_area']) result['death-place'] = result['end_area']['sort-name'];

        let wikidataObject = result.relations.filter(rel => rel.type === 'wikidata');
        if(wikidataObject.length) result.wikidata = wikidataObject[0].url.resource;

        result.titles = [...new Set(result['release-groups'].map(rel => rel.title))];
        result.genres = result.genres.map(genre => genre.name);

    });

    // Construct options from query results
    return results.map(el => new Option(el, 'musicbrainz', config));

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