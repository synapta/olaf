// Requirements
const express     = require('express');
const bodyParser  = require('body-parser');
const config      = require('./app/js/config.js');
const nodeRequest = require('request');
const queries     = require('./query');

// Global variables


/*var json = {};
exports.jeyson = json;
var nomeautore = '';
var cognomeautore = '';*/

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

    /*app.get('/search', function (request, response) {
        // let json = {"nome":"","cognome":"","nome_componenti":"","url":""}
        let attributi = [
            'name',
            'surname',
            'birth',
            'death',
            'main_residence',
            'professions',
            'gender',
            'studies',
            'place_of_birth',
            'place_of_death',
            'component_name',
            'url'
        ]
        console.log(request.query.paperino)
        response.send(attributi)
    });*/

    // Frontend
    app.get('/get/:token/authors/:offset', function (request, response) {
        response.sendFile('authors.html', {root: __dirname + '/app/views'})
    });

    app.get('/grid.css', function (req, res) {
        res.sendFile('/style.css', {
            root: __dirname + '/node_modules/semantic-ui-grid/grid.css'
        })
    });

    /*
    app.post('/up/addme', function (request) {
        let options = request.body.id
        config.obj["selected"] = request.body.id
        finaljson = config.makeJson4checkData(options)
        //finaljson = config.orderFonti(finaljson)
        console.log(finaljson)
    });

    app.post('/up/selected', function (request, res) {
        let options = request.body["ids[]"]
        config.obj["selected"] = request.body["ids[]"]
        finaljson = config.makeJson4checkData(options)
        console.log(finaljson)
    });
    app.post('/send/newdata', function (request, res) {
        let options = request.body
        console.log("\nsendnewdata\n")
        console.log(options)
    });*/

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

    /*
    app.get('/get/fulljson', function (request, response) {
        let pass = config.objv2
        response.send(pass)
    });*/

    /*app.get('/get/attributes', function (request, response) {
        let pass = config.objv2.attributes
        response.send(pass)
    });*/

    /*
    app.get('/get//options/dim', function (request, response) {
        let pass = fun.obj["options"]
        response.send(pass.length.toString())
    });

    app.get('/get/options', function (request, response) {
        let pass = config.obj
        response.send(pass['options'])
    });*/

};