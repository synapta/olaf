const nodeRequest  = require('request-promise');

let authorSearch = (nameCombinations) => {

    return `
    SELECT DISTINCT ?item WHERE {
  
        VALUES ?names {
            "${nameCombinations.join(' ')}"
        }
          
        SERVICE wikibase:mwapi {
            bd:serviceParam wikibase:api "EntitySearch" .
            bd:serviceParam wikibase:endpoint "www.wikidata.org" .
            bd:serviceParam mwapi:search ?names .
            bd:serviceParam mwapi:language "it" .
            ?item wikibase:apiOutputItem mwapi:item .
        }
      
    }`;

};

let authorSelect = (authorId) => {
    return `PREFIX bf2: <http://id.loc.gov/ontologies/bibframe/>
            PREFIX schema: <http://schema.org/>
            PREFIX dcterm: <http://purl.org/dc/terms/>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            PREFIX owl: <http://www.w3.org/2002/07/owl#>
            PREFIX bookType: <http://dati.cobis.to.it/vocabulary/bookType/>
            PREFIX olaf: <http://olaf.synapta.io/onto/>
            PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>


            SELECT ?personURI 
                   ?personName 
                   (SAMPLE(?description) as ?description) 
                   (SAMPLE(?link) as ?link) 
                   (MIN(xsd:integer(?years)) as ?annoMin)
                   (MAX(xsd:integer(?years)) as ?annoMax)
                   (GROUP_CONCAT(DISTINCT(?personRole); separator="###") as ?personRole) 
                   (GROUP_CONCAT(distinct(?titleFull); separator="###") as ?title) WHERE {

                {
                    SELECT ?personURI (COUNT(DISTINCT ?contribution) AS ?titlesCount) WHERE {

                        ?contribution bf2:agent ?personURI .
                        ?instance bf2:instanceOf ?work .
                        ?work bf2:contribution ?contribution .
                        ?contribution bf2:agent ?personURI .
                        
                        ${authorId ? `
                            FILTER (?personURI = <http://dati.cobis.to.it/agent/${authorId}>)
                        ` : `
                            MINUS {?personURI owl:sameAs ?wd}
                            MINUS {?personURI cobis:hasViafURL ?vf}
                            MINUS {?personURI olaf:skipped ?skipped}
                        `}

                    } GROUP BY ?personURI
                      ${authorId ? `` : `
                          ORDER BY DESC(?titlesCount)
                          LIMIT 1                      
                          OFFSET ${Math.floor(Math.random() * 49)}
                      `}
                }

                ?instance bf2:instanceOf ?work .
                ?work bf2:contribution ?contribution .
                ?contribution bf2:agent ?personURI .
                ?instance bf2:title ?titleURI .
                ?titleURI rdfs:label ?title .
                OPTIONAL {?instance cobis:dataNormalizzata ?years .}
                BIND(CONCAT(IF(BOUND(?years), ?years, "" ) , " ~ " , ?title) as ?titleFull)

                OPTIONAL {?personURI schema:description ?description . }
                OPTIONAL {?personURI foaf:isPrimaryTopicOf ?link . }
                OPTIONAL {?personURI schema:name ?personName . }
                OPTIONAL {?contribution bf2:role/rdfs:label ?personRole . }

            } GROUP BY ?personURI ?personName
              LIMIT 1`;
};

let cobisInsertTimestamp = (authorUri) => {
    return `INSERT INTO GRAPH<http://dati.cobis.to.it/OLAF/>{
                <${authorUri}> dcterms:modified "${(new Date()).toISOString()}"^^xsd:dateTime
            }`;
};

let cobisInsertWikidata = (authorUri, optionWikidata) => {
    return `INSERT INTO GRAPH<http://dati.cobis.to.it/OLAF/>{
                <${authorUri}> owl:sameAs <${optionWikidata}>
            }`;
};

let cobisInsertViaf = (authorUri, optionViaf) => {
    return `PREFIX cobis: <http://dati.cobis.to.it/vocab/>
            INSERT INTO GRAPH<http://dati.cobis.to.it/OLAF/>{
                <${authorUri}> cobis:hasViafURL <${optionViaf}>
            }`;
};

let cobisInsertSbn = (authorUri, optionSbn) => {
    return `PREFIX cobis: <http://dati.cobis.to.it/vocab/>
            INSERT INTO GRAPH<http://dati.cobis.to.it/OLAF/>{
                <${authorUri}> cobis:hasSbn "${optionSbn}"
            }`;
};

let cobisInsertSkip = (authorUri) => {
    return `PREFIX olaf: <http://olaf.synapta.io/onto/>
            INSERT INTO GRAPH<http://dati.cobis.to.it/OLAF/>{
                <${authorUri}> olaf:skipped ?now
            }
            WHERE {
                BIND(NOW() as ?now)
            }`;
};

let wikidataQuery = (options) => {

    return `
        PREFIX wdt: <http://www.wikidata.org/prop/direct/>
        PREFIX wd: <http://www.wikidata.org/entity/>
        
        SELECT (?item as ?wikidata) 
               (SAMPLE (?nome) as ?nome) 
               (sample( ?tipologia) as ?tipologia) 
               (SAMPLE (?num) as ?num) 
               (SAMPLE (?descrizione) as ?descrizione) 
               (SAMPLE (?altLabel) as ?altLabel)
               (sample( ?bookLabel) as ?titles)
               (SAMPLE (?birthDate) as ?birthDate) 
               (SAMPLE (?deathDate) as ?deathDate) 
               (SAMPLE (?immagine) as ?immagine) 
               (SAMPLE (?itwikipedia) as ?itwikipedia) 
               (SAMPLE (?enwikipedia) as ?enwikipedia) 
               (SAMPLE (?viafurl) as ?viafurl)
               (SAMPLE (?treccani) as ?treccani)  (SAMPLE (?sbn) as ?sbn)
        WHERE {

            SERVICE wikibase:label {
                bd:serviceParam wikibase:language "it, en".
                ?item rdfs:label ?nome .
                ?type rdfs:label ?tipologia.
                ?item skos:altLabel ?altLabel .
                ?item schema:description ?descrizione
            }

            VALUES ?item {${options.join(' ')}}
            
            OPTIONAL {
                ?book wdt:P31 wd:Q571 .
                ?book wdt:P50 ?item .
                ?book rdfs:label ?bookLabel .
                filter (lang(?bookLabel) = "it")
            }

            OPTIONAL {
                ?item wdt:P569 ?birthDate .
            }

            OPTIONAL {
                ?item wdt:P570 ?deathDate .
            }

            OPTIONAL {
                ?item wdt:P18 ?immagine .
            }

            OPTIONAL {
                ?item wdt:P3365 ?treccani .
            }

            OPTIONAL {
                ?itwikipedia schema:about ?item .
                FILTER(CONTAINS(STR(?itwikipedia), 'it.wikipedia.org'))
            }

            OPTIONAL {
                ?enwikipedia schema:about ?item .
                FILTER(CONTAINS(STR(?enwikipedia), 'en.wikipedia.org'))
            }

            OPTIONAL {
                ?item wdt:P214 ?viaf
                BIND(concat('https://viaf.org/viaf/', ?viaf) as ?viafurl)
            }

            OPTIONAL {
                ?item wdt:P396 ?sbn_raw
                BIND(REPLACE(STR(?sbn_raw), "\\\\\\\\", "_") as ?sbn)
            }

            MINUS{
                ?item wdt:P31 wd:Q15632617
            }

            MINUS{
                ?item wdt:P31 wd:Q4167410
            }
            
            MINUS {
                ?item wdt:P31 wd:Q28798908
            }
            
            MINUS {
                ?item wdt:P31 wd:Q13442814
            }

            MINUS{
                ?item wdt:P31 ?class.
                ?class wdt:P279* wd:Q234460
                VALUES ?class {wd:Q838948 wd:Q14204246}
            }

            ?item wdt:P31 ?type .

        }
        GROUP BY ?item
        ORDER BY ASC(?num)
        LIMIT 1`
};

// Functions
function authorOptions(name){

    // Compose queries
    return [makeMusicBrainzQuery(name)];

}

function authorLink(request, driver) {

    // Store body
    let body = request.body;

    // Get body params
    let authorUri = body.authorUri;
    let optionWikidata = body.wikidata;
    let optionViaf = body.viaf;
    let optionSbn = body.sbn;

    // Single variables as arrays
    if(optionWikidata && !Array.isArray(optionWikidata))
        optionWikidata = [optionWikidata];
    if(optionViaf && !Array.isArray(optionViaf))
        optionViaf = [optionViaf];
    if(optionSbn && !Array.isArray(optionSbn))
        optionSbn = [optionSbn];

    // Queries params and requests
    let links = {'wikidata': optionWikidata, 'viaf': optionViaf, 'sbn': optionSbn};
    let requests = [];

    // Generate requests
    Object.keys(links).forEach((key) => {

        // Parse query
        if(links[key] !== undefined) {
            requests.push(composeQuery(cobisInsertTimestamp(authorUri)));

            if (key === 'wikidata') {
                optionWikidata.forEach((option) => {
                    requests.push(composeQuery(cobisInsertWikidata(authorUri, option)));
                });
            } else if (key === 'viaf') {
                optionViaf.forEach((option) => {
                    requests.push(composeQuery(cobisInsertViaf(authorUri, option)));
                });
            } else if (key === 'sbn' && !authorUri.includes('IT_ICCU')){
                optionSbn.forEach((option) => {
                    requests.push(composeQuery(cobisInsertSbn(authorUri, option)));
                })
            }
        }

    });

    return requests;

}

function authorSkip(request, driver) {

    // Get body params
    let authorUri = request.body.authorId;
    // Return query
    return composeQuery(cobisInsertSkip(authorUri));

}

// Query composer
function composeQuery(query) {

    // Query parameters
    let queryUrl = 'https://dati.cobis.to.it/sparql?default-graph-uri=&query=';
    let queryFormat = '&format=json';

    return queryUrl + encodeURIComponent(query) + queryFormat;

}

function makeMusicBrainzQuery(name){

    let musicBrainzRequest = {
        method: 'GET',
        uri: 'https://musicbrainz.org/ws/2/artist/',
        qs: {
            query: `artist:${name}`,
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
                //query: `artist:${name}`,
                //limit: 6,
                fmt: 'json',
                inc: 'release-groups+url-rels+genres'
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
            Promise.all(requests).then((responses) => {
                response.artists = responses.map(res => JSON.parse(res));
                resolve(JSON.stringify(response));
            }).catch((err) => reject(err));

        })
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
exports.authorSelect = (params) => {
    return 'https://www.libripolito.it'
};

