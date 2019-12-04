/**
 * A class to parse user configurations
 * **/

class Config {

    constructor(config) {
        // Store configuration JSON
        this.config = config;
    }

    getInputDictionary() {

        let inputDictionary = {};
        let configFields = this.config.fields;

        // Map config fields to get dictionary
        Object.keys(configFields).map(el => inputDictionary[el] = configFields[el].input);

        return inputDictionary;

    }

    getWikidataDictionary() {

        let wikidataDictionary = {};
        let configFields = this.config.fields;

        // Map config fields to get dictionary
        Object.keys(configFields).map(el => wikidataDictionary[el] = configFields[el].wikidata);

        return wikidataDictionary;

    }

    getViafDictionary() {

        let viafDictionary = {};
        let configFields = this.config.fields;

        // Map config fields to get dictionary
        Object.keys(configFields).map(el => viafDictionary[el] = configFields[el].viaf);

        return viafDictionary;

    }

    isFieldComposite(field) {
        return this.config.fields[field].composite;
    }

}

// Exports
exports.Config = Config;