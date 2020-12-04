/**
 * @function createNode create DOM Node with attributes
 * @param  {string} node
 * @param  {object} attributes
 * @return {node}
 */
const createNode = (node, attributes) => {
  const el = document.createElement(node);
  for (let key in attributes) {
    if (key === 'innerHTML' || key === 'innerText') {
      el[key] = attributes[key];
    } else if (key === 'onclick') {
      if (typeof attributes[key] === 'function') {
        el.onclick = attributes[key];
      } else {
        console.warn('onclick must be a valid function - ', attributes[key]);
      }
    } else if (key === 'style') {
      const style = attributes[key];
      if (style.constructor === Object) {
        const styleString = Object.entries(style).map(entry => `${entry[0]}:${entry[1]};`).join('');
        el.setAttribute('style', styleString);
      } else {
        console.warn('style must be a valid object - ', attributes[key]);
      }
    } else {
      el.setAttribute(key, attributes[key]);
    }
  }
  return el;
};

/**
* @function startTransition starts a transition with Semantic UI, and returns a Promise. Useful for transition queuing
* @param  {string} selector CSS selector
* @param  {object} options @see https://semantic-ui.com/modules/transition.html#/settings
* @return {Promise}
*/
const startTransition = (selector, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const $element = $(selector);
      if (!$element[0]) {
        reject({ error: 'Element not found' });
      }
      $element.transition(options.type || 'scale', {
        duration: options.duration || '500ms',
        displayType: options.displayType || false,
        onShow: () => resolve('show'),
        onHide: () => resolve('hide')
      });
    } catch (error) {
      reject(error);
    }
  });
};