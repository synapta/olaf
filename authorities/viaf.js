var https = require("https");

exports.getViafHints = function (term, hints, callback) {
    https.get('https://www.viaf.org/viaf/AutoSuggest?query=' + encodeURIComponent(term), function(res){
        var body = '';

        res.on('data', function(chunk){
            body += chunk;
        });

        res.on('end', function(){
            console.log(body)
            var array = JSON.parse(body).result;
            responseArray = []

            for (item in array) {
                console.log(item)
                if (array[item].nametype === "personal") {
                    responseArray.push(array[item]);
                    console.log(array[item])
                }
            }

            if (responseArray.length > 0) {
              hints.viaf = responseArray
            }

            callback(hints);

        });
    }).on('error', function(e){
          console.log("Got an error: ", e);
    });
}
