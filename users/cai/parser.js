const cobisParser = require('../cobis/parser');

Object.keys(cobisParser).forEach(method => {
    exports[method] = cobisParser[method];
});
