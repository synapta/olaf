// Parse author
function parseAuthor(body){

    // Author map
    let authorMap = {
        'authorUri': 'personURI',
        'authorName': 'personName',
        'authorTitles': 'title',
        'authorRoles': 'personRole'
    };

    // Get bindings
    let bindings = body.results.bindings[0];
    // Author object
    let author = {};

    // Parse bindings
    if(bindings) {

        // Map fields
        Object.keys(authorMap).map(key => {
            if (bindings[authorMap[key]] && bindings[authorMap[key]].value !== '')
                author[key] = bindings[authorMap[key]].value;
            else
                author[key] = null;
        });

        // Parse name, titles and roles
        if(author.authorName)
            author.authorName = parseAuthorName(author.authorName);
        if(author.authorTitles)
            author.authorTitles = parseAuthorTitles(author.authorTitles);
        if(author.authorRoles)
            author.authorRoles = parseAuthorRoles(author.authorRoles);

    }

    return author;

}

function parseAuthorName(authorName){

    // Initialize name object
    let nameObject = {};
    // Store complete name
    nameObject['nameFull'] = authorName;

    // Split name
    let tokens = authorName.split(', ');

    // Parse name
    let surname = tokens[0].split('<')[0].trim() || "";
    let name = "";
    if(tokens[1]) {
        name = tokens[1].split('<')[0].trim() || tokens[1].split('(')[0].trim() || "";
    }

    // Store firstName and lastName
    nameObject['nameFirst'] = name;
    nameObject['nameLast'] = surname;

    // Return name object
    return nameObject;

}

function parseAuthorTitles(authorTitles){

    // Split titles
    let titles = authorTitles.split('###');
    return {'titlesNumber': titles.length, 'titlesItems': [titles[0], titles[1], titles[2]]}

}

function parseAuthorRoles(authorRoles){

    // Split titles
    let roles = authorRoles.split('###');
    return {'rolesNumber': roles.length, 'rolesItems': roles}

}

// Parse author options
function parseAuthorOptions(bodies, callback) {

    // Set author labels
    let authorFields = ["optionWikidata", "optionViaf", "optionSbn"];

    // Store bodies
    let wikidataBody = bodies[0];
    let viafBody = bodies[1];

    // Parse wikidata body
    let wikidataWithViaf = [];
    parseWikidataOptions(wikidataBody, wikidataWithViaf, (wikidataOptions) => {
        parseViafOptions(viafBody, wikidataWithViaf, (viafOptions) => {
            // Compose options object
            let options = wikidataOptions.concat(viafOptions);
            // Callback
            callback({'options': options, 'fields': authorFields});
        });
    });

}

function parseWikidataOptions(wikidataBody, wikidataWithViaf, callback) {

    // Wikidata map
    let wikidataMap = {
        'optionWikidata': 'wikidata',
        'optionName': 'nome',
        'optionType': 'tipologia',
        'optionDescription': 'descrizione',
        'optionBirthDate': 'birthDate',
        'optionDeathDate': 'deathDate',
        'optionImage': 'immagine',
        'optionWikiperdiaIt': 'itwikipedia',
        'optionTreccani': 'treccani',
        'optionViaf': 'viafurl',
        'optionSbn': 'sbn'
    };

    // Results array
    let wikidataOptions = [];

    // Parse results
    let bindings = wikidataBody.results.bindings;
    bindings.forEach((binding) => {
        // Generate new option
        let wikidataOption = {};
        // Map result
        Object.keys(wikidataMap).forEach((key) => {
            if(binding[wikidataMap[key]] && binding[wikidataMap[key]].value !== '') {
                wikidataOption[key] = binding[wikidataMap[key]].value;
                if(key === 'optionViaf') {
                    // Handle VIAF
                    let viafUriParameters = wikidataOption[key].split('/');
                    wikidataWithViaf.push(viafUriParameters[viafUriParameters.length - 1]);
                } else if(key === 'optionBirthDate' || key === 'optionDeathDate')
                    // Handle dates
                    wikidataOption[key] = wikidataOption[key].substr(0, 10);
            } else
                wikidataOption[key] = null;
        });
        // Parse option for selection
        wikidataOption['optionItem'] = JSON.stringify(wikidataOption);
        // Push option
        wikidataOptions.push(wikidataOption)
    });

    // Callback
    callback(wikidataOptions);

}

function parseViafOptions(viafBody, wikidataWithViaf, callback) {

    // VIAF map
    let viafMap = {
        'optionWikidata': null,
        'optionName': 'term',
        'optionType': 'nametype',
        'optionDescription': null,
        'optionBirthDate': null,
        'optionDeathDate': null,
        'optionImage': null,
        'optionWikiperdiaIt': null,
        'optionTreccani': null,
        'optionViaf': 'viafid',
        'optionSbn': null
    };

    // Results array
    let viafOptions = [];

    // Parse results
    let results = viafBody.result;
    if(results) {
        results.forEach((result) => {
            // Generate new option
            let viafOption = {};
            // Check VIAF id
            if (!wikidataWithViaf.includes(result['viafid'])) {
                // Map result
                Object.keys(viafMap).forEach((key) => {
                    if (viafMap[key] && result[viafMap[key]] && result[viafMap[key]] !== '') {
                        viafOption[key] = result[viafMap[key]];
                        if(key === 'optionViaf')
                            viafOption[key] = 'https://viaf.org/viaf/' + viafOption[key];
                    } else
                        viafOption[key] = null;
                });
                // Parse option for selection
                viafOption['optionItem'] = JSON.stringify(viafOption);
                // Push option
                viafOptions.push(viafOption);
            }
        });
    }

    // Callback
    callback(viafOptions);

}

// Exports
exports.parseAuthor = (body) => {
    return parseAuthor(body);
};

exports.parseAuthorOptions = (bodies, callback) => {
    parseAuthorOptions(bodies, (options) => {
        callback(options);
    });
};