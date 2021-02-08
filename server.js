require('dotenv').config();

const scheduler = require('./scheduler');

async function runScheduler() {
    await scheduler.run();
    setTimeout(runScheduler, 60000);
}

setTimeout(runScheduler, 10000);

// 30 days
const SESSION_TIMEOUT = 30 * 86400000;

const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const Sentry = require('@sentry/node');
const passport = require('passport');
const expressSession = require('express-session');
const SessionStore = require('express-session-sequelize')(expressSession.Store);

const { sequelize } = require('./database');

const sequelizeSessionStore = new SessionStore({
    db: sequelize,
    expiration: SESSION_TIMEOUT
});

// Setting up express
const app = express();

Sentry.init({ dsn: process.env.SENTRY });

// Setting up additional components
app.use(morgan('common'));
app.use('/', express.static('./app'));
app.use(bodyParser.json());
app.use(expressSession({
    secret: process.env.SESSION_SECRET || 'secret',
    store: sequelizeSessionStore,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Set session cookie maxAge
app.use(function (req, res, next) {
    if (req.method == 'POST' && req.url == '/api/v2/user/login') {
        req.session.cookie.maxAge = SESSION_TIMEOUT;
        req.session.touch();
    }
    next();
});

app.use(Sentry.Handlers.requestHandler());

require('./routes.js')(app, passport);

app.use(Sentry.Handlers.errorHandler());

const server = app.listen(process.env.PORT || 3646, 'localhost', () => {
    const host = server.address().address;
    const port = server.address().port;
    console.log('Server listening at http://%s:%s', host, port);
});
