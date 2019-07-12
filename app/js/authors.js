// Global collection
let options = {};
let selectedItems = {};
let selectedFields = {};

// Global variables
let author = null;

// Labels filter
let validLabels = ["optionWikidata", "optionViaf", "optionSbn"];

// Selection handling
function update_selection(item) {

    // Evaluate option selection
    if(selectedItems[item])
        // Remove selection
        delete selectedItems[item];
    else
        // Add selection
        selectedItems[item] = true;

    return selectedItems[item];

}

function get_from_options(item, callback) {

    // Get item from option
    options.forEach((option) => {
        if(option.optionItem.toString() === item.toString())
            callback(option);
    })

}

function group_labels(options, callback) {

    let grouped_options = {};
    let count = 0;

    options.forEach((option) => {

        Object.keys(option).forEach((key) => {
            // Group by valid keys
            if(validLabels.includes(key)) {
                if (key in grouped_options)
                    grouped_options[key].push({'identifier': option[key], 'item': option});
                else
                    grouped_options[key] = [{'identifier': option[key], 'item': option}];
            }
        });

        // End iteration
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
    document.getElementById('selected-options-counter').innerHTML = Object.keys(selectedItems).length;

}

function match_multiple_authors() {

    // Get selected authors length
    let selected_items_keys = Object.keys(selectedItems);
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
    if(selectedFields[label] === value)
        delete selectedFields[label];
    else
        selectedFields[label] = value;

    // Update fields rendering
    update_fields()

}

// Rendering
$.get('/views/template/author-card.html', (template) => {

    // Extract params from url
    let params = parseUrl(window.location.href, [4, 6]);
    let token = params[0];

    // Print message
    let action = sessionStorage.getItem("action");
    $.get('/views/template/author-message.html', (template) => {

        // Parse message
        let message = {};
        if(action === 'match')
            message = {'style': 'success', 'title': 'Autore associato correttamente', 'text': 'Attendi mentre verranno caricate le successive opzioni.'};
        else if(action === 'skip')
            message = {'style': '', 'title': 'Autore saltato', 'text': 'Attendi mentre verranno caricate le successive opzioni.'};
        else
            message = {'style': '', 'title': 'Benvenuto su OLAF', 'text': 'Attendi mentre verranno caricate le successive opzioni.'};

        // Show message
        let output = Mustache.render(template, message);
        $('#author-options').html(output);

    });

    // Make request and send response
    $.ajax({

        url: '/api/v1/' + token + '/author/',
        method: 'GET',
        dataType: 'json',
        success: response => {

            // Store person identifier
            author = response;
            //Generate and set output
            let output = Mustache.render(template, author);
            $('#author-card').html(output);
            $('#author-card').css({width: $('#author-card').parent().width(), position: 'fixed'});

            // Print options
            $.get('/views/template/author-options.html', (template) => {

                // Handle response
                let tokens = author.authorName.split(', ');

                // Get name and surname
                let surname = tokens[0].split('<')[0].trim() || "";
                let name = "";
                if(tokens[1])
                    name = tokens[1].split('<')[0].trim() || "";

                // Query for wikidata options
                $.ajax({

                    url: '/api/v1/' + token + '/author-options/?name=' + encodeURI(name) + '&surname=' + encodeURI(surname),
                    method: 'GET',
                    dataType: 'json',
                    success: response => {

                        // Render output
                        let output = Mustache.render(template, response);
                        // Store options
                        options = response.options;
                        // Show output
                        $('#author-options').html(output);

                    }

                });

            });

        }
    });

});

function show_matches() {

    // Extract params from url
    let params = parseUrl(window.location.href, [4, 6]);
    let token = params[0];

    // Variables
    let output = '';

    $.get('/views/template/matches.html', (template) => {

        // Generate container
        let container = Mustache.render(template, {'action': '/api/v1/' + token + '/author-matches/', 'authorUri': author.authorUri});
        let selected_options = [];

        $('#author-container').html(container);

        // Populate matches options
        $.get('/views/template/matches-options.html', (template) => {
            Object.keys(selectedItems).forEach((item) => {
                get_from_options(item, (option) => {
                    // Collect selected options
                    selected_options.push(option);
                    // End iteration
                    if(selected_options.length === Object.keys(selectedItems).length) {
                        output = Mustache.render(template, {'items': selected_options});
                        $('#matches-options').html(output);
                    }
                });
            });
        });

        // Populate matches container
        $.get('/views/template/matches-selection-empty.html', (template) => {
            // Set button behavior
            $('#send-button').html('<button onclick="send_matches()" class="ui fluid primary button">Conferma assegnazione</button>');
            // Set empty template
            output = Mustache.render(template);
            $('#matches-selection').html(output);
        });

    });
}

function update_fields(){

    let output = "";
    let render_fiels = [];

    // Remove ticks
    $('.field_selection').removeClass('green').html('<i class="fas fa-plus"></i>');

    // Set selected values
    if(Object.keys(selectedFields).length > 0) {
        Object.keys(selectedFields).forEach((label) => {
            $('.field_selection[data-label="' + label + '"][data-value="' + selectedFields[label] + '"]').addClass('green').html('<i class="fas fa-check"></i>');
            render_fiels.push({'label': label, 'value': selectedFields[label]});
        });
        $.get('/views/template/matches-selection.html', (template) => {
            // Compose output
            output = Mustache.render(template, {'fields': render_fiels});
            // Push output
            $('#matches-selection').html(output);
        })
    } else {
        $.get('/views/template/matches-selection-empty.html', (template) => {
            // Set empty template
            output = Mustache.render(template);
            $('#matches-selection').html(output);
        });
    }

}

function skip_author(element){

    // Get author uri
    let uri = $(element).attr('data-identifier');
    // Extract params from url
    let params = parse_url(window.location.href, [4, 6]);
    let token = params[0];

    // API call
    $.ajax({

        url: '/api/v1/' + token + '/author-skip/',
        method: 'POST',
        data: {'uri': uri},
        dataType: 'json',
        success: response => {
            if(response.status === 'success') {
                // Store last action in session
                sessionStorage.setItem("action", "skip");
                // Reload page
                location.reload();
            } else
                alert("Errore");
        }

    });

}

function send_matches(){
    // Store last action in session
    sessionStorage.setItem("action", "match");
    // Send form
    document.getElementById('matches-form').submit();
}
