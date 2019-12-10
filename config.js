/**
 * A class to parse user configurations
 * **/

class Config {

    constructor(config) {

        // Store configuration JSON
        this.config = config;

        // Parse composite fields
        this._parseCompositeFields()

    }

    _parseCompositeFields() {

        let configFields = this.config.fields;

        Object.keys(configFields).forEach((key) => {
            if(configFields[key].composite) {
                configFields[key].composite.map(el => {

                    // Capitalize current subfield
                    el = el.charAt(0).toUpperCase() + el.slice(1);
                    let newKey = key + el;

                    // Copy parent field
                    this.config.fields[newKey] = JSON.parse(JSON.stringify(configFields[key]));

                    // Translate subfields as principal fields
                    if (this.config.fields[newKey].input)
                        this.config.fields[newKey].input = configFields[key].input + el;

                    if (this.config.fields[newKey].wikidata)
                        this.config.fields[newKey].wikidata = configFields[key].wikidata + el;

                    if (this.config.fields[newKey].viaf)
                        this.config.fields[newKey].viaf = configFields[key].viaf + el;

                    if (this.config.fields[newKey].label)
                        this.config.fields[newKey].label = configFields[key].label + ' ' + el.toUpperCase();

                    delete this.config.fields[newKey].composite;

                });

                // Remove composite field after folding
                //delete this.config.fields[key];

            }
        })

    }

    getConfig() {
        return this.config;
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