// Requirements
const fuzz           = require('fuzzball');
const nodeRequest    = require('request-promise');
const Option         = require('../../option').Option;
const Author         = require('../../author').Author;
const CryptoJS       = require("crypto-js");
const Database       = require('./database').Database;

// Initialize driver
const driver        = new Database();

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

    // Enrich body with artist details
    let details = driver.artistDetails(body.name);
    Object.keys(details).forEach(key => {
        body[key] = details[key];
    });

    return new Author(body, config);

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

    // Get wikidata options
    parseMusicBrainzBody(musicBrainzBody, callback);

}

function parseMusicBrainzBody(body, callback) {

    // Parse results
    let results = body.artists;

    // Store lifespans
    results.forEach(result => {

        // Store begin and end date
        result['birth-date'] = result['life-span'].begin;
        result['death-date'] = result['life-span'].end;

        if(result['begin_area']) result['birth-place'] = result['begin_area']['sort-name'];
        if(result['end_area']) result['death-place'] = result['end_area']['sort-name'];
        if(result['area']) {
            if(result.area['iso-3166-1-codes'] && result.area['iso-3166-1-codes'].length)
                result.areaIso = result.area['iso-3166-1-codes'][0].toLowerCase();
            result.area = result.area.name;
        }

        // Store band relationships
        result.bands = result.relations.filter(rel => rel.type === 'member of band').map(band => band.artist.name);
        result.events = result.relations.filter(rel => rel['target-type'] === 'event').map(event => event.event.name);
        result.instruments = result.relations.filter(rel => rel.type === 'instrument').map(instrument => instrument.attributes[0]);

        // Remove instruments duplicates
        result.instruments = [...new Set(result.instruments)];

        let wikidataObject = result.relations.filter(rel => rel.type === 'wikidata');
        if(wikidataObject.length) result.wikidata = wikidataObject[0].url.resource;

        console.log(result.bands);
        console.log(result.events);
        console.log(result.instruments);

        result.titles = result.recordings.map(recording =>  {
            let date = Math.min(...recording.releases.map(rel => rel.date));
            return `${!!date ? date : '-'}, ${recording.title}`
        });
        result.genres = result.genres.map(genre => genre.name);

    });

    // Get Wikidata ID
    let resultWithWikidata = results.filter(result => !!result.wikidata);
    let wikidataId = resultWithWikidata.map(result => result.wikidata.split('/')[result.wikidata.split('/').length - 1]);
    let imageRequests = wikidataId.map(id => nodeRequest('https://www.wikidata.org/w/api.php?action=wbgetclaims&format=json&property=P18&entity=' + id));

    Promise.all(imageRequests).then(responses => {

        // Get image names
        responses = responses.map(result => JSON.parse(result));
        responses = responses.map(result => {
            return (result['claims']['P18'] !== undefined && result['claims']['P18'].length) ? result['claims']['P18'][0]['mainsnak']['datavalue']['value'].replace(/\s/gmi, '_') : null;
        });

        // Store hash and generate images url
        let hash = responses.map(result => result === null ? null : CryptoJS.MD5(result).toString());
        let urls = [];
        responses.forEach((result, index) => {
            // Generate URL
            let url = null;
            if(result)
                url = `https://upload.wikimedia.org/wikipedia/commons/${hash[index][0]}/${hash[index][0]}${hash[index][1]}/${responses[index]}`;
            urls.push(url)
        });

        // Append image to the proper result
        let imagesCounter = 0;
        results.forEach(result => {
            if(result.wikidata) result.image = urls[imagesCounter++];
        });

        callback(results.map(el => new Option(el, 'musicbrainz', config)));

    });

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