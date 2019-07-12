// Requirements
const express        = require('express');
const bodyParser     = require('body-parser');
const nodeRequest    = require('request');
const promiseRequest = require('request-promise');
const queries        = require('./queries');
const parser         = require('./parser');

// Token validation
function validateToken(token) {

    // Get valid tokens
    let validTokens = ['cobis'];

    // Check if token is valid
    return validTokens.includes(token);

}

module.exports = function (app) {

    // Setting up express
    app.use('/', express.static('./app'));
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json());

    // Token middleware
    app.all(['/api/v1/:token/*', '/get/:token/*'], function (request, response, next) {

        // Get token
        let token = request.params.token;

        // Validate token
        if (validateToken(token))
        // Next route
            next();
        else {
            // Set not allowed response
            response.status(403);
            response.send('Not allowed to read this resource.');
        }

    });

    // Frontend
    app.get('/get/:token/author', function (request, response) {
        response.sendFile('authors.html', {root: __dirname + '/app/views'})
    });

    // API
    app.get('/api/v1/:token/author/', (request, response) => {

        // Compose query
        let query = queries.authorSelect();

        // Make request
        nodeRequest(query, (err, res, body) => {
            // Handle and send author
            let author = parser.parseAuthor(JSON.parse(body));
            response.json(author);
        });

    });

    app.get('/api/v1/:token/author-options/', (request, response) => {

        // Get parameters
        let name = request.query.name;
        let surname = request.query.surname;

        // Get queries
        let optionQueries = queries.authorOptions(name, surname);
        let optionRequests = optionQueries.map(query => promiseRequest(query));

        // Make options queries
        Promise.all(optionRequests).then((bodies) => {
            // Parse result
            parser.parseAuthorOptions(bodies.map(body => JSON.parse(body)), (options) => {
                // Send back options response
                response.json(options);
            });
        });

    });

    app.post('/api/v1/:token/author-matches/', (request, response) => {

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

    app.post('/api/v1/:token/author-skip/', (request, response) => {

        // Get uri
        let personUri = request.body.uri;
        // Compose query
        let query = queries.composeCobisQuery(queries.cobisInsertSkip(personUri));

        // Compose Cobis query
        nodeRequest(query, (err, res, body) => {
            // Send response
            response.json({'status': 'success'});
        });

    });

};
