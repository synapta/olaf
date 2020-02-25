// Requirements
const nodeRequest    = require('request');
//const pgp            = require('pg-promise')({});
const promiseRequest = require('request-promise');
const fs             = require('fs');
const Config         = require('./config').Config;
//const pgConnection   = require('./pgConfig').pgConnection;

// Modules
let queries          = null;
let parser           = null;
let auth             = null;
let config           = null;
let configToken      = null;

//const db = pgp(pgConnection);
//const bewebQueries = require('./users/beweb/queries');

/*schedule.scheduleJob('21 4 * * *', function(firedate) {
    console.log(firedate, "checking modifications");
    bewebQueries.getAllIdBeweb(db, function(data) {
        let parseAnother = function() {
            if (data.length === 0 ) {
                return;
            }
            let record = data.pop();
            bewebQueries.checkWikidataModification(db, record.id_beweb, function(data) {
                setTimeout(function(){ parseAnother(); }, 10000); 
            });
        };
        parseAnother();
    })
});*/


// Token validation
function validateToken(token) {

    // Get valid tokens
    let validTokens = ['cobis', 'aaso', 'amt', 'cai', 'cmus', 'dssp',
                       'fga', 'ibmp', 'inaf', 'inrim', 'oato', 'plev',
                       'slvm', 'toas', 'beweb', 'arco'];

    // Check if token is valid
    return validTokens.includes(token);

}

function loginToken(token) {

    // Get tokens that need login
    let loginTokens = ['arco'];

    // Check if current token need login
    return loginTokens.includes(token);

}

function loggingFlow(url) {

    // Get allowed login url
    let allowedUrl = [
        '/get/:token/login',
        '/api/v1/:token/login',
        '/api/v1/:token/signup',
        '/api/v1/:token/verify-user'
    ];

    // Replace placeholder with current token
    allowedUrl = allowedUrl.map((el) => el.replace(':token', configToken));

    return allowedUrl.map((el) => url.includes(el)).some((el) => el);

}

module.exports = function(app, passport = null, driver = null) {

    // Token middleware
    app.all(['/api/v1/:token/*', '/get/:token/*'], (request, response, next) => {

        // Get token
        let token = request.params.token;

        // Validate token
        if (validateToken(token)) {

            // Load user config
            if(!config || token !== configToken) {
                config = new Config(JSON.parse(fs.readFileSync(`./app/js/config/${token}.json`)));
                configToken = token;
            }

            // Load modules
            queries = require('./users/' + token + '/queries');
            parser = require('./users/' + token + '/parser');
            if(loginToken(token)) {
                require('./users/' + token + '/passport')(passport, driver);
                auth = require('./users/' + token + '/users');
            }

            // Initialize configuration
            parser.configInit(config);

            // Next route
            if(loginToken(token) && !request.user && !loggingFlow(request.originalUrl))
                response.redirect('/get/' + token + '/login');
            else
                next()

        } else {

            // Set not allowed response
            response.status(403);
            response.send('Not allowed to read this resource.');

        }

    });

    // Frontend
    app.get(['/get/:token/author/', '/get/:token/authorityfile/', '/get/:token/author/:authorId', '/get/:token/authorityfile/:authorId'], (request, response) => {
        response.sendFile('author.html', {root: __dirname + '/app/views'});
    });

    app.get('/get/:token/login', (request, response) => {
        response.sendFile('login.html', {root: __dirname + '/app/views'});
    });

    app.get('/get/:token/author-list/', (request, response) => {
        if (request.params.token === 'beweb') {
            response.sendFile('author-list.html', {root: __dirname + '/app/views'});
        }
    });

    // Arco users
    app.post('/api/v1/arco/signup', (request, response) => {
        auth.insertUser(driver, request.body.email, request.body.password, request.body.username, (err) => {
            response.json({error: err})
        });
    });

    app.post('/api/v1/arco/login',
        passport.authenticate('local', {
            successRedirect: '/get/arco/author',
            failureRedirect: '/get/arco/login',
            failureFlash: true
        })
    );

    app.get('/api/v1/arco/verify-user/:token', passport.authenticate('authtoken', {params: 'token'}), (request, response) => {
        /*if (request.user.return_to)
            response.redirect(request.user.return_to);
        else
            response.redirect('/?message=welcome');*/
        console.log(request.user);
    });

    // API
    app.get(['/api/v1/:token/author/', '/api/v1/:token/author/:authorId'], (request, response) => {

        // Compose author query
        let queryAuthor = queries.authorSelect(request.params.authorId);

        // Make request
        nodeRequest(queryAuthor, (err, res, body) => {
            // Handle and send author
            let author = parser.parseAuthor(JSON.parse(body));

            // Query options
            let requests = queries.authorOptions((author.name || '').trim(), '');
 
            // Make options queries
            Promise.all(requests).then((bodies) => {
                // Parse result
                parser.parseAuthorOptions(author, bodies.map(body => JSON.parse(body)), (options) => {
                    // Send back options and author response
                    response.json({'author': author, 'options': options});
                });
            });

        });

    });

    app.get('/api/v1/:token/config/', (request, response) => {

        // Send configuration object
        response.json(config.getConfig())

    });

    app.get('/api/v1/:token/author-options/', (request, response) => {

        // Get parameters
        let firstName = request.query.firstName;
        let lastName = request.query.lastName;

        // Get requests promise
        let requests = queries.authorOptions(firstName, lastName);

        // Make options queries
        Promise.all(requests).then((bodies) => {
            // Parse result
            parser.parseAuthorOptions(bodies.map(body => JSON.parse(body)), (res) => {
                // Send back options response
                response.json(res);
            });
        });

    });

    app.post('/api/v1/:token/enrich-author/', (request, response) => {

        // Get requests
        let requests = queries.authorLink(request.body);

        // Map requests to make Promise
        requests = requests.map(req => promiseRequest(req));

        // Send requests
        Promise.all(requests).then((data) => {
            // Send response
            response.redirect('/get/' + request.params.token + '/author');
        })

    });

    app.post('/api/v1/:token/enrich-beweb-author/:uri', (request, response) => {

        let output = parser.parseOutput(request.body);
        output['Idrecord'] = request.params.uri;

        // if wikidata is linked to a AFXD resource we save the query response in the database.
        if (output['Wikidata']) {
            queries.storeWikidataInfo(db, output);
        }

        nodeRequest.post({
            url: queries.authorLink(output)
        }, (err, res, body) => {

            // Handle error
            if(err) throw err;

            // Send back Beweb response
            response.json(JSON.parse(body));

        });

    });

    app.post('/api/v1/:token/author-skip/', (request, response) => {

        // Compose query
        let requests = queries.authorSkip(request.body);

        // Send requests
        nodeRequest(requests, (err, res, body) => {
            // Send response
            response.json({'status': 'success'});
        });

    });

    app.post('/api/v1/:token/add-author-again', (request, response) => {
        // Send requests
        let data = request.body;
        queries.storeWikidataInfo(db, data, () => {
            // Send response
            response.status(200).json({"done":true});
        });
    });

    app.get('/api/v1/:token/author-list/', (request, response) => {
        // Send requests
        queries.getChangedRecords(db, (data) => {
            // Send response
            response.json(data);
        });
    });

};
