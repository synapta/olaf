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
        ?person
        (GROUP_CONCAT(DISTINCT(?localID); separator="$$$") as ?localIDs)
        (GROUP_CONCAT(DISTINCT(?agentName); separator="$$$") as ?agentNames)
        (GROUP_CONCAT(DISTINCT(?agentDate); separator="$$$") as ?agentDates)
        (GROUP_CONCAT(DISTINCT(?thingName); separator="$$$") as ?producedThings)
        (GROUP_CONCAT(DISTINCT(?thingStartingDate); separator="$$$") as ?startingDates)
        (GROUP_CONCAT(DISTINCT(?thingEndingDate); separator="$$$") as ?endingDates)
        (GROUP_CONCAT(DISTINCT(?role); separator="$$$") as ?agentRoles)
    
    WHERE {
    
        # Get only some agents in order to explore the graph
        ${authorId ? `VALUES ?person {<${authorId}>}` : ''}
    
        # Get only agents that are also people
        ?person a <https://w3id.org/italia/onto/CPV/Person> .
    
        # Get agent name or names
        OPTIONAL {
            ?person <https://w3id.org/italia/onto/l0/name> ?agentName .
        }
        # Get agent activity time range or ranges
        OPTIONAL {
            ?person <https://w3id.org/arco/ontology/context-description/agentDate> ?agentDate
        }
        # Get agent local ids
        OPTIONAL {
            ?person <https://w3id.org/arco/ontology/context-description/agentLocalIdentifier> ?localID
        }
      
        # Get agent production
        OPTIONAL {
            
            # Get produced things
            ?person <https://w3id.org/arco/ontology/context-description/isAuthorOf> ?thing .
        
            # Get name of the produced things
            ?thing rdfs:label ?thingName .
            
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
      
        # Get agent roles
        OPTIONAL {
            {?person <https://w3id.org/italia/onto/RO/holdsRoleInTime>/<https://w3id.org/italia/RO/withRole>/rdfs:label ?role} 
            UNION 
            {?person <https://w3id.org/italia/RO/holdsRoleInTime>/<https://w3id.org/italia/RO/withRole>/rdfs:label ?role}
        }
    }
    GROUP BY ?person
    LIMIT 1`;
};

let wikidataQuery = (options) => {

    return `
    PREFIX wdt: <http://www.wikidata.org/prop/direct/>
    SELECT ?id 
           ?author
           ?description
           (GROUP_CONCAT(DISTINCT ?work; separator="###") AS ?works)
           (SAMPLE(?birthDate) AS ?birthDate)
           (SAMPLE(?deathDate) AS ?deathDate)
           (GROUP_CONCAT(DISTINCT ?workStartingDate; separator="###") AS ?workStartingDates)
           (GROUP_CONCAT(DISTINCT ?workEndingDate; separator="###") AS ?workEndingDates)
           (GROUP_CONCAT(DISTINCT ?occupation; separator="###") AS ?occupations)
           (SAMPLE(?immagine) as ?immagine) 
           (SAMPLE(?itwikipedia) as ?itwikipedia) 
           (SAMPLE(?viafurl) as ?viafurl)
    WHERE {
      
      # Setting up services
      SERVICE wikibase:label {
        bd:serviceParam wikibase:language "it,en".
        ?id rdfs:label ?author .
        ?id schema:description ?description .
        ?workID rdfs:label ?work .
        ?occupationID rdfs:label ?occupation
      }
      
      # Select a single agent
      VALUES ?id {
        ${options.join(' ')}
      }
      
      # Get only people as Agent
      ?id wdt:P31 wd:Q5 .
      
      # Get see also for creator property
      wd:P170 wdt:P1659 ?seeAlsoCreator .
      BIND(URI(REPLACE(STR(?seeAlsoCreator), "entity", "prop/direct")) AS ?creatorBinded)
      
      # Select all types of works produced by the given author
      OPTIONAL {
      
        {?workID ?creatorBinded ?id}
        UNION
        {?workID wdt:P170 ?id}
        
        # Get see also for inception property
        wd:P571 wdt:P1659 ?seeAlsoInception .
        BIND(URI(REPLACE(STR(?seeAlsoInception), "entity", "prop/direct")) AS ?inceptionBinded)
        # Get work inception
        OPTIONAL {
          {?workID ?inceptionBinded ?workStartingDate}
          UNION
          {?workID wdt:P571 ?workStartingDate}
        }
      
        # Get see also for dissolved property
        wd:P576 wdt:P1659 ?seeAlsoDissolved .
        BIND(URI(REPLACE(STR(?seeAlsoDissolved), "entity", "prop/direct")) AS ?dissolvedBinded)
        # Get work inception
        OPTIONAL {
          {?workID ?dissolvedBinded ?workEndingDate}
          UNION
          {?workID wdt:P576 ?workEndingDate}
        }
        
      }
      
      # Get agent dates
      OPTIONAL {
        ?id wdt:P569 ?birthDate
      }
      OPTIONAL {
        ?id wdt:P570 ?deathDate
      }
      
      # Get agent occupations
      OPTIONAL {
        ?id wdt:P106 ?occupationID
      }
      
      OPTIONAL {
        ?id wdt:P18 ?immagine .
      }
    
      OPTIONAL {
        ?itwikipedia schema:about ?id .
        FILTER(CONTAINS(STR(?itwikipedia), 'it.wikipedia.org'))
      }
    
      OPTIONAL {
        ?id wdt:P214 ?viaf
        BIND(concat('https://viaf.org/viaf/', ?viaf) as ?viafurl)
      }
      
    }
    GROUP BY ?id ?author ?description`
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
    let queryUrl = 'http://wit.istc.cnr.it/arco/virtuoso/sparql?default-graph-uri=&query=';
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