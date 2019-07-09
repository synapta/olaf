// Global variables
let options = {};
let selected_items = {};
let selected_fields = {};
let author_uri = null;

// Labels filter
let valid_labels = ["wikidata", "viafurl", "sbn"];

// Response parsing
function parse_cobis_response(response, uri, offset) {

    response.identifiers = {uri: uri, offset: offset, next: +offset + 1, prev: +offset - 1};

    // Parse titles and roles
    if(response.title) {
        let titles = response.title.split('###');
        response.titles = {titlesLength: titles.length, titlesItem: titles};
        delete response.title;
    }

    if(response.personRole) {
        let roles = response.personRole.split('###');
        response.roles = {rolesLength: roles.length, rolesItem: roles};
        delete response.personRole;
    }

    return response;

}

// Selection handling
function update_selection(item) {

    // Evaluate option selection
    if(selected_items[item])
        // Remove selection
        delete selected_items[item];
    else
        // Add selection
        selected_items[item] = true;

    return selected_items[item];

}

function get_from_options(item, callback) {

    // Get item from option
    options.forEach((option) => {
        if(option.item.toString() === item.toString())
            callback(option);
    })

}

function group_labels(options, callback) {

    let grouped_options = {};
    let count = 0;

    options.forEach((option) => {

        Object.keys(option).forEach((key) => {
            // Group by valid keys
            if(valid_labels.includes(key)) {
                if (key in grouped_options)
                    grouped_options[key].push({'identifier': option[key], 'item': option});
                else
                    grouped_options[key] = [{'identifier': option[key], 'item': option}];
            }
        });

        // Termination
        if(++count === options.length)
            callback(grouped_options);

    })
}

// Authors
function select_author(element) {

    // Get option item
    let item = element.closest('.segment').getAttribute('data-item');
    // Get selection result
    let selected = update_selection(item);

    // Evaluate option selection
    if(!selected) {
        // Change color and text
        element.classList.remove('negative');
        element.classList.add('positive');
        element.innerHTML = 'Seleziona candidato';
    } else {
        // Change color
        element.classList.remove('positive');
        element.classList.add('negative');
        element.innerHTML = 'Deseleziona candidato';
    }

    // Update selection counter
    document.getElementById('selected-options-counter').innerHTML = Object.keys(selected_items).length;

}

function match_multiple_authors() {

    // Get selected authors length
    let selected_items_keys = Object.keys(selected_items);
    // Get selected authors
    let selected_options = [];

    if(selected_items_keys.length > 0){
        // Evaluate all selected authors
        selected_items_keys.forEach((item) => {
            get_from_options(item, (option) => {
                // Collect selected options
                selected_options.push(option);
                // End iteration
                if(selected_options.length === selected_items_keys.length) {
                    group_labels(selected_options, (grouped_labels) => {
                        show_matches(grouped_labels);
                    });
                }
            });
        });
    } else
        alert('Devi selezionare almeno un autore col quale fare match');

}

function match_field(element) {

    let label = element.getAttribute('data-label');
    let value = element.getAttribute('data-value');

    // Select field
    if(selected_fields[label] === value)
        delete selected_fields[label];
    else
        selected_fields[label] = value;

    console.log(selected_fields);

    // Update fields rendering
    update_fields()

}

// Rendering
$.get('/views/template/author-card.html', (template) => {

    // Extract params from url
    let params = parse_url(window.location.href, [4, 6]);
    let token = params[0];
    let offset = params[1];

    // Make request and send response
    $.ajax({
        url: '/api/v1/' + token + '/author-info/' + offset,
        method: 'GET',
        dataType: 'json',
        success: response => {

            // Store person identifier
            author_uri = response.personURI;
            // Parse response
            let author = parse_cobis_response(response, response.personURI, offset);
            //Generate and set output
            let output = Mustache.render(template, author);
            $('#author-card').html(output);
            $('#author-card').css({width: $('#author-card').parent().width(), position: 'fixed'});

        }
    });

});

$.get('/views/template/author-options.html', (template) => {

    // Extract params from url
    let params = parse_url(window.location.href, [4, 6]);
    let token = params[0];
    let offset = params[1];

    // Get Wikidata candidates
    $.ajax({

        url: '/api/v1/' + token + '/author-info/' + offset,
        method: 'GET',
        dataType: 'json',
        success: response => {

            // Handle response
            let tokens = response.personName.split(', ');
            let surname = tokens[0].split('<')[0] || "";
            let name = tokens[1] || "";

            // Query for wikidata options
            $.ajax({
                url: '/api/v1/' + token + '/author-options/' + offset  + '?name=' + encodeURI(name) + '&surname=' + encodeURI(surname),
                method: 'GET',
                dataType: 'json',
                success: response => {

                    // Render output
                    let output = Mustache.render(template, response);
                    options = response.options;
                    $('#author-options').html(output).fadeIn(2000);

                    // Push state
                    history.pushState({}, "", window.location.href);

                }
            });

        }
    });

});

function show_matches(matches) {

    // Extract params from url
    let params = parse_url(window.location.href, [4, 6]);
    let token = params[0];
    let offset = params[1];

    // Variables
    let output = '';
    let count = 0;

    $.get('/views/template/matches.html', (template) => {

        // Generate container
        let container = Mustache.render(template, {'action': '/api/v1/' + token + '/author-matches/' + offset, 'identifier': author_uri, 'next': 'http://localhost:3645/get/cobis/authors/' + (+offset + 1)});
        let selected_options = [];

        $('#author-container').html(container);

        // Populate matches options
        $.get('/views/template/matches-options.html', (template) => {
            Object.keys(selected_items).forEach((item) => {
                get_from_options(item, (option) => {
                    // Collect selected options
                    selected_options.push(option);
                    // End iteration
                    if(selected_options.length === Object.keys(selected_items).length) {
                        output = Mustache.render(template, {'items': selected_options});
                        $('#matches-options').html(output);
                    }
                });
            });
        });

        // Populate matches container
        $.get('/views/template/matches-selection-empty.html', (template) => {
            // Set button behavior
            $('#send_button').html('<button onclick="send_matches()" class="ui fluid primary button">Conferma assegnazione</button>');
            // Set empty template
            output = Mustache.render(template);
            $('#matches-selection').html(output);
        });
    });
}

function update_fields(){

    let output = "";
    let count = 0;

    // Remove ticks
    $('.field_selection').removeClass('green').html('<i class="fas fa-plus"></i>');

    // Set selected values
    if(Object.keys(selected_fields).length > 0) {
        Object.keys(selected_fields).forEach((label) => {
            $('.field_selection[data-label="' + label + '"][data-value="' + selected_fields[label] + '"]').addClass('green').html('<i class="fas fa-check"></i>');
            $.get('/views/template/matches-selection.html', (template) => {
                // Compose output
                output += Mustache.render(template, {'label': label, 'value': selected_fields[label]});
                // Push output
                if(Object.keys(selected_fields).length === ++count)
                    $('#matches-selection').html(output);
            })
        });
    } else {
        $.get('/views/template/matches-selection-empty.html', (template) => {
            // Set empty template
            output = Mustache.render(template);
            $('#matches-selection').html(output);
        });
    }

}

function send_matches(){

    // Send form
    document.getElementById('matches-form').submit();

}
