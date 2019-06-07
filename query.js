// Parameters
let queryUrl = 'https://dati.cobis.to.it/sparql?default-graph-uri=&query=';
let queryFormat   = '&format=json';

// Queries
let cobisQuery = `
    PREFIX bf2: <http://id.loc.gov/ontologies/bibframe/>
    PREFIX schema: <http://schema.org/>
    PREFIX dcterm: <http://purl.org/dc/terms/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    PREFIX owl: <http://www.w3.org/2002/07/owl#>
    PREFIX bookType: <http://dati.cobis.to.it/vocabulary/bookType/>

    SELECT ?personURI ?personName ( SAMPLE(?description ) as ?description ) ( SAMPLE(?link ) as ?link ) (GROUP_CONCAT(DISTINCT(?personRole); separator="###") as ?personRole) (GROUP_CONCAT(distinct(?title); separator="###") as ?title) where {
        GRAPH <http://dati.cobis.to.it/OATO/> {
            ?instance bf2:instanceOf ?work .
            ?work bf2:contribution ?contribution .
            ?contribution bf2:agent ?personURI .
    
            ?instance bf2:title ?titleURI .
            ?titleURI rdfs:label ?title .
        
            OPTIONAL {?personURI schema:description ?description . }
            OPTIONAL { ?personURI foaf:isPrimaryTopicOf ?link . }
    
            OPTIONAL { ?personURI schema:name ?personName . }
            OPTIONAL { ?contribution bf2:role/rdfs:label ?personRole . }
            MINUS {?personURI owl:sameAs ?wd}
        } 
    } GROUP BY ?personURI ?personName
    LIMIT 1
    OFFSET
`;

let wikidataQuery = (name, surname) => {

    return `
        PREFIX wdt: <http://www.wikidata.org/prop/direct/>
        PREFIX wd: <http://www.wikidata.org/entity/>
        
        SELECT ?item ?label ?type ?typeLabel ?num ?description ?altLabel  ?birthDate ?deathDate ?immagine ?itwikipedia ?enwikipedia  WHERE {
        
        SERVICE wikibase:label { 
          bd:serviceParam wikibase:language "it,en,fr,de,nl". 
          ?item rdfs:label ?label .
          ?type rdfs:label ?typeLabel.
          ?item skos:altLabel ?altLabel .    
          ?item schema:description ?description
        }
                  
        SERVICE wikibase:mwapi {
          bd:serviceParam wikibase:api "EntitySearch" .
          bd:serviceParam wikibase:endpoint "www.wikidata.org" .
          bd:serviceParam mwapi:search "${name} ${surname}" .
          bd:serviceParam mwapi:language "en" .
          ?item wikibase:apiOutputItem mwapi:item .
          ?num wikibase:apiOrdinal true .
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
          ?itwikipedia schema:about ?item   .
        
          FILTER(CONTAINS(STR(?itwikipedia), 'it.wikipedia.org'))
        
          BIND(STR(?itwikipedia) as ?itwiki)
        }
        OPTIONAL {
          ?enwikipedia schema:about ?item   .
          FILTER(CONTAINS(STR(?enwikipedia), 'en.wikipedia.org'))
          BIND(STR(?enwikipedia) as ?enwiki)
        }
        MINUS{
          ?item wdt:P31 wd:Q15632617
        }
        MINUS{
          ?item wdt:P31 wd:Q4167410
        }
        MINUS{
          ?item wdt:P31 ?class.
          ?class wdt:P279* wd:Q838948
        }
        MINUS{
          ?item wdt:P31 ?class.
          ?class wdt:P279* wd:Q234460
        }
        
        ?item wdt:P31 ?type .
        } ORDER BY ASC(?num) LIMIT 20
    `
};

// Cobis queries utils
let handleCobisBody = (body) => {

    let binding = body.results.bindings[0];
    let cobisResponse = {};

    Object.keys(binding).forEach((key) => {
        cobisResponse[key] = binding[key].value;
    });

    return cobisResponse

};

// Wikidata queries utils
let handleWikidataBody = (body) => {

    // Initialize response
    let wikidataResult = {};
    wikidataResult.options = [];
    wikidataResult.vars = body.head.vars;

    // Count bindings
    let count = 0;

    body.results.bindings.forEach((binding) => {

        // Generate object
        wikidataResult.options[count] = {};

        // Populate wikidataResult
        Object.keys(binding).forEach((key) => {
            // Get dates
            if (key === "birthDate" || key === "deathDate")
                wikidataResult.options[count][key] = binding[key].value.substr(0, 10);
            // Get image
            else if (key === "immagine")
                wikidataResult.options[count][key] = binding[key].value.substr(5, binding[key].value.length);
            // Other stuff
            else
                wikidataResult.options[count][key] = binding[key].value
        });

        // Increment counter
        count++;

    });

    return wikidataResult;

};

// Exports
exports.composeCobisQuery = (offset) => {
    // Compose query
    return queryUrl + encodeURIComponent(cobisQuery) + offset + queryFormat;
};

exports.composeQueryWikidata = (name, surname) => {
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
            Accept: 'application/sparql-results+json'
        }
    }
};

exports.handleCobisBody = (body) => {
    return handleCobisBody(body);
};

exports.handleWikidataBody = (body) => {
    return handleWikidataBody(body);
};