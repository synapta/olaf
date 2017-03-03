var http = require('http');

exports.getRemains = function (user) {
    return encodeURIComponent(
        "SELECT (COUNT(DISTINCT(?s)) as ?n) " +
        "WHERE {" +
            "?s <http://www.w3.org/2000/01/rdf-schema#label> ?l " +
            "MINUS {?s <https://synapta.it/onto/noWikidatHints> ?o}" +
            "MINUS {?s <https://synapta.it/onto/assert> ?assert . " +
                    "?assert <https://synapta.it/onto/by> <https://synapta.it/user/" + user + ">}" +
        "}"
    )
}

exports.getRandomLeibnizItem = function (max, user) {
    return encodeURIComponent(
        "SELECT ?s ?label ?birth ?death " +
        "WHERE {" +
          "{" +
             "SELECT ?s " +
             "WHERE {" +
                 "?s <http://www.w3.org/2000/01/rdf-schema#label> ?l " +
                 "MINUS {?s <https://synapta.it/onto/noWikidatHints> ?o}" +
                 "MINUS {?s <https://synapta.it/onto/assert> ?assert . " +
                         "?assert <https://synapta.it/onto/by> <https://synapta.it/user/" + user + ">}" +
             "} " +
             "GROUP BY ?s " +
             "OFFSET " + Math.floor(Math.random() * (max - 0)) + " LIMIT 1" +
          "}" +
          "?s <http://www.w3.org/2000/01/rdf-schema#label> ?label . " +
          "OPTIONAL { ?s <http://schema.org/birthDate> ?birth } " +
          "OPTIONAL { ?s <http://schema.org/deathDate> ?death } " +
        "}"
    );
}

exports.noWikidataHints = function (s) {
    return "<" + s + "> <https://synapta.it/onto/noWikidatHints> 'true' .";
}

exports.forMeIsNo = function (s, user) {
    return "<leibniz/" + s + "> <https://synapta.it/onto/forMeIsNo> <https://synapta.it/user/" + user + "> .";
}

exports.forMeIsYes = function (s, q, user) {
    console.log("<leibniz/" + s + "> <https://synapta.it/onto/assert> " +
    "[ <https://synapta.it/onto/sameAs> <https://wikidata.org/wiki/" + q +"> ;" +
      "<https://synapta.it/onto/by> <user/" + user + "> ]")
    return "<leibniz/" + s + "> <https://synapta.it/onto/assert> " +
    "[ <https://synapta.it/onto/sameAs> <https://wikidata.org/wiki/" + q +"> ;" +
      "<https://synapta.it/onto/by> <https://synapta.it/user/" + user + "> ] .";
}

exports.launchSparqlLeibniz = function (query, callback) {

    var result = "";

    var options = {
        host: "localhost",
        path: "/blazegraph/namespace/leibniz/sparql?query=" + (typeof(query) === "function" ? query() : query) + "&format=json",
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


exports.launchSparqlUpdateLeibniz = function (query, callback) {

    var result = "";

    var options = {
        host: "localhost",
        path: "/blazegraph/namespace/leibniz/sparql",
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
