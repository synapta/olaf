function renderRedirectInput(){

    // Get queries from url
    let queries = getQueriesFromUrl(window.location.href);

    if('redirect' in queries)
        $('#login-form, #signup-form').append(`<input type="hidden" value="${queries.redirect}" />`)

}