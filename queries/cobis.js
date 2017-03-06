var http = require('http');
var url = require('url');

exports.getRemains = function (user) {
    return encodeURIComponent(
      "prefix schema: <http://schema.org/>" +
      "SELECT (COUNT(DISTINCT(?s)) as ?n) " +
      "WHERE {" +
          "?s schema:description ?description . " +
          "MINUS {?s <http://www.w3.org/2002/07/owl#sameAs> ?sameAs}" +
          "MINUS {?s <https://synapta.it/onto/noWikidatHints> ?o}" +
          "MINUS {?s <https://synapta.it/onto/forMeIsNo> <https://synapta.it/user/" + user + "> . " +
                  "?s <https://synapta.it/onto/assert> ?assert . " +
                  "?assert <https://synapta.it/onto/by> <https://synapta.it/user/" + user + ">}" +
      "}"
    )
}

exports.getRandomCobisItem = function (max, user) {
    var rnd = Math.floor(Math.random() * (max - 0))
    return encodeURIComponent(
        "prefix void: <http://rdfs.org/ns/void#>" +
        "prefix owl: <http://www.w3.org/2002/07/owl#>" +
        "prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
        "prefix cobis: <http://synapta.it/cobis/>" +
        "prefix schema: <http://schema.org/>" +
        "prefix bf: <http://bibframe.org/vocab/>" +

        "SELECT ?agent ?agentClass ?agentLabel ?dataset ?date ?description ?originalURI " +
        "WHERE {" +
            "?agent a ?agentClass ; " +
                   "rdfs:label ?agentLabel ; " +
                   "void:inDataset ?dataset ; " +
                   "cobis:originalURI ?originalURI . " +
            "OPTIONAL {?agent cobis:datazione ?date }" +
            "?agent schema:description ?description ." +
            "MINUS {?agent <https://synapta.it/onto/forMeIsNo> <https://synapta.it/user/" + user + "> . " +
                    "?agent owl:sameAs ?sameas . " +
                    "?agent <https://synapta.it/onto/assert> ?assert . " +
                    "?assert <https://synapta.it/onto/by> <https://synapta.it/user/" + user + ">}" +
        "} " +
        "OFFSET " + rnd + " LIMIT 1"
    );
}

exports.getCobisTitles = function (agentURI) {
    return encodeURIComponent(
        "prefix bf: <http://bibframe.org/vocab/>" +

        "SELECT ?relation ?title " +
        "WHERE {" +
            "?work ?relation <" + agentURI + "> ; " +
                   "bf:workTitle/bf:titleValue ?title . " +
        "} " 
    );
}

exports.noWikidataHints = function (s) {
    return "<" + s + "> <https://synapta.it/onto/noWikidatHints> 'true' .";
}

exports.forMeIsNo = function (s, user) {
    return "<http://synapta.it/cobis/agent/" + s + "> <https://synapta.it/onto/forMeIsNo> <https://synapta.it/user/" + user + "> .";
}

exports.forMeIsYes = function (s, q, user) {
    return "<http://synapta.it/cobis/agent/" + s + "> <https://synapta.it/onto/assert> " +
    "[ <https://synapta.it/onto/sameAs> <https://wikidata.org/wiki/" + q +"> ;" +
      "<https://synapta.it/onto/by> <https://synapta.it/user/" + user + "> ] .";
}

exports.launchSparql = function (query, callback) {

    var result = "";

    var options = {
        host: "artemis.synapta.io",
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
            console.log(result)
            callback(JSON.parse(result).results.bindings[0]);
        });
    });

    req.on('error', function(e) {
        console.error('problem with request: ' + e.message);
    });

    req.end();
}


exports.launchSparqlTitle = function (query, dataset, callback) {

    var result = "";
    var options = {
        host: url.parse(dataset).hostname,
        path: url.parse(dataset).pathname + "?query=" + (typeof(query) === "function" ? query() : query) + "&format=json",
        port: url.parse(dataset).port,
        method: "GET"
    };
   console.log(options)

    var req = http.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            result += chunk;
        });

        res.on('end', function() {
            console.log(result)
            array = []
            for (var i in JSON.parse(result).results.bindings) {
                array.push({
                    "relation": JSON.parse(result).results.bindings[i].relation.value,
                     "title": JSON.parse(result).results.bindings[i].title.value
                })
            }
            callback(array);
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
