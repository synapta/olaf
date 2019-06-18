var express      = require('express');
var morgan       = require('morgan');
var bodyParser   = require('body-parser');

var app = express();
app.use(morgan('common'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
require('./routes.js')(app);

var server = app.listen(3645, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Server listening at http://%s:%s', host, port);
});