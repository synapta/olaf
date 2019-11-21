// Author object
let author = null;
// Extract and store params from url
let params = parseUrl(window.location.href, {'userToken': 4, 'authorId': 6});

// Selection and matching
let selectedOptions = {};
let selectionInput = {};
let authorFields = null;

// Field grouping
let selectionLimit = 2;

let fieldsGrouping = {
    'Nome': [
        'name',
        'variant'
    ],
    'Bio': [
        'type',
        'gender',
        'birthDate',
        'birthPlace',
        'deathDate',
        'deathPlace'
    ],
    'Identificativi': [
        'wikidata',
        'wikipediaIt',
        'wikimediaCommons',
        'treccani',
        'viaf',
        'sbn'
    ]
};

let fieldsLimit = {
    'name': 1,
    'variant': null,
    'type': 1,
    'gender': 1,
    'birthDate': 1,
    'birthPlace': 1,
    'deathDate': 1,
    'deathPlace': 1,
    'wikidata': 1,
    'wikipediaIt': 1,
    'wikimediaCommons': 1,
    'treccani': 1,
    'viaf': null,
    'sbn': null
};

let fieldsLabels = {
    'uri': 'Id record',
    'name': 'Visualizzazione su BEWEB',
    'roles': 'Qualifica',
    'type': 'Categoria',
    'birthDate': 'Data di nascita/Data istituzione',
    'deathDate': 'Data di morte/Luogo soppressione',
    'birthPlace': 'Luogo di nascita/Luogo istituzione',
    'deathPlace': 'Luogo di morte/Data soppressione',
    'gender': 'Info di genere',
    'commons': 'Wikipedia',
    'heading': 'Intestazione',
    'variant': 'Varianti',
    'sources': 'Fonti archivistiche e bibliografiche',
    'links': 'Link',
    'wikidata': 'Wikidata',
    'wikipediaIt': 'Wikipedia',
    'wikimediaCommons': 'Commons',
    'treccani': 'Treccani',
    'viaf': 'VIAF',
    'sbn': 'SBN'
};

let subfieldsSelection = {
    authorName: {
        from: ['nameFull'],
        to: ['authorName']
    },
    authorGender: {
        from: ['label'],
        to: ['authorGender']
    },
    authorCategory: {
        from: ['label'],
        to: ['authorType']
    },
    authorBirth: {
        from: ['birthDate', 'birthPlace'],
        to: ['authorBirthDate', 'authorBirthPlace']
    },
    authorDeath: {
        from: ['deathDate', 'deathPlace'],
        to: ['authorDeathDate', 'authorDeathPlace']
    }
};

function authorSelect(element, item){

    // Parse item
    let stringedItem = item;
    let parsedItem = JSON.parse(item);
    let selected = null;

    console.log(selectedOptions);

    if(Object.keys(selectedOptions).length < selectionLimit) {

        // Store or remove author from selected list
        if (Object.keys(selectedOptions).includes(stringedItem)) {
            delete selectedOptions[stringedItem];
            selected = true;
        } else {
            selectedOptions[stringedItem] = parsedItem;
            selected = false;
        }

        // Render selected items
        renderSelectedAuthors(element, selected, Object.keys(selectedOptions).length);

    } else
        alert('Hai selezionato troppi autori');

}

function authorMatch(){

    // Group options fields by author fields
    if(params.userToken !== 'beweb') {
        Object.values(selectedOptions).forEach((option) => {
            authorFields.forEach((field) => {
                if (!selectionInput[field])
                    selectionInput[field] = [];
                if (option[field] && !selectionInput[field].includes(option[field])) {
                    selectionInput[field].push(option[field]);
                }
            })
        });
    }

    if(params.userToken === 'beweb'){
        // Render beweb matches
        renderBewebAuthorMatchesContainer(author, params.userToken, Object.values(selectedOptions), () => {
            renderBewebAuthorMatches(selectionInput);
        });
    } else {
        // Render author matches
        renderAuthorMatchesContainer(author, params.userToken, Object.values(selectedOptions), () => {
            renderAuthorMatches(selectionInput);
        });
    }

}

function matchField(label, value){

    // Handle object
    if(selectionInput[label]) {
            if (selectionInput[label]
                .map(item => item.toLowerCase())
                .includes(value.toLowerCase())
            ) {
                if(params.userToken !== 'beweb') {
                    selectionInput[label] = selectionInput[label].filter((item) => {
                        return item.toLowerCase() !== value.toLowerCase();
                    })
                }
            } else
                selectionInput[label].unshift(value);
    } else {
        selectionInput[label] = [];
        selectionInput[label].unshift(value);
    }

    // Evaluate array limit
    Object.keys(fieldsLimit).forEach((label) => {
        if(fieldsLimit[label] && selectionInput[label])
           selectionInput[label] = selectionInput[label].slice(0, fieldsLimit[label]);
    });

    // Handle button rendering
    fieldMatching(label, value);

    // Render author matches
    if(params.userToken !== 'beweb')
        renderAuthorMatches(selectionInput);
    else
        renderBewebAuthorMatches(selectionInput);

}

function removeField(label, field){

    if(label) {
        if (selectionInput[label]
            .map(field => field.toLowerCase())
            .includes(field.toLowerCase())
        ) {
            selectionInput[label] = selectionInput[label].filter((item) => {
                return item.toLowerCase() !== field.toLowerCase();
            })
        }
    }

}

function groupBewebAuthorFields(author, selectedOptions) {

    // Collect all options
    let options = [author].concat(selectedOptions);
    // Grouping object
    let grouping = {};

    options.forEach((option, index) => {

        let newOption = {};

        Object.keys(option).forEach((key) => {

            if(key in subfieldsSelection) {
                subfieldsSelection[key].from.forEach((item, index) => {

                    let newKey = subfieldsSelection[key].to[index].replace(/^(?:option|author)([A-Z])/, '$1');
                    newKey = newKey.charAt(0).toLowerCase() + newKey.slice(1);
                    newOption[newKey] = option[key][item];

                })
            } else {

                // Extract new key from options fields
                let newKey = key.replace(/^(?:option|author)([A-Z])/, '$1');
                newKey = newKey.charAt(0).toLowerCase() + newKey.slice(1);
                newOption[newKey] = option[key];

            }

        });

        options[index] = newOption;

    });


    // Initialize grouping
    Object.keys(fieldsGrouping).forEach((group) => {

        // Initialize grouping objects
        grouping[group] = [];

        fieldsGrouping[group].forEach((field) => {
            let fieldObject = {'label': field, 'dictionary': fieldsLabels[field], 'values': []};
            options.forEach((option) => {
                fieldObject.values.push({'field': field, 'value': option[field]});
            });
            grouping[group].push(fieldObject);
        });

    });

    return grouping;

}

function addNewInput(label){

    // Add new input to selection list
    if(!selectionInput[label]) {
        selectionInput[label] = []
    }

    // Append empty input
    selectionInput[label].unshift("");
    // Slice current collection
    // Evaluate array limit
    Object.keys(fieldsLimit).forEach((label) => {
        if(fieldsLimit[label] && selectionInput[label])
            selectionInput[label] = selectionInput[label].slice(0, fieldsLimit[label]);
    });

    if(params.userToken !== 'beweb')
        renderAuthorMatches(selectionInput);
    else
        renderBewebAuthorMatches(selectionInput);

}

function authorSkip(authorUri) {

    // API call
    $.ajax({
        url: '/api/v1/' + params.userToken + '/author-skip/',
        method: 'POST',
        data: {'authorId': authorUri},
        dataType: 'json',
        success: response => {
            if(response.status === 'success') {
                // Store last action in session
                sessionStorage.setItem("action", "skip");
                // Reload page
                location.href = '/get/' + params.userToken + '/author';
            } else
                alert("Errore");
        }
    });

}

function authorSend(){

    // Store last action in session
    sessionStorage.setItem("action", "match");
    // Send form
    document.getElementById('matches-form').submit();

}

// Get author, render author card, options and author labels
$(document).ready(() => {
    showUserToken(params.userToken);
    $.ajax({

        url: '/api/v1/' + params.userToken + '/author/' + ((params.authorId) ? params.authorId : ''),
        method: 'GET',
        dataType: 'json',
        success: response => {

            // Store author response
            author = response.authorResponse;
            // Render author card
            renderAuthorCard(response.authorResponse);
            // Render author options
            renderAuthorOptions({'options': response.optionsResponse.options});

            // Check empty response
            if(response.optionsResponse.options.length === 0) {
                alert('Non sono presenti match per questo autore. Verrà saltato automaticamente');
                authorSkip(author.authorUri);
            }

            // Set author fields
            authorFields = response.optionsResponse.fields;

        }
    });
});