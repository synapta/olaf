var express = require('express');
var wikidata = require('./wikidata.js');
var cobis = require('./queries/cobis.js');
var leibniz = require('./queries/leibniz.js');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;


var app = express();
//NEXT TWO LINES FOR READ BODY FROM POST
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());
app.use(morgan('common'));

app.use('/',express.static('.'));

/* PAGES */
app.get('/id/contracts/:id', function (request, response) {
    response.sendFile(__dirname + '/contratto.html');
});


app.post('/subscribe-news', function(req, res) {
    if (req.body === undefined) {
        return res.send("Something wrong... Try again later!");
    }

    if (req.body.email === undefined) {
        return res.send("Something wrong... Try again later!");
    }

    MongoClient.connect(config.mongoURL, function(err, db) {
        var sub = {};
        sub.email = req.body.email;
        var date = new Date();
        sub.registrationDate = date.toISOString();
        db.collection("news-subscription").insert(sub);
    });

    return res.send('{"status" : "success"}');
});


/* QUERY */
app.get('/leibniz', function (request, response) {
    leibniz.launchSparqlLeibniz(leibniz.getRemains, function (total) {
        leibniz.launchSparqlLeibniz(leibniz.getRandomLeibnizItem(total.n.value), function (seed) {
            console.log(seed.s.value)
            wikidata.getWikidataHints(seed.label.value, seed, function (hints) {
                if (hints === "rlm") {
                    setTimeout(function () {
                        response.send({"retry":true});
                    }, 1000)
                } else if (hints) {
                   response.send(hints);
                } else {
                   console.log("no hints")
                   leibniz.launchSparqlUpdateLeibniz(leibniz.noWikidataHints(seed.s.value), function () {
                       setTimeout(function () {
                           response.send({"retry":true});
                       }, 1000)
                   });
                }
            });
        });
    });
});

app.get('/leibniz/forMeIsNo/:leib/:user/', function (request, response) {
    leibniz.launchSparqlUpdateLeibniz(leibniz.forMeIsNo(request.params.leib, request.params.user), function () {
        response.send("ok");
    });
});

app.get('/leibniz/forMeIsYes/:leib/:wikidata/:user/', function (request, response) {
    leibniz.launchSparqlUpdateLeibniz(leibniz.forMeIsYes(request.params.leib, request.params.wikidata, request.params.user), function () {
        response.send("ok");
    });
});


app.get('/cobis', function (request, response) {
    cobis.launchSparql(cobis.getRemains, function (total) {
        cobis.launchSparql(cobis.getRandomCobisItem (total.n.value), function (seed) {
            console.log(seed.agentLabel.value)
            wikidata.getWikidataHints(seed.agentLabel.value, seed, function (hints) {
                if (hints === "rlm") {
                    setTimeout(function () {
                        response.send({"retry":true});
                    }, 1000)
                } else if (hints) {
                   response.send(hints);
                } else {
                   console.log("no hints")
                   cobis.launchSparqlUpdate(cobis.noWikidataHints(seed.agent.value), function () {
                       setTimeout(function () {
                           response.send({"retry":true});
                       }, 1000)
                   });
                }
            });
        });
    });
});

app.get('/cobis/forMeIsNo/:leib/:user/', function (request, response) {
    cobis.launchSparqlUpdate(cobis.forMeIsNo(request.params.leib, request.params.user), function () {
        response.send("ok");
    });
});

app.get('/cobis/forMeIsYes/:leib/:wikidata/:user/', function (request, response) {
    cobis.launchSparqlUpdate(cobis.forMeIsYes(request.params.leib, request.params.wikidata, request.params.user), function () {
        response.send("ok");
    });
});



app.use(function(req, res) {
    res.status(404);
});

var server = app.listen(8081, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Server listening at http://%s:%s', host, port);
});
