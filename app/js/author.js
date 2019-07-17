// Author object
let author = null;
// Extract and store params from url
let params = parseUrl(window.location.href, {'userToken': 4, 'authorId': 6});

// Selection and matching
let selectedOptions = {};
let selectionInput = {};
let authorFields = null;

function authorSelect(element, item){

    // Parse item
    let stringedItem = item;
    let parsedItem = JSON.parse(item);
    let selected = null;

    // Store or remove author from selected list
    if(Object.keys(selectedOptions).includes(stringedItem)) {
        delete selectedOptions[stringedItem];
        selected = true;
    } else {
        selectedOptions[stringedItem] = parsedItem;
        selected = false;
    }

    // Render selected items
    renderSelectedAuthors(element, selected, Object.keys(selectedOptions).length);

}

function authorMatch(){

    // Group options fields by author fields
    Object.values(selectedOptions).forEach((option) => {
        authorFields.forEach((field) => {
            if(!selectionInput[field])
                selectionInput[field] = [];
            if(option[field] && !selectionInput[field].includes(option[field])) {
                selectionInput[field].push(option[field]);
            }
        })
    });

    // Render author matches
    renderAuthorMatchesContainer(author, params.userToken, Object.values(selectedOptions), () => {
        renderAuthorMatches(selectionInput);
    });

}

function matchField(label, value){

    // Handle object
    if(selectionInput[label]) {
        if(selectionInput[label].includes(value)) {
            selectionInput[label] = selectionInput[label].filter((item) => {
                return item !== value;
            })
        } else
            selectionInput[label].push(value);
    }
    // Handle button rendering
    fieldMatching(label, value);
    // Render author matches
    renderAuthorMatches(selectionInput);

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
            author = response;
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