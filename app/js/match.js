const init = async () => {

  // get url param
  const alias = getUrlParam(1);

  if (!alias) {
    window.location.href = '/404';
  }

  // get query strings
  const queryStrings = getUrlQueryStrings();

  // get DOM elements
  const navbarContainer = document.getElementById('match-navbar');
  const containers = document.querySelectorAll('.data-container');
  const placeholders = document.querySelectorAll('.data-placeholder');

  // get job info
  const jobInfo = await getJSON(`/api/v2/job/${alias}`);

  // compose options
  const matcherOptions = {
    alias,
    navbarContainer,
    placeholders,
    containers,
    fields         : jobInfo.job_config.fields,
    job_type       : jobInfo.job_type,
    uriQueryString : queryStrings.uri,
  };

  // instantiate matcher
  const matcher = new Matcher(matcherOptions);

  // init and render first item
  matcher.init();
};


// go!
init();