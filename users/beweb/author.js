const dictionaries = require('./dictionaries');

/**
 * A class to model author card
 * **/
class Author {

    constructor(rawBody) {

        // Store request body
        this.rawBody = rawBody;

        // Parse author fields
        this._parseBody();

    };

    _parseBody() {

        // Author map
        let map = dictionaries.bewebDictionary;

        // Map fields
        Object.keys(map).map(key => {
            if (this.rawBody[map[key]])
                this[key] = this.rawBody[map[key]];
            else
                this[key] = null;
        });

    };

    getString() {
        this.string = JSON.stringify(this);
    }

}

// Exports
exports.Author = Author;