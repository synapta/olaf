const got = require('got');

function getSparql(values) {

    return `
    PREFIX wdt: <http://www.wikidata.org/prop/direct/>
    
    SELECT ?id
           (SAMPLE(?label) AS ?label)
           (SAMPLE(?description) AS ?description)
           (SAMPLE(?immagine) AS ?immagine)
           (SAMPLE(?itwikipedia) AS ?itwikipedia)

    WHERE {
        
      {
        SELECT ?id
               ?label
               ?description
               ?immagine
               ?itwikipedia
        WHERE {
    
          {
    
            SELECT ?id
                  ?label
                  ?description
                  (SAMPLE(?immagine) as ?immagine)
                  (SAMPLE(?itwikipedia) as ?itwikipedia)

            WHERE {
    
              # Setting up services
              SERVICE wikibase:label {
                bd:serviceParam wikibase:language "it,en" .
                ?id rdfs:label ?label .
                ?id schema:description ?description .
              }
    
              VALUES ?id {
                ${values.join(' ')}
              }
    
              OPTIONAL {
                ?id wdt:P18 ?immagine .
              }
    
              OPTIONAL {
                ?itwikipedia schema:about ?id .
                FILTER(CONTAINS(STR(?itwikipedia), 'it.wikipedia.org'))
              }
    
            } GROUP BY ?id ?label ?description
    
          }
    
        } LIMIT 10

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

module.exports = {
    getCandidates
};