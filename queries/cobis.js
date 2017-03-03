var http = require('http');

exports.getRemains = function () {
    return encodeURIComponent(
      "prefix skos: <http://www.w3.org/2004/02/skos/core#>" +
      "SELECT (COUNT(DISTINCT(?s)) as ?n)" +
      "WHERE {" +
          "?s skos:semanticRelation ?l" +
      "}"
    )
}

exports.getRandomCobisItem = function (max) {
    var rnd = Math.floor(Math.random() * (max - 0))
    console.log(rnd)
    return encodeURIComponent(
        "prefix void: <http://rdfs.org/ns/void#>" +
        "prefix skos: <http://www.w3.org/2004/02/skos/core#>" +
        "prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
        "prefix cobis: <http://synapta.it/cobis/>" +
        "prefix schema: <http://schema.org/>" +

        "SELECT ?agent ?agentClass ?agentLabel ?dataset ?date ?description " +
        "WHERE {" +
            "{" +
              "SELECT ?agent" +
              "WHERE {" +
                "?agent skos:semanticRelation ?l ." +
                "MINUS {?agent <https://synapta.it/onto/noWikidatHints> ?o}" +
              "}" +
              "OFFSET " + rnd +
              "LIMIT 1" +
            "}" +

            "?agent a ?agentClass ;" +
                   "rdfs:label ?agentLabel ;" +
                   "void:inDataset ?dataset ;" +
                   "skos:semanticRelation ?link ." +
            "OPTIONAL {?agent cobis:datazione ?date }" +
            "OPTIONAL {?agent schema:description ?description }" +
        "} " +
        "LIMIT 1"
    );
}

exports.noWikidataHints = function (s) {
    return "<" + s + "> <https://synapta.it/onto/noWikidatHints> 'true' .";
}

exports.forMeIsNo = function (s, user) {
    return "<http://synapta.it/cobis/author/" + s + "> <https://synapta.it/onto/forMeIsNo> <https://synapta.it/user/" + user + "> .";
}

exports.forMeIsYes = function (s, q, user) {
    return "<http://synapta.it/cobis/author/" + s + "> <https://synapta.it/onto/assert> " +
    "[ <https://synapta.it/onto/sameAs> <https://wikidata.org/wiki/" + q +"> ;" +
      "<https://synapta.it/onto/by> <https://synapta.it/user/" + user + "> ] .";
}

exports.launchSparql = function (query, callback) {

    var result = "";

    var options = {
        host: "localhost",
        path: "/blazegraph/namespace/agent/sparql?query=" + (typeof(query) === "function" ? query() : query) + "&format=json",
        port: "9998",
        method: "GET"
    };

    var req = http.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            result += chunk;
        });

        res.on('end', function() {
            callback(JSON.parse(result).results.bindings[0]);
        });
    });

    req.on('error', function(e) {
        console.error('problem with request: ' + e.message);
    });

    req.end();
}


exports.launchSparqlUpdate = function (query, callback) {

    var result = "";

    var options = {
        host: "localhost",
        path: "/blazegraph/namespace/agent/sparql",
        port: "9998",
        method: "POST",
        headers: {
          "Content-Type": "application/x-turtle",
        }
    };

    var req = http.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            result += chunk;
        });

        res.on('end', function() {
            console.log(result);
            callback();
        });
    });

    req.on('error', function(e) {
        console.error('problem with request: ' + e.message);
    });

    req.write(query)
    req.end();
}
