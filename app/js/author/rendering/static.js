// Render user token
function showUserToken(userToken){
    $('#user-token').html(userToken);
}

// Render author card
function renderAuthorCard(author){
    $.get('/views/template/author/author-card.html', (template) => {

        // Generate output
        let output = Mustache.render(template, author);
        // Change page title
        document.title = author.name + ' - OLAF';
        // Send output
        $('#author-card').html(output);

    });
}

// Render author options
function renderAuthorOptions(options){
    $.get('/views/template/author/author-options.html', (template) => {
        // Render output
        let output = Mustache.render(template, options);
        // Show output
        $('#author-options').html(output);
        $('.ui.accordion').accordion();
        $('#loader').fadeOut();
    });
}

// Render selected authors
function renderSelectedOptions(el, selected, length){

    // Get class list
    let classList = el.classList;

    // Select or deselect element
    if(!selected) {
        classList.remove('green');
        classList.add('red');
        el.innerHTML = 'Deseleziona elemento';
    } else {
        classList.remove('red');
        classList.add('green');
        el.innerHTML = 'Seleziona elemento';
    }

    // Set count label
    let button = document.getElementById('selected-options-send');
    document.getElementById('selected-options-counter').innerHTML = length;

    // Set button behavior
    if(length > 0) {
        button.classList.add('primary');
        button.classList.remove('disabled');
    } else {
        button.classList.remove('primary');
        button.classList.add('disabled');
    }

}

// Render author matches
function renderBewebAuthorMatchesContainer(author, token, selectedOptions, callback) {
    $.get('/views/template/beweb/matches.html', (template) => {

        let grouping = groupBewebAuthorFields(author, selectedOptions);

        // Generate form container
        let output = Mustache.render(template, {
            'grouping': grouping,
            'header': author.authorName.nameFull,
            'firstImage': authorImages[1],
            'secondImage': authorImages[0]
        });

        $('.container').html(output).promise().done(() => {
            $('.ui.accordion').accordion();
        });

        callback();

    });
}

function renderAuthorMatchesContainer(author, token, selectedOptions, callback){
    $.get('/views/template/author/matches.html', (template) => {

        // Generate container
        let output = Mustache.render(template, {'action': '/api/v1/' + token + '/author-matches/', 'authorUri': author.authorUri});
        $('#author-container').html(output);

        // Populate matches options
        $.get('/views/template/author/matches-options.html', (template) => {
            output = Mustache.render(template, {'options': selectedOptions});
            $('#matches-options').html(output);
        });

        // Callback
        callback();

    });
}

function renderBewebAuthorMatches(selectionInput){

    $.get('/views/template/beweb/selection-input.html', (template) => {
        Object.keys(selectionInput).forEach((key) => {

            // Clear list
            $('#' + key).find('.selection_list').html('');

            // Populate list
            selectionInput[key].forEach((item) => {
                $('#' + key).find('.selection_list').append(Mustache.render(template, {'value': item, 'key': key}));
            });

        })
    });

}

function renderAuthorMatches(selectionInput){

    // Empty object
    let emptyInput = true;
    Object.values(selectionInput).map(input => {
        if(input.length > 0)
           emptyInput = false;
    });

    // Set new button
    $('#send-button').html('<button onclick="authorSend()" id="send-author-matches" class="ui fluid primary button">Conferma assegnazione</button>');
    // Populate matches container
    if(emptyInput) {
        $.get('/views/template/author/matches-selection-empty.html', (template) => {
            // Set button behavior
            $('#send-author-matches').removeClass('primary').addClass('disabled');
            // Set empty template
            let output = Mustache.render(template);
            $('#matches-selection').html(output);
        });
    } else {
        $.get('/views/template/author/matches-selection.html', (template) => {

            // Set button behavior
            $('#send-author-matches').addClass('primary').removeClass('disabled');

            // Generate selection map
            let selectionMap = {'selectedFields': []};
            Object.keys(selectionInput).map(key => {
                selectionMap['selectedFields'].push({'label': key, 'values': selectionInput[key]});
            });

            // Set matches template
            let output = Mustache.render(template, selectionMap);
            $('#matches-selection').html(output);

        })
    }

}

function fieldMatching(label, value){

    // Store selection
    let selection = $('.field_selection[data-label="' + label + '"][data-value="' + value + '" i]');

    if(!selection.hasClass('label')) {

        // Change icon
        if (selection.hasClass('green'))
            selection.removeClass('green').html('<i class="fas fa-plus"></i>');
        else
            selection.addClass('green').html('<i class="fas fa-check"></i>');

    }

}

function deleteInput(el, label, value){

    // Remove field
    removeField(label, value);

}

// Lamdas for Mustache rendering

function _decodeHtmlEntities(text) {

    // Decode entities using a fake textarea
    let txt = document.createElement("textarea");
    txt.innerHTML = text;

    return txt.value;

}

function _renderLinkIcon(render, text) {

    // Store rendered text
    let renderedText = render(text);

    // Render link icon in case of link
    if(renderedText.includes('http') && !renderedText.includes('jpg', 'png'))
        return `<a class="wrapper_link" target="_blank" href="${render(text)}"><i class="fas fa-external-link-alt"></i></a>`;

    return ''
}

function _renderImage(render, text) {

    // Store rendered text
    let renderedText = _decodeHtmlEntities(render(text));

    // Render link icon in case of link
    if(renderedText.includes('http') && renderedText.includes('jpg', 'png')) {
        // Parse commons images
        renderedText = renderedText.replace('https://commons.wikimedia.org/wiki/File:', 'https://upload.wikimedia.org/wikipedia/commons/f/fa/');
        // Return styles to render image circle in second page
        return `width: 60px; height: 60px; border-radius: 100%; background-image: url(${renderedText}); background-size: cover; overflow: hidden; color: transparent; margin: 0 auto;`;
    }

    return ''

}