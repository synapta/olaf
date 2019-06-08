// Requirements
const express     = require('express');
const bodyParser  = require('body-parser');
const config      = require('./app/js/config.js');
const nodeRequest = require('request');
const queries     = require('./query');

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
    app.get('/get/:token/authors/:offset', function (request, response) {
        response.sendFile('authors.html', {root: __dirname + '/app/views'})
    });

    // API
    app.get('/api/v1/:token/author-info/:offset', (request, response) => {

        // Compose query
        let offset = request.params.offset;
        let query = queries.composeCobisQuery(offset);

        // Make request
        nodeRequest(query, (err, res, body) => {

            // Handle and send Cobis body
            let cobisResult = queries.handleCobisBody(JSON.parse(body));
            console.log(cobisResult);
            response.json(cobisResult);

        });
    });

    app.get('/api/v1/:token/author-options/:offset', (request, response) => {

        // Get parameters
        let name = request.query.name;
        let surname = request.query.surname;

        // Compose Wikidata query
        let query = queries.composeQueryWikidata(name, surname);

        // Make request
        nodeRequest(query, (err, res, body) => {
            let wikidataResult = queries.handleWikidataBody(JSON.parse(body));
            console.log(wikidataResult);
            response.json(wikidataResult);
        });

    });

    app.post('/api/v1/:token/author-matches/:offset', (request, response) => {
        response.json(request.body);
    });

};