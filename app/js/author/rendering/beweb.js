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

            let parentKey = Object.keys(config.fields).filter(el => key.indexOf(el) === 0)[0];

            // Clear list
            let fieldBox = $('#' + key);
            fieldBox.find('.selection_list').html('');

            // Populate list
            selectionInput[key].forEach((item) => {
                fieldBox.find('.selection_list').append(Mustache.render(template, {'value': item, 'key': key}));
            });

            // Render disabled button in case of reached limit
            if (config.fields[parentKey].limit && config.fields[parentKey].limit <= selectionInput[key].length)
                fieldBox.find('.add-new-field').addClass('disabled');
            else
                fieldBox.find('.add-new-field').removeClass('disabled');

        })
    });
}