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

let wikidataQuery = (name, surname) => {

    return `PREFIX wdt: <http://www.wikidata.org/prop/direct/>
            PREFIX wd: <http://www.wikidata.org/entity/>
            
            SELECT (?i as ?wikidata) 
            (SAMPLE(?nome) as ?nome) 
            (SAMPLE(?tipologia) as ?tipologia) 
            (SAMPLE(?num) as ?num) 
            (SAMPLE(?descrizione) as ?descrizione) 
            (SAMPLE(?altLabelIT) as ?altLabelIta)
            (SAMPLE(?altLabelEN) as ?altLabelEng)
            (SAMPLE(?altLabelFR) as ?altLabelFra)
            (SAMPLE(?altLabelES) as ?altLabelEsp)
            (SAMPLE(?altLabelDE) as ?altLabelDeu)
            (SAMPLE(?altLabelLA) as ?altLabelLat)
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
            (SAMPLE(?LCNAF) as ?LCNAF)
            (SAMPLE(?GND) as ?GND)
            (SAMPLE(?sbn) as ?sbn)
            (SAMPLE(?BNF) as ?BNF)
            (SAMPLE(?ULAN) as ?ULAN)
            (SAMPLE(?BAV) as ?BAV)
            (SAMPLE(?CERL) as ?CERL)
            (SAMPLE(?ISNI) as ?ISNI)
            (SAMPLE(?Catholic_Hier) as ?Catholic_Hier)
            
            WHERE {
            
              SERVICE wikibase:label {
                bd:serviceParam wikibase:language "it,en,fr,es,ge" .
                ?i rdfs:label ?nome .
                ?positionHeldID rdfs:label ?positionHeld .
                ?birthPlaceID rdfs:label ?birthPlace .
                ?deathPlaceID rdfs:label ?deathPlace .
                ?i skos:altLabel ?altLabel .
                ?i schema:description ?descrizione
              }
            
              SERVICE wikibase:mwapi {
                bd:serviceParam wikibase:api "EntitySearch" .
                bd:serviceParam wikibase:endpoint "www.wikidata.org" .
                bd:serviceParam mwapi:search "${name} ${surname}" .
                bd:serviceParam mwapi:language "it" .
                ?i wikibase:apiOutputItem mwapi:item .
                ?num wikibase:apiOrdinal true .
              }
              OPTIONAL {
                SERVICE wikibase:label {
                bd:serviceParam wikibase:language "it" .
                ?i skos:altLabel ?altLabelIT.
                }
              }
              
              OPTIONAL {
                SERVICE wikibase:label {
                bd:serviceParam wikibase:language "en" .
                ?i skos:altLabel ?altLabelEN.
                }
              }
              
              OPTIONAL {
                SERVICE wikibase:label {
                bd:serviceParam wikibase:language "fr" .
                ?i skos:altLabel ?altLabelFR.
                }
              }
              OPTIONAL {
                SERVICE wikibase:label {
                bd:serviceParam wikibase:language "es" .
                ?i skos:altLabel ?altLabelES.
                }
              }
              
              OPTIONAL {
                SERVICE wikibase:label {
                bd:serviceParam wikibase:language "de" .
                ?i skos:altLabel ?altLabelDE.
                }
              }
              
              OPTIONAL {
                SERVICE wikibase:label {
                bd:serviceParam wikibase:language "la" .
                ?i skos:altLabel ?altLabelLA.
                }
              }
              OPTIONAL {
                ?book wdt:P31 wd:Q571 .
                ?book wdt:P50 ?i .
                ?book rdfs:label ?bookLabel .
                filter (lang(?bookLabel) = "it")
              }
            
              OPTIONAL {
                ?i wdt:P39 ?positionHeldID
              }
            
              OPTIONAL {
                ?i wdt:P21 ?genderID .
                VALUES (?genderID ?gender) {(wd:Q6581097 'M') (wd:Q6581072 'F')}
              }
            
              OPTIONAL {
                ?i wdt:P569 ?birthDate .
                ?i wdt:P19 ?birthPlaceID .
              }
            
              OPTIONAL {
                ?i wdt:P570 ?deathDate .
                ?i wdt:P20 ?deathPlaceID .
              }
            
              OPTIONAL {
                ?i wdt:P18 ?immagine .
              }
            
              OPTIONAL {
                ?i wdt:P373 ?wikimediaCommons
              }
            
              OPTIONAL {
                ?i wdt:P1986 ?treciRaw .
                BIND(concat('http://www.treccani.it/enciclopedia/', ?trecRaw, "_(Dizionario_Biografico)") as ?treccani)
              }
            
              OPTIONAL {
                ?itwikipedia schema:about ?i .
                FILTER(CONTAINS(STR(?itwikipedia), 'it.wikipedia.org'))
              }
            
              OPTIONAL {
                ?enwikipedia schema:about ?i .
                FILTER(CONTAINS(STR(?enwikipedia), 'en.wikipedia.org'))
              }
            
              OPTIONAL {
                ?i wdt:P214 ?viaf
                      BIND(concat('https://viaf.org/viaf/', ?viaf) as ?viafurl)
              }
            
              OPTIONAL {
                ?i wdt:P396 ?sbnr
                      BIND(REPLACE(REPLACE(STR(?sbnr), "\\\\\\\\", ""), "ITICCU", "") as ?sbn)
              }
              
              OPTIONAL {
                ?i wdt:P244 ?LCNAFRaw
                BIND(concat('https://id.loc.gov/authorities/', ?LCNAFRaw) as ?LCNAF)
                
              }
              
              OPTIONAL {
                ?i wdt:P227 ?GNDr
                BIND(concat('https://d-nb.info/gnd/', ?GNDr) as ?GND)
              }
              
              OPTIONAL {
                ?i wdt:P268 ?BNFr
                BIND(concat('https://catalogue.bnf.fr/ark:/12148/cb', STR(?BNFr)) as ?BNF)
              }
              
              OPTIONAL {
                ?i wdt:P245 ?ULANr
                BIND(concat('https://www.getty.edu/vow/ULANFullDisplay?find=&role=&nation=&subjectid=', STR(?ULANr)) as ?ULAN)
              }
              
              OPTIONAL {
                ?i wdt:P1017 ?BAVraw
                BIND(concat('https://viaf.org/viaf/sourceID/BAV|', STR(?BAVraw)) as ?BAV)
                
              }
              
              OPTIONAL {
                ?i wdt:P1871 ?CERLraw
                BIND(concat('https://data.cerl.org/thesaurus/', STR(?CERLraw)) as ?CERL)
              }
            
              OPTIONAL {
                ?i wdt:P1047 ?Catholic_Hierraw
                BIND(concat('http://www.catholic-hierarchy.org/bishop/b', STR(?Catholic_Hierraw), ".html") as ?Catholic_Hier)
              }
              OPTIONAL {
                ?i wdt:P213 ?isniraw
                BIND(concat('http://www.isni.org/', STR(?isniraw)) as ?ISNI)
              }
              MINUS{
                ?i wdt:P31 wd:Q15632617
              }
            
              MINUS{
                ?i wdt:P31 wd:Q4167410
              }
            
              MINUS{
                ?i wdt:P31 ?class.
                ?class wdt:P279* wd:Q234460
                VALUES ?class {wd:Q838948 wd:Q14204246 wd:Q4502142}
              }
              MINUS{
                ?i wdt:P31 ?class2.
                ?class2 wdt:P279* ?uberC
                VALUES ?uberC {wd:Q4502142 wd:Q3914}
              }
              MINUS{
                ?i wdt:P31 ?class3.
                VALUES ?class3 {wd:Q17633526}
              }
            
              ?i wdt:P31 ?ty .
              OPTIONAL{
                VALUES (?ty ?ti) {(wd:Q5 'Persona') (wd:Q8436 'Famiglia')}
              }
              BIND(IF(!BOUND(?ti), 'Ente', ?ti) AS ?tipologia)
            
            }
            GROUP BY ?i
            ORDER BY ASC(?num) LIMIT 20`.replace(/\s+|\r+|\t+/g, ' ');
};

// Functions
function authorOptions(name, surname){

    // Compose queries
    return [composeQueryWikidata(name, surname), composeQueryVIAF(name, surname)];

}

function authorLink(body) {

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

function composeQueryVIAF(name, surname){

    // Compose query
    return {
        method: 'GET',
        url: 'https://www.viaf.org/viaf/AutoSuggest',
        qs: {
            query: (name + " " + surname).trim()
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