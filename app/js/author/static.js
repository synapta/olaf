/*function authorSelect(element, item){

    // Parse item
    let stringedItem = item;
    let parsedItem = JSON.parse(item);
    let selected = null;

    // Store or remove author from selected list
    if (Object.keys(selectedOptions).includes(stringedItem)) {
        delete selectedOptions[stringedItem];
        selected = true;
    } else {
        if(Object.keys(selectedOptions).length < selectionLimit) {
            selectedOptions[stringedItem] = parsedItem;
            selected = false;
        } else {
            alert('Sono stati selezionati troppi autori.');
            return;
        }
    }

    // Render selected items
    renderSelectedAuthors(element, selected, Object.keys(selectedOptions).length);

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

        // Store image for each option
        authorImages.push(option.optionImage);

        // Initialize new option object
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

}*/

// Author object
let author = null;
let options = [];

// Load configuration
let config = null;

// Extract and store params from url
let params = parseUrl(window.location.href, {'userToken': 4, 'authorId': 6});

// Selection and matching
let selectedOptions = {};
let selectedFields = {};

function authorSelect(el, optionString){

    // Parse item
    let option = JSON.parse(optionString);
    let selected = null;

    // Toggle option selection
    if(optionString in selectedOptions){

        // Toggle selection flag
        selected = true;
        // Delete current selected option
        delete selectedOptions[optionString];

    } else {

        // Check selection limit
        if(Object.keys(selectedOptions).length >= config.limit) {
            alert('Sono stati selezionati troppi autori.');
            return;
        }

        // Toggle selection flag
        selected = false;
        // Store current selected option
        selectedOptions[optionString] = option;

    }

    // Render selected items
    renderSelectedOptions(el, selected, Object.keys(selectedOptions).length);

}

function authorMatch(){

    // Initial field selection
    if(config.selection){

        // Get selection fields from config
        let selectionFields = Object.keys(config.fields).filter(el => config.fields[el].select);
        let targets = null;

        if(config.selection === 'left')
            targets = [author];
        else
            targets = options;

        // Populate selection with selection fields
        targets.forEach(target => {
            selectionFields.forEach(field => {

                // Check if field is empty and initialize it
                if (!selectedFields[field])
                    selectedFields[field] = [];

                // Append current field to selected fields collection
                if (target[field] && !selectedFields[field].includes(target[field])) {
                    if(Array.isArray(target[field]))
                        selectedFields[field] = selectedFields[field].concat(target[field]);
                    else
                        selectedFields[field].push(target[field]);
                }

            })
        })

    }

    // Render author matching container
    renderAuthorMatchesContainer(author, params.userToken, Object.values(selectedOptions), () => {
        renderAuthorMatches(selectedFields);
    });

}

function groupSelectionLabels(){

    // Initialize grouping object
    let groupedFields = {};

    Object.keys(config.fields).forEach((key) => {

        // Store group for each field
        let field = key;
        let group = config.fields[key].group;

        // Group available fields
        if(group) {
            if (!groupedFields[group])
                groupedFields[group] = [field];
            else
                groupedFields[group].push(field);
        }

    });

    return groupedFields;

}

function groupSelectionFields(){

    // Initialize grouping objects
    let groupedLabels = groupSelectionLabels();
    let groupedFields = {};

    // Concat options
    let choices = [author].concat(options);

    // Initialize grouping
    Object.keys(groupedLabels).forEach((group) => {

        // Initialize grouping objects
        groupedFields[group] = [];
        // Iterate over grouped fields
        groupedLabels[group].forEach((field) => {

            // Set up field object
            let fieldObject = {'label': field, 'dictionary': config.fields[field].label, 'values': []};

            // Iterate over options
            choices.forEach((choice) => {
                fieldObject.values.push({'field': field, 'value': choice[field]});
            });

            // Append field object
            groupedFields[group].push(fieldObject);

        });

    });

    return groupedFields;

}

function matchField(label, value){

    // Store fields configuration
    let fieldsConfig = config.fields;

    // Toggle field selection
    if(selectedFields[label]) {
        if (selectedFields[label].map(item => item.toLowerCase()).includes(value.toLowerCase()))
            selectedFields[label] = selectedFields[label].filter(item => item.toLowerCase() !== value.toLowerCase());
        else
            selectedFields[label].unshift(value);
    } else {
        selectedFields[label] = [];
        selectedFields[label].unshift(value);
    }

    // Evaluate current array limit
    // TODO: potrebbe succedere che facciamo una classe per la config che restituisce gli oggetti che ti interessano
    Object.keys(selectedFields).forEach((field) => {
        if(fieldsConfig[field] && fieldsConfig[field].limit)
            selectedFields[field] = selectedFields[field].slice(0, fieldsConfig[field].limit);
    });

    // Handle button rendering
    fieldMatching(label, value);
    // Render author matches
    renderAuthorMatches(selectedFields);

}

function addNewField(label){

    // Store fields configuration
    let fieldsConfig = config.fields;

    // Add new input to selection list
    if(!selectedFields[label])
        selectedFields[label] = [];

    // Append empty selection
    selectedFields[label].unshift("");

    // Slice current collection
    // Evaluate array limit
    Object.keys(selectedFields).forEach((field) => {
        if(fieldsConfig[field] && fieldsConfig[field].limit)
            selectedFields[field] = selectedFields[field].slice(0, fieldsConfig[field].limit);
    });

    renderAuthorMatches(selectedFields);

}

// Get author, render author card, options and author labels
$(document).ready(() => {

    // Print current user in navbar field
    showUserToken(params.userToken);

    // Load configuration
    $.get(`/js/config/${params.userToken}.json`, (json) => {

        // Store config
        config = json;

        // Get current author and its options
        $.ajax({

            url: '/api/v1/' + params.userToken + '/author/' + (params.authorId ? params.authorId : ''),
            method: 'GET',
            dataType: 'json',

            success: response => {

                // Store author response
                author = response.author;
                options = response.options;

                // Render author card
                renderAuthorCard(author);
                // Render author options
                renderAuthorOptions({'options': options});

                // Check empty response
                if(options.length === 0) {
                    alert('Non sono presenti match per questo autore. Verrà saltato automaticamente');
                    authorSkip(author.uri);
                }

            }
        });
    });

});