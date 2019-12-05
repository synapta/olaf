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
        let fieldsConfig = config.fields;
        let selectionFields = Object.keys(config.fields).filter(el => config.fields[el].select);
        let targets = null;

        if(config.selection === 'left')
            targets = [author];
        else
            targets = options;

        // Populate selection with selection fields
        targets.forEach(target => {
            selectionFields.forEach(field => {
                Object.keys(author).filter(el => el.indexOf(field) === 0).forEach((subField) => {

                    // Check if field is empty and initialize it
                    if (!selectedFields[subField])
                        selectedFields[subField] = [];

                    // Append current field to selected fields collection
                    if (target[subField] && !selectedFields[subField].includes(target[subField])) {
                        if(Array.isArray(target[subField]))
                            selectedFields[subField] = selectedFields[subField].concat(target[subField]);
                        else
                            selectedFields[subField].push(target[subField]);
                    }

                    // Slice limited fields
                    if(fieldsConfig[field].limit)
                        selectedFields[subField] = selectedFields[subField].slice(0, fieldsConfig[field].limit);

                });
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
            Object.keys(author).filter(el => el.indexOf(field) === 0).forEach((subfield) => {

                // Check if field is composite
                let isFieldComposite = config.fields[field].composite;
                let dictionaryLabel = config.fields[field].label;

                // Generate new dictionary label for composite fields
                if(isFieldComposite)
                    dictionaryLabel = config.fields[field].label + ' ' + subfield.replace(field, '').toUpperCase();

                // Generate field object
                let fieldObject = {'label': subfield, 'dictionary': dictionaryLabel, 'values': []};

                // Iterate over options
                choices.forEach((choice) => {
                    fieldObject.values.push({'field': subfield, 'value': choice[subfield]});
                });

                // Append field object
                groupedFields[group].push(fieldObject);

            });
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
    Object.keys(selectedFields).forEach((field) => {

        // Get parent field limit
        let parentField = Object.keys(config.fields).filter(el => field.indexOf(el) === 0)[0];

        // Parse field limit
        if (fieldsConfig[field] && fieldsConfig[parentField].limit)
            selectedFields[field] = selectedFields[field].slice(0, fieldsConfig[parentField].limit);

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

function removeField(label, value) {

    // Remove the value from label collection
    if(selectedFields[label]) {
        if (selectedFields[label].map(item => item.toLowerCase()).includes(value.toLowerCase()))
            selectedFields[label] = selectedFields[label].filter(item => item.toLowerCase() !== value.toLowerCase());
    }

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