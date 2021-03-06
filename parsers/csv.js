const csv = require('csv-parser');
const fs = require('fs');

function parse(config) {
    if (config == undefined || config.path == undefined) {
        throw new Error('Config must have a valid path!');
    }

    // Skip invalid columns
    config.strict = true;

    return fs.createReadStream('uploads/' + config.path).pipe(csv(config));
}

module.exports = { parse };