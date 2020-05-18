const nodeRequest   = require('request-promise');


// Functions
let authorSelect = (authorId) => {
    return 'http://localhost:3646/api/v1/montreux/get-artist/' + (authorId ? encodeURIComponent(authorId) : '');
};

function authorOptions(name){
    // Compose queries
    return [makeMusicBrainzQuery(name)];
}

function authorLink(request, driver) {
    console.log('Author link')
}

function authorSkip(request, driver) {
    console.log('Author skip');
}

// Query composer
function composeQuery(query) {

    // Query parameters
    let queryUrl = 'https://dati.cobis.to.it/sparql?default-graph-uri=&query=';
    let queryFormat = '&format=json';

    return queryUrl + encodeURIComponent(query) + queryFormat;

}

function makeMusicBrainzQuery(name, recordings=true){

    let musicBrainzRequest = {
        method: 'GET',
        uri: 'https://musicbrainz.org/ws/2/artist/',
        qs: {
            query: `artist:"${name}"~95`,
            limit: 6,
            fmt: 'json'
        },
        headers: {
            'User-Agent': 'pippo/0.0.1'
        }
    };

    let artistRequest = (id) => {
        return {
            method: 'GET',
            uri: 'https://musicbrainz.org/ws/2/artist/' + id,
            qs: {
                fmt: 'json',
                inc: 'url-rels+genres+artist-rels+event-rels+instrument-rels+release-rels'
            },
            headers: {
                'User-Agent': 'pippo/0.0.1'
            }
        }
    };

    let recordingsRequest = (id) => {
        return {
            method: 'GET',
            uri: 'https://musicbrainz.org/ws/2/recording/',
            qs: {
                query: 'arid:' + id,
                fmt: 'json',
                limit: 100
            },
            headers: {
                'User-Agent': 'pippo/0.0.1'
            }
        }
    };

    return new Promise((resolve, reject) => {
        nodeRequest(musicBrainzRequest).then((response) => {

            // Do make requests based on artist ID
            response = JSON.parse(response);
            let requests = response.artists.map(artist => nodeRequest(artistRequest(artist.id)));

            // Enrich response object
            Promise.all(requests).then((artistsResponses) => {
                let requests = response.artists.map(artist => nodeRequest(recordingsRequest(artist.id)));
                if(recordings) {
                    Promise.all(requests).then((recordingsResponses) => {
                        recordingsResponses = recordingsResponses.map(res => JSON.parse(res));
                        response.artists = artistsResponses.map(res => JSON.parse(res));
                        response.artists.forEach((artist, index) => artist.recordings = recordingsResponses[index].recordings);
                        resolve(JSON.stringify(response));
                    }).catch((err) => reject(err));
                } else {
                    response.artists = artistsResponses.map(res => JSON.parse(res));
                    resolve(resolve(JSON.stringify(response)))
                }
            }).catch((err) => reject(err));

        }).catch((err) => reject(err));
    });

}

function makeWikidataQuery(name, surname) {

    // Find the author on wikidata
    return new Promise((resolve, reject) => {
        nodeRequest(composeQueryWikidata(authorSearch([(name + ' ' + surname).trim()])), (err, res, body) => {

            if (err) {
                console.error(err);
                reject();
            }

            try{

                // Store Agents
                let agents = JSON.parse(body).results.bindings.map(binding => binding.item.value.replace('http://www.wikidata.org/entity/', 'wd:'));
                if(agents) {
                    nodeRequest(composeQueryWikidata(wikidataQuery(agents)), (err, res, body) => {
                        if (err) {
                            console.error(err);
                            reject();
                        }
                        resolve(body);
                    });
                } else
                    resolve(JSON.stringify({results: {bindings: []}}))

            } catch {
                reject();
            }

        })
    });

}

// Exports
//exports.authorSelect = (params) => composeQuery(authorSelect(params));
exports.authorOptions = authorOptions;
//exports.parseAuthorOptions = parseAuthorOptions;
exports.authorSkip = authorSkip;
exports.authorLink = authorLink;
exports.authorSelect = authorSelect;
exports.makeMusicBrainzQuery = makeMusicBrainzQuery;

