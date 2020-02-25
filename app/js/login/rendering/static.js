// Append a redirect path to each login form if needed
function renderRedirectInput(){

    // Get queries from url
    let queries = getQueriesFromUrl(window.location.href);

    if('redirect' in queries)
        $('#login-form, #signup-form').append(`<input type="hidden" name="redirect" value="${queries.redirect}" />`)

}

// Display error message during login
function renderErrorMessage(){

    // Get queries from url
    let queries = getQueriesFromUrl(window.location.href);

    if('message' in queries) {
        $('#login-error').find('.header').html(queries.message);
        $('#login-error').show();
    }

}