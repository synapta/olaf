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
          "MINUS {?s <https://synapta.it/onto/forMeIsNo> <https://synapta.it/user/" + user + "> . }" +
          "MINUS {?s <https://synapta.it/onto/assert> ?assert . " +
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

        "SELECT ?agent ?agentClass ?agentLabel ?date ?description " +
        "WHERE {" +
            "?agent a ?agentClass ; " +
                   "skos:prefLabel ?agentLabel . " +
            "OPTIONAL {?agent cobis:datazione ?date } " +
            "OPTIONAL {?agent schema:description ?description } " +
            "MINUS {?agent owl:sameAs ?sameas . } " +
            "MINUS {?agent <https://synapta.it/onto/forMeIsNo> <https://synapta.it/user/" + user + "> . }" +
            "MINUS {?agent <https://synapta.it/onto/assert> ?assert . " +
                    "?assert <https://synapta.it/onto/by> <https://synapta.it/user/" + user + ">}" +
            "FILTER (contains(str(?agent), \"IT_ICCU\"))" +
        "} " +
        "OFFSET " + rnd + " LIMIT 1"
    );
}

exports.getSpecificCobisAgent = function (id) {
    return encodeURIComponent(
        "prefix void: <http://rdfs.org/ns/void#>" +
        "prefix owl: <http://www.w3.org/2002/07/owl#>" +
        "prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>" +
        "prefix cobis: <http://dati.cobis.to.it/vocab/>" +
        "prefix schema: <http://schema.org/>" +
        "prefix bf: <http://bibframe.org/vocab/>" +

        "SELECT ?agent ?agentClass ?agentLabel ?date ?description " +
        "WHERE {" +
            "BIND (<http://dati.cobis.to.it/agent/" + id + "> as ?agent)" +
            "?agent a ?agentClass ; " +
                   "schema:name ?agentLabel . " +
            "OPTIONAL {?agent cobis:datazione ?date } " +
            "OPTIONAL {?agent schema:description ?description } " +
        "} LIMIT 1"
    );
}

exports.getCobisTitles = function (agentURI) {
    return encodeURIComponent(
        "prefix bf: <http://bibframe.org/vocab/>" +

        "SELECT DISTINCT ?title " +
        "WHERE {" +
            "?work ?p <" + agentURI + "> . " +
            "?work bf:workTitle/bf:label ?title . " +
        "} LIMIT 5"
    );
}

exports.getCobisDatasets = function (agentURI) {
    return encodeURIComponent(
        "prefix void: <http://rdfs.org/ns/void#>" +
        "prefix bf: <http://bibframe.org/vocab/>" +
        "prefix cobis: <http://synapta.it/cobis/>" +

        "SELECT ?dataset " +
        "WHERE {" +
            "<" + agentURI + "> void:inDataset ?dataset. " +
        "} LIMIT 10 "
    );
}



exports.noWikidataHints = function (s) {
    return encodeURIComponent(
        "INSERT {<" + s + "> <https://synapta.it/onto/noWikidatHints> 'true' .}"
    )
}

exports.forMeIsNo = function (s, user) {
    return encodeURIComponent(
        "INSERT {<" + s + "> <https://synapta.it/onto/forMeIsNo> <https://synapta.it/user/" + user + "> .}"
    )
}

exports.forMeIsYes = function (s, q, user) {
    return encodeURIComponent (
      "INSERT { <" + s + "> <https://synapta.it/onto/assert> _:bn . " +
      "_:bn <https://synapta.it/onto/sameAs> <https://wikidata.org/wiki/" + q +"> ;" +
      "<https://synapta.it/onto/by> <https://synapta.it/user/" + user + ">  .}"
    )
}

exports.launchSparql = function (query, callback) {

    var result = "";

    var options = {
        host: "artemis.synapta.io",
        path: "/sparql?query=" + (typeof(query) === "function" ? query() : query) + "&format=json",
        port: "8890",
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


exports.launchSparqlMultiple = function (query, dataset, callback) {

    var result = "";
    var options = {
        host: url.parse(dataset).hostname,
        path: url.parse(dataset).pathname + "?query=" + (typeof(query) === "function" ? query() : query) + "&format=json",
        port: url.parse(dataset).port,
        method: "GET"
    };

    var req = http.request(options, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            result += chunk;
        });

        res.on('end', function() {
            array = []
            for (var i in JSON.parse(result).results.bindings) {
                object = {}
                for (var j in JSON.parse(result).results.bindings[i]) {
                   object[j] = JSON.parse(result).results.bindings[i][j].value;
                }
                array.push(object);
            }
            callback(array);
        });
    });

    req.on('error', function(e) {
        console.error('problem with request: ' + e.message);
    });

    req.end();
}


exports.launchSparqlUpdate = function (query, callback) { //TODO
    var result = "";
    var digest = require('http-digest-client')('olaf', 'D3g2tl5@1eQA\\U,');
    digest.request({
        host: "artemis.synapta.io",
        path: "/sparql-auth?default-graph-uri=http%3A%2F%2Fdati.cobis.to.it%2Folaf%2F&query=" +
            (typeof(query) === "function" ? query() : query) +
            "&should-sponge=&format=application%2Fjson&timeout=0&debug=on",
        port: "8890",
        method: "GET"
    }, function (res) {
    res.on('data', function (data) {
        console.log(data.toString());
    });
    res.on('error', function (err) {
        console.log('oh noes');
    });
    res.on('end', function() {
        callback()
    })
    });
}
