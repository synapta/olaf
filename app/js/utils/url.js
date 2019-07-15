// Exports
function parseUrl(url, paramsMap){

    // Get url tokens
    let tokens = url.split('/');
    let params = {};

    // Get tokens from indexes
    Object.keys(paramsMap).forEach((key) => {
        params[key] = tokens[paramsMap[key]];
    });

    return params

}