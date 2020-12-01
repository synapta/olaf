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