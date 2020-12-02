/**
 * @function postJSON POST request using Fetch API for JSON data
 * @param  {String}  [url=''] API URL where to post
 * @param  {Object}  [data={}] JSON data for POST body
 * @return {Promise} pending promise
 */
const postJSON = async (url = '', data = {}) => {
  try {
    const response = await fetch(url, {
      method      : 'POST', // *GET, POST, PUT, DELETE, etc.
      mode        : 'cors', // no-cors, *cors, same-origin
      cache       : 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials : 'same-origin', // include, *same-origin, omit
      headers     : {
        'Content-Type': 'application/json'
      },
      redirect       : 'follow', // manual, *follow, error
      referrerPolicy : 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body           : JSON.stringify(data)
    });
    // check if okay
    if (!response.ok) { return Promise.reject(response); }
    // parses JSON response into native JavaScript objects
    return response.json();
  } catch (error) {
    return Promise.reject(error);
  }
};

/**
 * @function postCSV POST request using Fetch API for CSV data
 * @param  {String}  [url=''] API URL where to post
 * @param  {Object}  [data={}] CSV data for POST body
 * @return {Promise} pending promise
 */
const postCSV = async (url = '', data) => {
  if (!data) {
    reject('postCSV needs a valid CSV file as second argument');
  }

  try {
    const response = await fetch(url, {
      method      : 'POST', // *GET, POST, PUT, DELETE, etc.
      mode        : 'cors', // no-cors, *cors, same-origin
      cache       : 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials : 'same-origin', // include, *same-origin, omit
      headers     : {
        'Content-Type': 'text/csv'
      },
      redirect       : 'follow', // manual, *follow, error
      referrerPolicy : 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body           : data
    });
    // check if okay
    if (!response.ok) { return Promise.reject(response); }
    // parses JSON response into native JavaScript objects
    return response.json();
  } catch (error) {
    return Promise.reject(error);
  }
};

/**
 * @function getJSON GET request using Fetch API for JSON data
 * @param  {String}  [url=''] API URL where to get
 * @return {Promise} pending promise
 */
const getJSON = async (url = '') => {
  try {
    const response = await fetch(url);
    // check if okay
    if (!response.ok) { return Promise.reject(response); }
    // parses JSON response into native JavaScript objects
    return response.json();
  } catch (error) {
    return Promise.reject(error);
  }
};

/**
 * @function getText GET request using Fetch API for text data
 * @param  {String}  [url=''] API URL where to post
 * @return {Promise} pending promise
 */
const getText = async (url = '') => {
  try {
    const response = await fetch(url);
    // check if okay
    if (!response.ok) { return Promise.reject(response); }
    // parses response into string
    return response.text();
  } catch (error) {
    return Promise.reject(error);
  }
};

const createJob = job => {
  return new Promise((resolve, reject) => {
    postJSON('/api/v2/job', job)
      .then(res => resolve(res))
      .catch(err => reject(err));
  });
};

const uploadFile = file => {
  return new Promise((resolve, reject) => {
    postCSV('/api/v2/upload', file)
    .then(res => resolve(res))
    .catch(err => reject(err));
  });
};

const createSource = source => {
  return new Promise((resolve, reject) => {
    postJSON('/api/v2/source', source)
      .then(res => resolve(res))
      .catch(err => reject(err));
  });
};