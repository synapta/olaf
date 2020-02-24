const express      = require('express');
const morgan       = require('morgan');
const bodyParser   = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const app = express();

// Setting up additional components
app.use(morgan('common'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Get routes
MongoClient.connect("mongodb://localhost:27017/", (err, client) => {

    if(err)
        require('./routes.js')(app);
    else
        require('./routes.js')(app, client.db('arco'));

    // Notify server uptime
    var server = app.listen(3646, function() {
        var host = server.address().address;
        var port = server.address().port;
        console.log('Server listening at http://localhost:%s', port);
    });

});