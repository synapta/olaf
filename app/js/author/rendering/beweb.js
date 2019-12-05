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

function toggleAddButton(key) {

    let parentKey = Object.keys(config.fields).filter(el => key.indexOf(el) === 0)[0];

    // Clear list
    let fieldBox = $('#' + key);

    // Render disabled button in case of reached limit
    if (config.fields[parentKey].limit && config.fields[parentKey].limit <= selectedFields[key].length)
        fieldBox.find('.add-new-field').addClass('disabled');
    else
        fieldBox.find('.add-new-field').removeClass('disabled');

}

function renderAuthorMatches(){
    $.get('/views/template/beweb/selection-input.html', (template) => {
        Object.keys(selectedFields).forEach((key) => {

            // Clear list
            let fieldBox = $('#' + key);
            fieldBox.find('.selection_list').html('');

            // Populate list
            selectedFields[key].forEach((item) => {
                fieldBox.find('.selection_list').append(Mustache.render(template, {'value': item, 'key': key}));
            });

            toggleAddButton(key);

        });

        // Update ticks rendering
        updateLabelTicks();

    });
}

function updateLabelTicks() {

    $('.field_selection')
        .find('i')
        .removeClass('fa-check')
        .addClass('fa-plus');

    // Iterate over each input to toggle check
    $('input').each((index, el) => {

        let label = $(el).closest('td').attr('id');
        let value = $(el).val();

        $('.field_selection[data-label="' + label + '"][data-value="' + value + '" i]')
            .find('i.fa-plus')
            .removeClass('fa-plus')
            .addClass('fa-check');

    })

}

function fieldMatching(label, value){

    // Store selection
    let selection = $('.field_selection[data-label="' + label + '"][data-value="' + value + '" i]');

    // Update ticks rendering
    updateLabelTicks();

}

function deleteInput(el, label, value){

    // Remove field
    removeField(label, value);

    // Delete parent of current item
    $(el).parent().remove();

    // Toggle add button
    toggleAddButton(label);
    // Update ticks rendering
    updateLabelTicks();

}