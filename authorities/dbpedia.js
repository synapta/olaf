var http = require("http");

var italianDbpediaAbstract = function (label) {
  return encodeURIComponent(
    "SELECT ?abstract " +
    "WHERE {" +
      "<http://it.dbpedia.org/resource/" + label + "> <http://dbpedia.org/ontology/abstract> ?abstract ." +
    "}"
  );
}

exports.getAbstract = function (label, callback) {
    http.get("http://it.dbpedia.org/sparql?default-graph-uri=&query=" + italianDbpediaAbstract(label) + "&format=application%2Fsparql-results%2Bjson", function(res) {
      var body = '';

      res.on('data', function(chunk){
          body += chunk;
      });

      res.on('end', function(){
          try {
              var abstract = JSON.parse(body).results.bindings[0].abstract.value;
          } catch (e) {
              callback("error");
              return;
          }
          callback(abstract);
      });
    }).on('error', function(e){
        console.log("Got an error: ", e);
    });
}
