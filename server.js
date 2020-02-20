var express      = require('express');
var morgan       = require('morgan');
var bodyParser   = require('body-parser');
const MongoClient = require('mongodb').MongoClient;

var app = express();
app.use(morgan('common'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

MongoClient.connect('mongodb://localhost:27017', function(err, client) {

    // Initialize db client
    let db = client.db('arco');

    // Get routes
    require('./routes.js')(app, db);

    // Notify server uptime
    var server = app.listen(3646, function() {
        var host = server.address().address;
        var port = server.address().port;
        console.log('Server listening at http://localhost:%s', port);
    });

});
