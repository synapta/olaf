const crypto = require('crypto');

const SECRET_KEY = 'edQ5ZtumF6iKAY3UvAXO';

// Queries
let authorSelect = (authorId) => {
    if (!authorId) {
      authorId = 'CEIAF0000004';
    }

    let hash = crypto.createHash('md5').update(SECRET_KEY + authorId + 'getSource').digest("hex");
    return 'mode=getSource&id=' + authorId + '&check=' + hash;
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

let wikidataQuery = (name, surname) => {

    return `PREFIX wdt: <http://www.wikidata.org/prop/direct/>
            PREFIX wd: <http://www.wikidata.org/entity/>
            
            SELECT (?item as ?wikidata) 
                   (SAMPLE(?nome) as ?nome) 
                   (SAMPLE(?tipologia) as ?tipologia) 
                   (SAMPLE(?num) as ?num) 
                   (SAMPLE(?descrizione) as ?descrizione) 
                   (SAMPLE(?altLabel) as ?altLabel)
                   (SAMPLE(?bookLabel) as ?titles)
                   (SAMPLE(?positionHeld) as ?positionHeld)
                   (SAMPLE(?gender) as ?gender)
                   (SAMPLE(?birthDate) as ?birthDate) 
                   (SAMPLE(?birthPlace) as ?birthPlace) 
                   (SAMPLE(?deathDate) as ?deathDate)
                   (SAMPLE(?deathPlace) as ?deathPlace) 
                   (SAMPLE(?immagine) as ?immagine) 
                   (SAMPLE(?wikimediaCommons) as ?wikimediaCommons)
                   (SAMPLE(?itwikipedia) as ?itwikipedia) 
                   (SAMPLE(?enwikipedia) as ?enwikipedia) 
                   (SAMPLE(?viafurl) as ?viafurl)
                   (SAMPLE(?treccani) as ?treccani)
                   (SAMPLE(?sbn) as ?sbn)
            
            WHERE {
            
              SERVICE wikibase:label {
                bd:serviceParam wikibase:language "it,en,fr,es,ge" .
                ?item rdfs:label ?nome .
                ?positionHeldID rdfs:label ?positionHeld .
                ?birthPlaceID rdfs:label ?birthPlace .
                ?deathPlaceID rdfs:label ?deathPlace .
                ?item skos:altLabel ?altLabel .
                ?item schema:description ?descrizione
              }
            
              SERVICE wikibase:mwapi {
                bd:serviceParam wikibase:api "EntitySearch" .
                bd:serviceParam wikibase:endpoint "www.wikidata.org" .
                bd:serviceParam mwapi:search "${name} ${surname}" .
                bd:serviceParam mwapi:language "it" .
                ?item wikibase:apiOutputItem mwapi:item .
                ?num wikibase:apiOrdinal true .
              }
            
              OPTIONAL {
                ?book wdt:P31 wd:Q571 .
                ?book wdt:P50 ?item .
                ?book rdfs:label ?bookLabel .
                filter (lang(?bookLabel) = "it")
              }
              
              OPTIONAL {
                ?item wdt:P39 ?positionHeldID
              }
              
              OPTIONAL {
                ?item wdt:P21 ?genderID .
                VALUES (?genderID ?gender) {(wd:Q6581097 'M') (wd:Q6581072 'F')}
              }
            
              OPTIONAL {
                ?item wdt:P569 ?birthDate .
                ?item wdt:P19 ?birthPlaceID .
              }
            
              OPTIONAL {
                ?item wdt:P570 ?deathDate .
                ?item wdt:P20 ?deathPlaceID .
              }
            
              OPTIONAL {
                ?item wdt:P18 ?immagine .
              }
              
              OPTIONAL {
                ?item wdt:P373 ?wikimediaCommons
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
            
              MINUS{
                ?item wdt:P31 ?class.
                ?class wdt:P279* wd:Q234460
                VALUES ?class {wd:Q838948 wd:Q14204246}
              }
            
              ?item wdt:P31 ?type .
              OPTIONAL{
                VALUES (?type ?tipologia) {(wd:Q5 'Persona') (wd:Q8436 'Famiglia')}
              }
              BIND(IF(!BOUND(?tipologia), 'Ente', ?tipologia) AS ?tipologia)
            
            }
            
            GROUP BY ?item
            ORDER BY ASC(?num) LIMIT 20`.replace(/\s+|\r+|\t+/g, ' ');
};

// Functions
function authorOptions(name, surname){

    // Compose queries
    return [composeQueryWikidata(name, surname), composeQueryVIAF(name, surname)];

}

function authorLink(body) {
    //TODO parse body to beweb obj
    
    // Generate requests
    let requests = [];
    // Parse query
    let hash = crypto.createHash('md5').update(SECRET_KEY + body.id + 'updEntita').digest("hex");
    requests.push(composeQuery("id=" + body.id + "&mode=updEntita&check=" + hash + "&dati=" + encodeURIComponent(json.stringify(body))));
    return requests;

}

function authorSkip(body) {

    // Get body params
    let authorUri = body.authorId;
    // Return query
    return composeQuery(cobisInsertSkip(authorUri));

}

// Query composer
function composeQuery(query) {

    // Query parameters
    let queryUrl = 'http://testbbcc.glauco.it/AFXD/API/olaf/Services.do?';

    return queryUrl + query;

}

function composeQueryWikidata(name, surname){

    // Compose query
    return {
        method: 'GET',
        url: 'https://query.wikidata.org/sparql',
        qs: {
            query: wikidataQuery(name, surname)
        },
        headers: {
            'cache-control': 'no-cache',
            Host: 'query.wikidata.org',
            'Accept-Language': 'it-IT,it;q=0.8,en-US;q=0.5,en;q=0.3',
            Accept: 'application/sparql-results+json',
            'user-agent': 'pippo',
        }
    }

}

function composeQueryVIAF(name){

    // Compose query
    return {
        method: 'GET',
        url: 'https://www.viaf.org/viaf/AutoSuggest',
        qs: {
            query: name
        },
        headers: {
            'cache-control': 'no-cache',
            'Accept-Language': 'it-IT,it;q=0.8,en-US;q=0.5,en;q=0.3',
            'user-agent': 'pippo',
        }
    }

}

// Exports
exports.authorSelect = (params) => {
    return composeQuery(authorSelect(params));
};

exports.authorOptions = (name, surname) => {
    return authorOptions(name, surname);
};

exports.authorSkip = (body) => {
    return authorSkip(body);
};

exports.authorLink = (body) => {
    return authorLink(body)
};
