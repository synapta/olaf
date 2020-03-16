// Requirements
const nodeRequest    = require('request');
const promiseRequest = require('request-promise');
const fs             = require('fs');
const schedule       = require('node-schedule');
const Config         = require('./config').Config;

// Modules
let queries          = null;
let parser           = null;
let auth             = null;
let config           = null;
let configToken      = null;
let mailer           = null;
let enrichments      = require('./users/arco/enrichments');

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
        '/get/:token/user-verification',
        '/api/v1/:token/login',
        '/api/v1/:token/signup',
        '/api/v1/:token/verify-user',
        '/api/v1/:token/username-existence',
        '/api/v1/:token/email-existence',
        '/api/v1/:token/logged-user',
        '/api/v1/:token/feed-enrichments',
        '/api/v1/:token/author',
        '/api/v1/:token/get-agents',
        '/api/v1/:token/update-documents',
        '/api/v1/:token/logged-user',
        '/api/v1/:token/blank-documents'
    ];

    // Replace placeholder with current token
    allowedUrl = allowedUrl.map((el) => el.replace(':token', configToken));

    return allowedUrl.map((el) => url.includes(el)).some((el) => el);

}

module.exports = function(app, passport = null, driver = null) {

    if(driver) {
        schedule.scheduleJob('*/5 * * * *', (fireDate) => {
            enrichments.resetLocks(driver, () => {
                console.log(fireDate, "Reset locks");
            });
        });
    }

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
                mailer = require('./users/' + token + '/mailer');
            }

            // Initialize configuration
            parser.configInit(config);

            // Next route
            if(loginToken(token) && !request.user && !loggingFlow(request.originalUrl))
                response.redirect('/get/' + token + '/login?redirect=' + request.originalUrl);
            else
                next();

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

    app.get('/get/:token/user-verification', (request, response) => {
        response.sendFile('user-verification.html', {root: __dirname + '/app/views'});
    });

    app.get('/get/:token/author-list/', (request, response) => {
        if (request.params.token === 'beweb') {
            response.sendFile('author-list.html', {root: __dirname + '/app/views'});
        }
    });

    // Arco users
    app.post('/api/v1/arco/signup', (request, response) => {
        auth.insertUser(driver, request.body.email, request.body.password, request.body.username, (email, token, err) => {
            if(!err)
                mailer.sendVerificationEmail(email, token, request.body.redirect, () => {
                    response.redirect('/get/arco/user-verification')
                });
            else
                response.redirect('/get/arco/login?message=genericError');
        });
    });

    app.post('/api/v1/arco/login', (request, response, next) => {
        passport.authenticate('local', (err, user, info) => {

            if (err)
                return next(err);
            if (!user)
                return response.redirect('/get/' + configToken + '/login?message=' + info.message);

            request.logIn(user, (err) => {
                if (err) return next(err);
                return response.redirect(request.body.redirect ? request.body.redirect : '/get/arco/author');
            });

        })(request, response, next);
    });

    app.get('/api/v1/arco/verify-user/:token', passport.authenticate('authtoken', {params: 'token'}), (request, response) => {
        response.redirect(request.query.redirect ? request.query.redirect + '?verified=true' : '/get/' + configToken + '/author?verified=true');
    });

    app.get('/api/v1/arco/email-existence/:email', (request, response) => {
        auth.findUserById(driver, request.params.email, (err, res) => {
            response.json({'exists': !!(!err && res)});
        })
    });

    app.get('/api/v1/arco/username-existence/:username', (request, response) => {
       auth.findUserByUsername(driver, request.params.username, (err, res) => {
           response.json({'exists': !!(!err && res)});
       })
    });

    app.get('/api/v1/:token/logged-user', (request, response) => {
        response.json({user: request.user ? request.user : null});
    });

    // Enrichments
    app.get('/api/v1/:token/feed-enrichments', (request, response) => {
        enrichments.feedEnrichments(driver, () => {
            response.json({status: 'enriched'});
        });
    });

    // API
    app.get(['/api/v1/:token/author/', '/api/v1/:token/author/:authorId'], (request, response) => {

        let user = (!request.query.enrichment && request.user) ? request.user.username : null;
        let agent = request.params.authorId;

        enrichments.getAndLockAgent(driver, user, agent, !request.query.enrichment, (result) => {

            if(result && !request.query.enrichment) {
                // Send stored options and author
                response.json({author: result.author, options: result.options});
            } else {

                // Compose author query
                let queryAuthor = queries.authorSelect(request.params.authorId);

                // Make request
                nodeRequest(queryAuthor, (err, res, body) => {

                    // Handle and send author
                    let author = parser.parseAuthor(JSON.parse(body));
                    // Query options
                    let requests = queries.authorOptions((author.name || '').trim(), '');

                    //console.log(author);

                    // Make options queries
                    Promise.all(requests).then((bodies) => {

                        bodies = bodies.map(body => {
                            try {JSON.parse(body)}
                            catch {return {}}
                            return JSON.parse(body);
                        });

                        // Parse result
                        parser.parseAuthorOptions(author, bodies, (options) => {

                            let responseObject = {
                                author: author,
                                options: options
                            };

                            if(driver)
                                // Store current result
                                enrichments.storeEnrichment(driver, responseObject).then(response.json(responseObject));
                            else
                                // Send back options and author response
                                response.json(responseObject);

                        });

                    }).catch((error) => console.error(error));

                });

            }

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
        let requests = queries.authorLink(request, driver);
        if(configToken !== 'arco')
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
        let requests = queries.authorSkip(request, driver);

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
