const dictionaries = require('./dictionaries');
const requests     = require('request-promise');

/**
 * A class to model author options
 * **/
class Option {

    constructor(rawBody, type) {

        // Store request body
        this.rawBody = rawBody;

        // Parse current body depending on type
        if (type === 'wikidata')
            this._parseWikidataBody();
        else if (type === 'viaf')
            this._parseViafBody();

    };

    async _parseWikidataBody() {

        // Get Wikidata Map from module
        let map = dictionaries.wikidataDictionary;

        // Parse rawBody in order to populate current object
        Object.keys(map).forEach((key) => {
            if(this.rawBody[map[key]]) {

                // Store value in current object
                this[key] = this.rawBody[map[key]].value;

                // Parse VIAF URI
                if(key === 'viaf')
                    // Replace https
                    this[key] = this[key].replace('https', 'http');

                // Parse dates
                else if(key === 'birthDate' || key === 'deathDate')
                    // Handle dates
                    this[key] = this[key].substr(0, 10);

            }
        });

    }

    _parseViafBody() {

        // Get Wikidata Map from module
        let map = dictionaries.viafDictionary;

        // Parse rawBody in order to populate current object
        Object.keys(map).forEach((key) => {
            if (map[key] && this.rawBody[map[key]]) {

                // Store value in current object
                this[key] = this.rawBody[map[key]];

                // Parse VIAF URI
                if(key === 'viaf')
                    // Get titles for option
                    this[key] = 'http://viaf.org/viaf/' + this.rawBody[map[key]];

                // Parse SBN URI
                if(key === 'optionSbn')
                    this[key] = "IT_ICCU_" + this[key].substring(0, 4).toUpperCase() + "_" + this[key].substring(4, 10);

            } else
                // Set current field as null on field absence
                this[key] = null;

        });

    }

    async enrichObjectWithViaf() {

        // Set up VIAF dictionary
        let viafDictionary = {
            a:          'F',
            b:          'M',
            personal:   'Persona',
        };

        // Query VIAF endpoint in order to get more author data
        await requests('https://www.viaf.org/viaf/' + this.getViafId() + '/?httpAccept=application/json').then((response) => {

            // Store response as JSON
            response = JSON.parse(response);

            // Store birth and death dates
            if(!this.birthDate)
                this.birthDate = response.birthDate;

            if(!this.deathDate)
                this.deathDate = response.deathDate;

            if(this.type === 'personal')
                this.type = viafDictionary[this.type];

            // Store option titles
            if (response.titles && response.titles.work) {

                // Collect titles
                this.titles = response.titles.work.map(el => el.title);

                // If titles is not an array, convert titles as array
                if(!Array.isArray(this.titles))
                    this.titles = [this.titles];

            }

            // Store option roles
            if(response.occupation && response.occupation.data) {

                // Collect titles
                this.roles = response.occupation.data.map(el => el.text);

                // If titles is not an array, convert titles as array
                if(!Array.isArray(this.roles))
                    this.titles = [this.roles];

            }

            // Store option gender
            if(!this.gender && response.fixed)
                this.gender = viafDictionary[response.fixed];

        }).catch((err) => {
            throw err;
        });

    }

    getViafId() {

        // Extract tokens from VIAF uri
        let uriTokens = this.viaf.split('/');

        return uriTokens[uriTokens.length - 1];

    }

    getString() {
        this.string = JSON.stringify(this);
    }

}

// Exports
exports.Option = Option;