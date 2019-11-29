function renderAuthorMatchesContainer(author, token, selectedOptions, callback) {
    $.get('/views/template/beweb/matches.html', (template) => {

        let grouping = groupSelectionFields();

        // Generate form container
        let output = Mustache.render(template, {
            'grouping': grouping,
            'header': author.name
        });

        $('.container').html(output).promise().done(() => {
            $('.ui.accordion').accordion();
        });

        callback();

    });
}

function renderAuthorMatches(selectionInput){
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