// Render author card
function renderAuthorCard(author){
    $.get('/views/template/author/author-card.html', (template) => {

        // Generate output
        let output = Mustache.render(template, author);
        // Send output
        $('#author-card')
            .html(output)
            .css({width: $('#author-card').parent().width(), position: 'fixed'});

    });
}

// Render author options
function renderAuthorOptions(options){
    $.get('/views/template/author/author-options.html', (template) => {
        // Render output
        let output = Mustache.render(template, options);
        // Show output
        $('#author-options').html(output);
    });
}

// Render selected authors
function renderSelectedAuthors(element, selected, count){

    // Get class list
    let classList = element.classList;

    // Select or deselect element
    if(!selected) {
        classList.remove('green');
        classList.add('red');
        element.innerHTML = 'Deseleziona elemento';
    } else {
        classList.remove('red');
        classList.add('green');
        element.innerHTML = 'Seleziona elemento';
    }

    // Set count label
    let button = document.getElementById('selected-options-send');
    document.getElementById('selected-options-counter').innerHTML = count;
    // Set button behavior
    if(count > 0) {
        button.classList.add('primary');
        button.classList.remove('disabled');
    } else {
        button.classList.remove('primary');
        button.classList.add('disabled');
    }

}

// Render author matches
function renderAuthorMatchesContainer(author, token, selectedOptions){
    $.get('/views/template/author/matches.html', (template) => {

        // Generate container
        let output = Mustache.render(template, {'action': '/api/v1/' + token + '/author-matches/', 'authorUri': author.authorUri});
        $('#author-container').html(output);

        // Populate matches options
        $.get('/views/template/author/matches-options.html', (template) => {
            output = Mustache.render(template, {'options': selectedOptions});
            $('#matches-options').html(output);
        });

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
    let selection = $('.field_selection[data-label="' + label + '"][data-value="' + value + '"]');
    // Change icon
    if(selection.hasClass('green'))
        selection.removeClass('green').html('<i class="fas fa-plus"></i>');
    else
        selection.addClass('green').html('<i class="fas fa-check"></i>');

}