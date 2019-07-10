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
    app.get('/get/:token/author', function (request, response) {
        response.sendFile('authors.html', {root: __dirname + '/app/views'})
    });

    // API
    app.get('/api/v1/:token/author/', (request, response) => {

        // Compose query
        let offset = Math.floor(Math.random() * 49);
        let query = queries.composeCobisQuery(queries.cobisSelect(offset));

        // Make request
        nodeRequest(query, (err, res, body) => {

            // Handle and send Cobis body
            let cobisResult = queries.handleCobisBody(JSON.parse(body));
            response.json(cobisResult);

        });
    });

    app.get('/api/v1/:token/author-options/', (request, response) => {

        // Get parameters
        let name = request.query.name;
        let surname = request.query.surname;

        // Compose Wikidata query
        let query = queries.composeQueryWikidata(name, surname);

        // Make request
        nodeRequest(query, (err, res, body) => {

            let wikidataResult = queries.handleWikidataBody(JSON.parse(body));
            let viaflist = [];

            wikidataResult.forEach((element) => {
                viaflist.push(element.viafurl);
            });

            // Compose VIAF query
            let query = queries.composeQueryVIAF(name, surname);

            // Make request
            nodeRequest(query, (err, res, body) => {

                let viafResult = queries.handleVIAFBody(JSON.parse(body), viaflist);

                response.json({
                    vars: queries.cobisMatchVars,
                    options: wikidataResult.concat(viafResult)
                });

            });
        });
    });

    app.post('/api/v1/:token/author-matches/', (request, response) => {

        // Get uri
        let personUri = request.body.identifier;
        let wikidataUri = request.body.wikidataUri;
        let viafurl = request.body.viafurl;
        let sbn = request.body.sbn;

        // Set endpoints
        let endpoints = {'wikidata': wikidataUri, 'viaf': viafurl, 'sbn': sbn};
        let completedQueries = 0;

        // Compose query
        let wikidataQuery = queries.composeCobisQuery(queries.cobisInsertWikidata(personUri, wikidataUri));
        let viafQuery = queries.composeCobisQuery(queries.cobisInsertViaf(personUri, viafurl));
        let sbnQuery = null;

        Object.keys(endpoints).forEach((key) => {

            // Empty query
            let query = null;

            // Parse query
            if(endpoints[key] !== undefined) {
                if (key === 'wikidata')
                    query = wikidataQuery;
                else if (key === 'viaf')
                    query = viafQuery;
                else if (key === 'sbn')
                    query = sbnQuery;
            }

            http.get(query, function(res) {
                if(++completedQueries === Object.keys(endpoints).length)
                    response.json({'status': 'success'});
            })

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
