var https = require("https");


var detailsPersona = function (q) {
    return encodeURIComponent(
      "PREFIX wdt: <http://www.wikidata.org/prop/direct/>" +
      "PREFIX wd: <http://www.wikidata.org/entity/>" +

      "SELECT ?label ?altLabel ?desc ?birthDate ?deathDate ?immagine ?opera ?itwiki ?enwiki " +
      "WHERE {" +
        "OPTIONAL {" +
          "wd:" + q + " wdt:P569 ?birthDate ." +
        "}" +
        "OPTIONAL {" +
          "wd:" + q + " wdt:P570 ?deathDate ." +
        "}" +
        "OPTIONAL {" +
          "wd:" + q + " wdt:P18 ?immagine ." +
        "}" +
        "OPTIONAL {" +
          "?itwikipedia schema:about wd:" + q + " ." +
          "FILTER(CONTAINS(STR(?itwikipedia), 'it.wikipedia.org'))" +
          "BIND(STR(?itwikipedia) as ?itwiki)" +
        "}" +
        "OPTIONAL {" +
          "?enwikipedia schema:about wd:" + q + " ." +
          "FILTER(CONTAINS(STR(?enwikipedia), 'en.wikipedia.org'))" +
          "BIND(STR(?enwikipedia) as ?enwiki)" +
        "}" +
        "SERVICE wikibase:label { " +
          "bd:serviceParam wikibase:language 'it,en,fr,de,nl'. " +
          "wd:" + q + " rdfs:label ?label ." +
          "wd:" + q + " skos:altLabel ?altLabel ." +
          "wd:" + q + " schema:description ?desc ." +
        "}" +
      "}"
    );
}

exports.getWikidataHints = function (term, seed, callback) {
    https.get('https://www.wikidata.org/w/api.php?action=query&list=search&format=json&srlimit=6&srsearch=' + encodeURIComponent(term), function(res){
        var body = '';

        res.on('data', function(chunk){
            body += chunk;
        });

        res.on('end', function(){
            var responseArray = JSON.parse(body).query.search;
            var endCall = responseArray.length;
            var fullData = [];

            if (responseArray.length === 0) {
                callback(null);
                return;
            }

            console.log("Asking Wikidata SPARQL");
            for (var i = 0; i < responseArray.length; i++) {
                getPersonaDetails(responseArray[i].title, i, function (data) {
                    if (data !== "rlm")
                        fullData.push(data);

                    if (--endCall === 0) {
                        var finalData = {}
                        finalData.seed = seed;
                        finalData.hints = fullData;
                        callback(finalData);
                    }
                });
            }
        });
    }).on('error', function(e){
          console.log("Got an error: ", e);
    });
}

var getPersonaDetails = function (q, index, callback) {
    https.get("https://query.wikidata.org/bigdata/namespace/wdq/sparql?query="+detailsPersona(q)+"&format=json", function(res){
        var body = '';

        res.on('data', function(chunk){
            body += chunk;
        });

        res.on('end', function(){
            if (body === "Rate limit exceeded") {
              callback("rlm");
              return;
            }
            try {
                var responseArray = JSON.parse(body).results.bindings;
                responseArray[0].wikidata = q;
                responseArray[0].index = index;
            } catch (e) {
                callback("rlm");
                return;
            }
            callback(responseArray[0]);
        });
    }).on('error', function(e){
          console.log("Got an error: ", e);
    });
}
