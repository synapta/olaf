const express      = require('express');
const morgan       = require('morgan');
const bodyParser   = require('body-parser');
const MongoClient  = require('mongodb').MongoClient;
const session      = require('express-session');
const schedule     = require('node-schedule');
const passport     = require('passport');
const flash        = require('connect-flash');

// Setting up express
const app = express();

// Setting up additional components
app.use(morgan('common'));
app.use('/', express.static('./app'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(session({secret: 'synapta'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// Get routes
MongoClient.connect("mongodb://localhost:27017/", (err, client) => {

    if(err || true)
        require('./routes.js')(app, passport);
    else
        require('./routes.js')(app, passport, client.db('arco'));

    // Notify server uptime
    let server = app.listen(3646, () => {
        console.log('Server listening at http://localhost:%s', 3646);
    });

});