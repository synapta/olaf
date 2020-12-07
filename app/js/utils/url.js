// Exports
const getUrlParam = idx => window.location.pathname.split('/')[idx + 1];

const getUrlQueryStrings = () => {
  const queries = {};
  const url = window.location.href;
  if (url.includes('?')) {
    const tokens = url.split('?')[1];
    // Store all queries in a given object
    tokens.split('&').map((el) => queries[el.split('=')[0]] = el.split('=')[1]);
  }
  return queries;
};

function parseUrl(url, paramsMap) {
  // Get url tokens
  let tokens = url.split('/');
  let params = {};

  // Get tokens from indexes
  Object.keys(paramsMap).forEach((key) => {
    params[key] = tokens[paramsMap[key]];
  });

  return params
}

function getQueriesFromUrl(url) {
  let queries = {};

  // Store queries
  if (url.includes('?')) {

    let tokens = url.split('?')[1];
    // Store all queries in a given object
    tokens.split('&').map((el) => queries[el.split('=')[0]] = el.split('=')[1]);

  }

  return queries;
}