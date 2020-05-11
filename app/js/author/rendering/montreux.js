// Render navbar
function renderNavbar() {
    $.get('/views/template/montreux/navbar.html', (template) => {
        $('.navbar').html(template).promise().done(showUserToken(params.userToken));
    })
}

// Render author card
function renderAuthorCard(author){
    $.get('/views/template/montreux/author-card.html', (template) => {

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

// Render author options
function renderAuthorOptions(options){
    $.get('/views/template/montreux/author-options.html', (template) => {
        // Render output
        let output = Mustache.render(template, options);
        // Show output
        $('#author-options').html(output);
        $('.ui.accordion').accordion();
        $('#loader').fadeOut();
    });
}