// Requirements
const express        = require('express');
const bodyParser     = require('body-parser');
const nodeRequest    = require('request');
const promiseRequest = require('request-promise');

// Modules
let queries          = null;
let parser           = null;

// Token validation
function validateToken(token) {

    // Get valid tokens
    let validTokens = ['cobis', 'aaso', 'amt', 'cai', 'cmus', 'dssp',
                       'fga', 'ibmp', 'inaf', 'inrim', 'oato', 'plev',
                       'slvm', 'toas', 'beweb'];

    // Check if token is valid
    return validTokens.includes(token);

}

module.exports = function(app) {

    // Setting up express
    app.use('/', express.static('./app'));
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(bodyParser.json());

    // Token middleware
    app.all(['/api/v1/:token/*', '/get/:token/*'], (request, response, next) => {

        // Get token
        let token = request.params.token;

        // Validate token
        if (validateToken(token)) {

            // Load modules
            queries = require('./users/' + token + '/queries');
            parser = require('./users/' + token + '/parser');

            // Next route
            next();

        } else {
            // Set not allowed response
            response.status(403);
            response.send('Not allowed to read this resource.');
        }

    });

    // Frontend
    app.get(['/get/:token/author/', '/get/:token/author/:authorId'], (request, response) => {
        response.sendFile('author.html', {root: __dirname + '/app/views'});
    });

    // API
    app.get(['/api/v1/:token/author/', '/api/v1/:token/author/:authorId'], (request, response) => {

        // Compose author query
        let token = request.params.token;
        // TODO: da far tornare alla normalità una volta terminato l'import da Beweb
        let queryAuthor = token === 'beweb' ? '' : queries.authorSelect(request.params.authorId);

        // Make request
        nodeRequest(queryAuthor, (err, res, body) => {

            // TODO: da far tornare alla normalità una volta terminato l'import da Beweb
            let bewebAuthor = {

                Idrecord: "CEIAF0000004",
                Visualizzazione_su_BEWEB: "Papa Benedetto XIII",
                Categoria: "Persona",
                Codice_SBN: "CFIV009838",
                Intestazione: [
                    "Benedictus <papa ; 13.>",
                    "Papa Benedetto XIII <Gravina in Puglia, 1650 - Roma, 1730>"
                ],
                Fonti_archivistiche_e_bibliografiche: [
                    "De Caro Gaspare",
                    "http://www.treccani.it/enciclopedia/papa-benedetto-xiii_(Dizionario-Biografico)/",
                    "ICCU, banca dati SBN"
                ],
                Varianti: [
                    "Orsini, Pietro Francesco",
                    "Benedetto",
                    "Vincenzo Maria"
                ],
                Info_di_genere: "M",
                Data_di_nascita_Data_istituzione: "02/02/1650",
                Luogo_di_nascita_Luogo_istituzione: "Gravina in Puglia",
                Data_di_morte_Luogo_soppressione: "21/02/1730",
                Luogo_di_morte_Data_soppressione: "Roma",
                Qualifica: [
                    "Papa"
                ],
                Wikipedia: "https://it.wikipedia.org/wiki/Papa_Benedetto_XIII",
                VIAF: "http://viaf.org/viaf/7549012",
                ISNI: "http://www.isni.org/0000000107747711",
                Link: [
                    "http://w2.vatican.va/content/vatican/it/holy-father/benedetto-xiii.html",
                    "http://www.treccani.it/enciclopedia/papa-benedetto-xiii_(Dizionario-Biografico)"
                ]

            };

            // Handle and send author
            let author = parser.parseAuthor(bewebAuthor);
            console.log(author);

            // Query options
            let requests = queries.authorOptions(author.authorName.nameFirst, author.authorName.nameLast);
            // Map requests to make Promise
            requests = requests.map(query => promiseRequest(query));

            // Make options queries
            Promise.all(requests).then((bodies) => {
                // Parse result
                parser.parseAuthorOptions(author, bodies.map(body => JSON.parse(body)), (optionsResponse) => {

                    // Send back options and author response
                    response.json({'authorResponse': author, 'optionsResponse': optionsResponse});

                });
            });
        });

    });

    app.get('/api/v1/:token/author-options/', (request, response) => {

        // Get parameters
        let firstName = request.query.firstName;
        let lastName = request.query.lastName;

        // Get requests
        let requests = queries.authorOptions(firstName, lastName);
        // Map requests to make Promise
        requests = requests.map(query => promiseRequest(query));

        // Make options queries
        Promise.all(requests).then((bodies) => {
            // Parse result
            parser.parseAuthorOptions(bodies.map(body => JSON.parse(body)), (res) => {
                // Send back options response
                response.json(res);
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

        // Compose query
        let requests = queries.authorSkip(request.body);

        // Send requests
        nodeRequest(requests, (err, res, body) => {
            // Send response
            response.json({'status': 'success'});
        });

    });

};
