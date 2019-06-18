// Exports
function parse_url(url, indexes){

    // Get url tokens
    let tokens = url.split('/');
    let params = [];

    // Get tokens from indexes
    indexes.forEach((index) => {
        params.push(tokens[index]);
    });

    return params

}