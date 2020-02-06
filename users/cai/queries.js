const cobisQuery = require('../cobis/queries');

Object.keys(cobisQuery).forEach(method => {
    exports[method] = cobisQuery[method];
});

// Queries
let authorSelect = (authorId) => {
    return `PREFIX bf2: <http://id.loc.gov/ontologies/bibframe/>
            PREFIX schema: <http://schema.org/>
            PREFIX dcterm: <http://purl.org/dc/terms/>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            PREFIX owl: <http://www.w3.org/2002/07/owl#>
            PREFIX bookType: <http://dati.cobis.to.it/vocabulary/bookType/>
            PREFIX olaf: <http://olaf.synapta.io/onto/>

            SELECT ?personURI 
                ?personName 
                (SAMPLE(?description) as ?description) 
                (SAMPLE(?link) as ?link)
                (MIN(?years) as ?annoMin)
                (MAX(?years) as ?annoMax)
                (GROUP_CONCAT(DISTINCT(?personRole); separator="###") as ?personRole) 
                (GROUP_CONCAT(distinct(?titleFull); separator="###") as ?title) WHERE {

                {
                    ${authorId ? '': `
                    MINUS {?personURI owl:sameAs ?wd}
                    MINUS {?personURI cobis:hasViafURL ?vf}
                    MINUS {?personURI olaf:skipped ?skipped}
                    `}
                
                    GRAPH<http://dati.cobis.to.it/CAI/>{
                        SELECT ?personURI (COUNT(DISTINCT ?contribution) AS ?titlesCount) WHERE {
                            ?contribution bf2:agent ?personURI .
                            ?instance bf2:instanceOf ?work .
                            ?work bf2:contribution ?contribution .
                            ?contribution bf2:agent ?personURI .

                            ${authorId ? `
                                FILTER (?personURI = <http://dati.cobis.to.it/agent/${authorId}>)
                            ` : ''}
    
                        } GROUP BY ?personURI
                        ${authorId ? `` : `
                            ORDER BY DESC(?titlesCount)                     
                            
                        `}
                    }
                    
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
            LIMIT 1
            ${authorId ? '': `OFFSET ${Math.floor(Math.random() * 49)}`}`
};

function composeQuery(query) {

    // Query parameters
    let queryUrl = 'https://dati.cobis.to.it/sparql?default-graph-uri=&query=';
    let queryFormat = '&format=json';

    return queryUrl + encodeURIComponent(query) + queryFormat;

}

exports.authorSelect = (params) => {
    return composeQuery(authorSelect(params));
};
