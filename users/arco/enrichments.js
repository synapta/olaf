const nodeRequest = require('request-promise');

// Enrich not enriched authors
function storeEnrichment(driver, enrichment) {
    return driver.collection('agents').findOneAndUpdate({_id: enrichment.author.uri, enriched: false}, {
        $set: {
            author: enrichment.author,
            options: enrichment.options,
            enriched: true
        },
    })
}

function feedEnrichments(driver, callback, limit = 5) {
    driver.collection('agents').find({enriched: false}, {fields: {_id: 1}, limit: limit}).toArray((err, res) => {

        // Generate requests for each enrichment uri
        let requests = res.map(el => nodeRequest('http://localhost:3646/api/v1/arco/author/' + encodeURIComponent(el._id) + '/?enrichment=true'));
        Promise.all(requests).then((results) => {

            // Parse JSON result
            results = results.map(result => JSON.parse(result));
            // Store enrichment
            let queries = results.map(result => storeEnrichment(driver, result));

            Promise.all(queries).then(callback);

        })

    })
}

function getAndlockAgent(driver, user, agent, lock, callback) {

    if(driver) {

        // Change behavior on uri existence
        let filter = {
            matchedBy: {$nin: [user]},
            skippedBy: {$nin: [user]},
            'options.0': {$exists: true},
            lock: null
        };
        if(agent) filter._id = agent;

        // Take the lock on the selected document
        driver.collection('agents').findOneAndUpdate(
            filter,
            {$set: {lock: lock ? new Date() : null}},
            {returnOriginal: true, sort: {enriched: -1}},
            (err, res) => {
                if (err) throw err;
                callback(res.value);
            }
        );

    } else
        callback(null);

}

function resetLocks(driver, callback) {
    driver.collection('agents').updateMany({}, {$set: {lock: null}}, (err, res) => {
        if(err) throw err;
        callback();
    });
}

function storeMatching(driver, user, option, agent) {

    // Store document
    let document = {agent: agent, user: user, option: option};

    // Upsert document and store matching
    return driver.collection('matches').updateOne(document, {$set: Object.assign(document, {timestamp: new Date()})}, {upsert: true}, (err, res) => {
        if(err) throw err;
        driver.collection('agents').updateOne({_id: agent}, {$addToSet: {matchedBy: user}});
    });

}

function skipAgent(driver, user, agent) {

    // Store document
    let document = {agent: agent, user: user};

    // Upsert document and store skip
    return driver.collection('skipped').updateOne(document, {$set: Object.assign(document, {timestamp: new Date()})}, {upsert: true}, (err, res) => {
        if(err) throw err;
        driver.collection('agents').updateOne({_id: agent}, {$addToSet: {skippedBy: user}});
    });

}

function getMatchingToValidate(driver, agent, callback) {
    // Get matches for the given agent
    driver.collection('agents').findOne({validated: false, matchedBy: {$not: {$size: 0}}}, (err, enrichment) => {
        if(err) throw err;
        if(!enrichment) callback(null);
        else {
            driver.collection('matches').find({agent: enrichment._id}).project({option: 1}).toArray((err, matches) => {
                if (err) throw err;
                callback({
                    author: enrichment.author,
                    options: enrichment.options,
                    matches: matches
                });
            })
        }
    })
}

function validateMatching(driver, agent, callback) {

    // Store document and do upsert
    let document = {agent: agent};

    // Set an agent as validate
    driver.collection('agents').findOneAndUpdate({_id: agent}, {$set: {validated: true}}, (err, res) => {
        if(err) throw err;
        driver.collection('validations').updateOne(document, {$set: Object.assign(document, {timestamp: new Date()})}, {upsert: true}, (err, res) => {
            if(err) throw err;
            callback();
        });
    })

}

// Exports
exports.storeEnrichment         = storeEnrichment;
exports.feedEnrichments         = feedEnrichments;
exports.getAndLockAgent         = getAndlockAgent;
exports.resetLocks              = resetLocks;
exports.storeMatching           = storeMatching;
exports.skipAgent               = skipAgent;
exports.getMatchingToValidate   = getMatchingToValidate;
exports.validateMatching        = validateMatching;