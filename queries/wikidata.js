const got = require('got');

function getSparql(values) {

    return `
    PREFIX wdt: <http://www.wikidata.org/prop/direct/>
    
    SELECT ?id
           (SAMPLE(?author) AS ?author)
           (SAMPLE(?description) AS ?description)
           (SAMPLE(?birthDate) AS ?birthDate)
           (SAMPLE(?deathDate) AS ?deathDate)
           (SAMPLE(?occupations) AS ?occupations)
           (SAMPLE(?immagine) AS ?immagine)
           (SAMPLE(?itwikipedia) AS ?itwikipedia)
           (SAMPLE(?viafurl) AS ?viafurl)           
           (SAMPLE(?ULAN) AS ?ULAN)
           (SAMPLE(?treccani) as ?treccani)
           (SAMPLE(?commonsCategory) as ?commonsCategory)
           (MAX(?workStartingYear) AS ?minThingDate)
           (MAX(?workEndingYear) AS ?maxThingDate)
           (GROUP_CONCAT(DISTINCT ?work; separator="###") AS ?works)
           (SAMPLE(?worksCount) AS ?worksCount)
    WHERE {
        
      {
        SELECT ?id
               ?author
               ?description
               ?worksCount
               ?birthDate
               ?deathDate
               ?occupations
               ?immagine
               ?itwikipedia
               ?viafurl
               ?ULAN
               ?treccani
               ?commonsCategory
               ?work
        WHERE {
    
          {
    
            SELECT ?id
                  ?author
                  ?description
                  (COUNT(DISTINCT ?workID) AS ?worksCount)
                  (SAMPLE(?birthDate) AS ?birthDate)
                  (SAMPLE(?deathDate) AS ?deathDate)
                  (GROUP_CONCAT(DISTINCT ?occupation; separator="###") AS ?occupations)
                  (SAMPLE(?immagine) as ?immagine)
                  (SAMPLE(?itwikipedia) as ?itwikipedia)
                  (SAMPLE(?viafurl) as ?viafurl)
                  (SAMPLE(?ULAN) as ?ULAN)
                  (SAMPLE(?treccani) as ?treccani)
                  (SAMPLE(?commonsCategory) as ?commonsCategory)
            WHERE {
    
              # Setting up services
              SERVICE wikibase:label {
                bd:serviceParam wikibase:language "it,en".
                ?id rdfs:label ?author .
                ?id schema:description ?description .
                ?occupationID rdfs:label ?occupation
              }
    
              # Select a single agent
              VALUES ?id {
                ${values.join(' ')}
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
              
              OPTIONAL {
                ?id wdt:P245 ?ULANr
                BIND(concat('https://www.getty.edu/vow/ULANFullDisplay?find=&role=&nation=&subjectid=', STR(?ULANr)) as ?ULAN)
              }
              
              OPTIONAL {
                ?id wdt:P3365 ?trecRaw .
                BIND(concat('http://www.treccani.it/enciclopedia/', ?trecRaw ) as ?treccani)
              }
              
              OPTIONAL {
                ?id wdt:P373 ?commonsCategory
              }
    
            } GROUP BY ?id ?author ?description
    
          }
    
          # Get see also for creator property
          wd:P170 wdt:P1659 ?seeAlsoCreator .
          BIND(URI(REPLACE(STR(?seeAlsoCreator), "entity", "prop/direct")) AS ?creatorBinded)
    
          # Select all types of works produced by the given author
          OPTIONAL {
            {?workID ?creatorBinded ?id}
            UNION
            {?workID wdt:P170 ?id}
            SERVICE wikibase:label {
              bd:serviceParam wikibase:language "it,en".
              ?workID rdfs:label ?work .
            }
          }
    
        } LIMIT 30
      }
    
    } GROUP BY ?id`;

}

async function runSearch(search) {
    const { body } = await got.get('https://www.wikidata.org/w/api.php', {
        searchParams: {
            action: 'query',
            list: 'search',
            srsearch: search,
            format: 'json'
        },
        responseType: 'json'
    });

    if (body.query) {
        return body.query.search.map(result => 'wd:' + result.title);
    } else {
        return [];
    }
}

async function runSparql(values) {
    const { body } = await got.post('https://query.wikidata.org/sparql', {
        body: 'query=' + encodeURIComponent(getSparql(values)),
        headers: {
            'accept-language': 'it-IT,it;q=0.9',
            'accept-encoding': 'deflate, br',
            referer: 'https://query.wikidata.org/',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'user-agent': 'Olaf/1.0 (https://synapta.it/; info@synapta.it)',
            'x-requested-with': 'XMLHttpRequest',
            origin: 'https://query.wikidata.org',
            accept: 'application/sparql-results+json',
            'Cache-Control': 'no-cache',
            pragma: 'no-cache',
            authority: 'query.wikidata.org'
        },
        responseType: 'json'
    });

    if (body.results && body.results.bindings) {
        return body.results.bindings;
    } else {
        return [];
    }
}

async function getCandidates(search) {
    const values = await runSearch(search);
    if (values.length > 0) {
        return runSparql(values);
    } else {
        return [];
    }
}

module.exports = { getCandidates };