function renderNavbar(selection=true, callback) {
    $.get('/views/template/beweb/navbar.html', (template) => {
        $('.navbar').html(Mustache.render(template, {'selection': selection}))
                    .promise()
                    .done(() => {
                        showUserToken(params.userToken);
                        if (typeof callback === 'function') {
                            callback();
                        }
                    });
    })
}

function renderAuthorCard(author){
    $.get('/views/template/beweb/author-card.html', (template) => {

        // Generate output
        let output = Mustache.render(template, author);
        // Change page title
        document.title = author.name + ' - OLAF';
        // Send output
        $('#author-card').html(output).promise().done(() => {
            $('.ui.accordion').accordion({exclusive:false});
        });

    });
}

function renderAuthorMatchesContainer(author, token, selectedOptions, callback) {
    $.get('/views/template/beweb/matches.html', (template) => {

        let grouping = groupSelectionFields();

        // Generate form container
        let output = Mustache.render(template, {
            'grouping': grouping,
            'header': author.name
        });

        $('.container').html(output).promise().done(() => {
            let n = Object.values(selectedOptions).length + 3;
            $(`tr > td:nth-child(${n}), th:nth-child(${n})`).remove();
            $('.ui.accordion').accordion({exclusive:false});
        });

        // Append navbar header
        $.get('/views/template/beweb/author-card-preview.html', (template) => {

            // Store candidates
            let candidates = {
                first: selectedOptions[0],
                second: selectedOptions[1]
            };

            // Parse and render template
            let output = Mustache.render(template, candidates);

            // Render second page navbar
            renderNavbar(false, () => {
                // Render navbar header
                $("#selection-header").html(output);
                // Return to callee
                callback();
            });

        });

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

            // Activate or deactivate the add button
            toggleAddButton(key);

        });

        // Update ticks rendering
        updateLabelTicks();

    });
}

function sendFeedback(label, value) {

    // Send green flash
    $('.field_selection[data-label="' + label + '"][data-value="' + value + '" i]')
        .closest('tr')
        .toggleClass('positive').delay(500).promise().done(() => {
        $('.field_selection[data-label="' + label + '"][data-value="' + value + '" i]')
            .closest('tr')
            .toggleClass('positive')
    })

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

function showResultMessage(data, success=true) {
    $.get('/views/template/beweb/result-message.html', (template) => {

        if(!success || data.code !== 0)
            success = false;

        // Parse output
        let output = Mustache.render(template, {'success': success, 'data': data});

        // Remove header and show result message
        $('.navbar-fixed-column').find('.button').addClass('disabled');
        $('#selection-header').remove();
        $('.container').html(output);

    });
}