// Import modules
const express      = require('express');
const morgan       = require('morgan');
const bodyParser   = require('body-parser');

// Initialize Express
const app = express();

// Setup application
app.use(morgan('common'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/', express.static('./app'));
require('./routes.js')(app);

// Launch server
var server = app.listen(3646, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log('Server listening at http://localhost:%s', port);
});
