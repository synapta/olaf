// Append a redirect path to each login form if needed
function renderRedirectInput(){

    // Get queries from url
    let queries = getQueriesFromUrl(window.location.href);

    if('redirect' in queries)
        $('#login-form, #signup-form').append(`<input type="hidden" name="redirect" value="${queries.redirect}" />`)

}