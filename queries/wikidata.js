const got = require('got');

function getSparql(values) {

  return `
    SELECT
        ?id
        ?rank
        ?label
        ?description
        (SAMPLE(?immagine) as ?immagine)
        (SAMPLE(?itwikipedia) as ?itwikipedia)
        (SAMPLE(?luogo) as ?luogo)
        (SAMPLE(?indirizzo) as ?indirizzo)
    WHERE {
        # Setting up services
        SERVICE wikibase:label {
            bd:serviceParam wikibase:language "it,en" .
            ?id rdfs:label ?label .
            ?id schema:description ?description .
        }
        VALUES (?id ?rank) {
            ${values.map((item, index) => '(wd:' + item + ' ' + index + ')').join(' ')}
        }
        OPTIONAL {
            ?id wdt:P18 ?immagine .
        }
        OPTIONAL {
            ?itwikipedia schema:about ?id .
            FILTER(CONTAINS(STR(?itwikipedia), 'it.wikipedia.org'))
        }
        OPTIONAL {
            ?id wdt:P6375 ?indirizzo
        }
        OPTIONAL {
            ?id wdt:P131 ?luogoEntity .
            ?luogoEntity rdfs:label ?luogo .
            FILTER (lang(?luogo) = 'it')
        }

        FILTER NOT EXISTS { ?id wdt:P31 wd:Q4167410 }
        FILTER NOT EXISTS { ?id wdt:P31 wd:Q4167836 }
        FILTER NOT EXISTS { ?id wdt:P31 wd:Q11266439 }
        FILTER NOT EXISTS { ?id wdt:P31 wd:Q13442814 }

        FILTER NOT EXISTS { ?id wdt:P31 wd:Q5 }
        FILTER NOT EXISTS { ?id wdt:P31 wd:Q3863 }
        FILTER NOT EXISTS { ?id wdt:P31 wd:Q15944511 }
    }
    GROUP BY ?id ?label ?description ?rank
    ORDER BY ?rank
    LIMIT 10`;
}

async function runSearch(search) {
  const { body } = await got.get('https://www.wikidata.org/w/api.php', {
    searchParams: {
      action: 'query',
      list: 'search',
      srsearch: search,
      srlimit: 25,
      format: 'json'
    },
    responseType: 'json'
  });

  if (body.query) {
    return body.query.search.map((result) => result.title);
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
      'user-agent': 'OLAF/1.0 (https://synapta.it/; info@synapta.it)',
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

async function getCandidates(search, extra) {
  let values = await runSearch(search);

  if (extra) {
    const values_extra = await runSearch(search + ' ' + extra);
    values = [...new Set([...values_extra, ...values])];
  }

  if (values.length > 0) {
    return runSparql(values);
  } else {
    return [];
  }
}

module.exports = {
  getCandidates
};