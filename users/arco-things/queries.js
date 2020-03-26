const nodeRequest   = require('request');
const enrichments   = require('./enrichments');
const Combinatorics = require('js-combinatorics');

let authorSearch = (name, surname) => {

    // Compose query
    return {
        method: 'GET',
        uri: 'https://www.wikidata.org/w/api.php',
        qs: {
            action: "query",
            list: "search",
            srsearch: (name + " " + surname).trim(),
            format: "json"
        },
        json: true
    }

};

let getThings = `
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    SELECT ?thing WHERE {
        ?thing a ?subclass .
        ?subclass rdfs:subClassOf <https://w3id.org/arco/ontology/arco/TangibleCulturalProperty> .
    } GROUP BY ?thing
`;

let authorSelect = (authorId) => {

    return `
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    SELECT 
        ?thing
        (GROUP_CONCAT(DISTINCT(LCASE(?typeLabel)); separator="$$$") as ?types)
        (GROUP_CONCAT(DISTINCT(LCASE(?materialLabel)); separator="$$$") as ?materials)
        (GROUP_CONCAT(DISTINCT(LCASE(?subject)); separator="$$$") as ?subject)
        (GROUP_CONCAT(DISTINCT(?description); separator="$$$") as ?description)
        (SAMPLE(?placeLabel) as ?placeLabel)
        (GROUP_CONCAT(DISTINCT(?classLabel); separator="$$$") as ?classLabels)
        (GROUP_CONCAT(DISTINCT(LCASE(?contributorName)); separator="$$$") as ?contributorNames)
        (GROUP_CONCAT(DISTINCT(LCASE(?thingName)); separator="$$$") as ?thingName)
        (GROUP_CONCAT(DISTINCT(?thingStartingDate); separator="$$$") as ?startingDates)
        (GROUP_CONCAT(DISTINCT(?thingEndingDate); separator="$$$") as ?endingDates)
        (GROUP_CONCAT(DISTINCT(?role); separator="$$$") as ?agentRoles)
    WHERE {
      
        VALUES ?thing {
            <${authorId}>
        }
          
        ?thing a ?subclass .
        ?subclass rdfs:subClassOf <https://w3id.org/arco/ontology/arco/TangibleCulturalProperty> .
        ?subclass rdfs:label ?classLabel .
        
        # Get name of the produced things
        ?thing rdfs:label ?thingName .
          
        OPTIONAL {
            ?thing <https://w3id.org/arco/ontology/context-description/hasAuthorshipAttribution>/<https://w3id.org/arco/ontology/context-description/hasCulturalScope>/rdfs:label ?attributionName 
        }
          
        OPTIONAL {
        
            # Get start date for a certain produced thing
            ?thing <https://w3id.org/arco/ontology/context-description/hasDating>/<https://w3id.org/arco/ontology/context-description/hasDatingEvent> ?thingTiming .
    
            # Get thing starting date
            OPTIONAL {
                {?thingTiming <https://w3id.org/italia/onto/TI/atTime>/<https://w3id.org/arco/ontology/arco/startTime> ?thingStartingDate .}
                UNION 
                {?thingTiming <https://w3id.org/arco/ontology/context-description/specificTime>/<https://w3id.org/arco/ontology/arco/startTime> ?thingStartingDate .}
            }
    
            # Get thing ending date
            OPTIONAL {
                {?thingTiming <https://w3id.org/italia/onto/TI/atTime>/<https://w3id.org/arco/ontology/arco/endTime> ?thingEndingDate .}
                UNION 
                {?thingTiming <https://w3id.org/arco/ontology/context-description/specificTime>/<https://w3id.org/arco/ontology/arco/endTime> ?thingEndingDate .}
            }
        
            # Try to associate each date to each produced thing
            BIND(COALESCE(?thingStartingDate, "") AS ?thingStartingDateParsed)
            BIND(COALESCE(?thingEndingDate, "") AS ?thingEndingDateParsed)
            BIND(CONCAT(?thingName, "|||", ?thingStartingDateParsed, "|||", ?thingEndingDateParsed) AS ?thingNameWithDates)
            
        }
        
        OPTIONAL {
            ?thing <https://w3id.org/arco/ontology/denotative-description/hasCulturalPropertyType>/<https://w3id.org/arco/ontology/denotative-description/hasCulturalPropertyDefinition> ?type .
            ?type rdfs:label ?typeLabel .
        }
          
        OPTIONAL {
            ?thing <https://w3id.org/arco/ontology/denotative-description/hasMaterialOrTechnique> ?material .
            ?material rdfs:label ?materialLabel .
        }
          
        OPTIONAL {
            ?thing <https://w3id.org/arco/ontology/arco/description> ?description .
        }
          
        OPTIONAL {
            ?thing <https://w3id.org/arco/ontology/context-description/subject> ?subject .
        }
          
        OPTIONAL {
            ?thing <https://w3id.org/arco/ontology/location/hasCulturalPropertyAddress> ?place .
            ?place rdfs:label ?placeLabel .
        }
          
        OPTIONAL {
        
            # Get producer agent
            ?person <https://w3id.org/arco/ontology/context-description/isAuthorOf> ?thing .
        
            # Get agent name or names
            OPTIONAL {
                ?person <https://w3id.org/italia/onto/l0/name> ?agentName .
            }
        
            # Get agent activity time range or ranges
            OPTIONAL {
                ?person <https://w3id.org/arco/ontology/context-description/agentDate> ?agentDate
            }
        
            # Get agent roles
            OPTIONAL {
                {?person <https://w3id.org/italia/onto/RO/holdsRoleInTime>/<https://w3id.org/italia/RO/withRole>/rdfs:label ?role}
                UNION 
                {?person <https://w3id.org/italia/RO/holdsRoleInTime>/<https://w3id.org/italia/RO/withRole>/rdfs:label ?role}
            }
        
        }
          
        BIND(COALESCE(?agentName, ?attributionName) as ?contributorName)
        FILTER (lang(?classLabel) = 'it')
        FILTER (lang(?thingName) = 'it')
    
    } GROUP BY ?thing`;
    
};

let wikidataQuery = (options) => {

    return `
    SELECT ?id 
           ?thing
           ?description
           ?classLabel
           (GROUP_CONCAT(DISTINCT ?thingStartingDate; separator="###") AS ?thingStartingDates)
           (GROUP_CONCAT(DISTINCT ?thingEndingDate; separator="###") AS ?thingEndingDates)
           (GROUP_CONCAT(DISTINCT ?agentLabel; separator="###") AS ?agents)
    WHERE {
      
      # Setting up services
      SERVICE wikibase:label {
        bd:serviceParam wikibase:language "it,en".
        ?id rdfs:label ?thing .
        ?id schema:description ?description .
        ?class rdfs:label ?classLabel .
        ?agent rdfs:label ?agentLabel .
      }
     
      VALUES ?id {
        ${options.join(' ')}
      }
      
      # Get thing class
      OPTIONAL {
        ?id wdt:P31 ?class
      }
      
      # Get see also for creator property
      wd:P170 wdt:P1659 ?seeAlsoCreator .
      BIND(URI(REPLACE(STR(?seeAlsoCreator), "entity", "prop/direct")) AS ?creatorBinded)
      
      # Select all types of works produced by the given author
      OPTIONAL {
    
        {?id ?creatorBinded ?agent}
        UNION
        {?id wdt:P170 ?agent}
    
        # Get see also for inception property
        wd:P571 wdt:P1659 ?seeAlsoInception .
        BIND(URI(REPLACE(STR(?seeAlsoInception), "entity", "prop/direct")) AS ?inceptionBinded)
        # Get work inception
        OPTIONAL {
          {?id ?inceptionBinded ?thingStartingDate}
          UNION
          {?id wdt:P571 ?thingStartingDate}
        }
    
        # Get see also for dissolved property
        wd:P576 wdt:P1659 ?seeAlsoDissolved .
        BIND(URI(REPLACE(STR(?seeAlsoDissolved), "entity", "prop/direct")) AS ?dissolvedBinded)
        # Get work inception
        OPTIONAL {
          {?id ?dissolvedBinded ?thingEndingDate}
          UNION
          {?id wdt:P576 ?thingEndingDate}
        }
    
      }
      
    } GROUP BY ?id ?thing ?description ?classLabel`;

};

// Functions
function authorOptions(name, surname){

    // Compose queries
    return [makeWikidataQuery(name, surname)];

}

function authorLink(request, driver) {

    let body = request.body;
    let user = request.user;
    let option = body.option;
    let agent = body.agent;

    return [enrichments.storeMatching(driver, user.username, option, agent)];

}

function authorSkip(request, driver) {

    // Get body params
    let agent = request.body.authorId;
    let user = request.user ? request.user.username : null;

    // Return query
    return [enrichments.skipAgent(driver, user, agent)];

}

// Query composer
function composeQuery(query) {

    // Query parameters
    let queryUrl = 'https://arco.datipubblici.org/sparql?query=';
    let queryFormat = '&format=json';

    return queryUrl + encodeURIComponent(query) + queryFormat;

}

function composeQueryEntityListWikidata(name, surname){

    // Compose query
    return {
        method: 'GET',
        uri: 'https://www.wikidata.org/w/api.php',
        qs: {
            action: "wbsearchentities",
            search: (name + " " + surname).trim(),
            strictlanguage: false,
            language: "en",
            limit: 20,
            format: "json"
        },
        json: true
    }
}

function composeQueryWikidata(query){

    // Compose query
    return {
        method: 'GET',
        uri: 'https://query.wikidata.org/sparql',
        qs: {
            query: query
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

function makeWikidataQuery(name, surname) {

    // Find the author on wikidata
    return new Promise((resolve, reject) => {
        nodeRequest(authorSearch(name, surname), (err, res, body) => {

            // Handle error
            if (err) {
                console.error(err);
                reject(err);
            }

            try{

                // Extract agents ID
                let agents = body.query.search.map(result => 'wd:' + result.title);

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

            } catch(err) {
                reject(err);
            }

        })
    });

}

// Exports
exports.authorSelect = (params) => composeQuery(authorSelect(params));
exports.getThings = composeQuery(getThings);
exports.authorOptions = authorOptions;
exports.authorSkip = authorSkip;
exports.authorLink = authorLink;