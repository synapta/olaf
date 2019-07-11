// Requirements
const express        = require('express');
const bodyParser     = require('body-parser');
const nodeRequest    = require('request');
const promiseRequest = require('request-promise');
const queries        = require('./query');

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
        let wikidataUri = request.body.wikidata;
        let viafurl = request.body.viafurl;
        let sbn = request.body.sbn;

        // Set queries
        let links = {'wikidata': wikidataUri, 'viaf': viafurl, 'sbn': sbn};
        let linkQueries = [];

        // Queries array
        Object.keys(links).forEach((key) => {

            // Parse query
            if(links[key] !== undefined) {
                if (key === 'wikidata')
                    linkQueries.push(queries.composeCobisQuery(queries.cobisInsertWikidata(personUri, wikidataUri)));
                else if (key === 'viaf')
                    linkQueries.push(queries.composeCobisQuery(queries.cobisInsertViaf(personUri, viafurl)));
                else if (key === 'sbn' && !personUri.includes('IT_ICCU'))
                    linkQueries.push(queries.composeCobisQuery(queries.cobisInsertSbn(personUri, sbn)));
            }

        });

        // Map queries to make Promise
        let promises = linkQueries.map(link => promiseRequest(link));
        Promise.all(promises).then((data) => {
            // Send response
            response.redirect('/get/' + request.params.token + '/author');
        });

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
