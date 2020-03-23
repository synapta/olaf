const nodeRequest = require('request-promise');

// Enrich not enriched authors
function storeEnrichment(driver, enrichment) {
    return driver.collection('things').findOneAndUpdate({_id: enrichment.author.uri, enriched: false}, {
        $set: {
            author: enrichment.author,
            options: enrichment.options,
            enriched: true
        },
    })
}

function feedEnrichments(driver, callback, limit = 5) {
    driver.collection('things').find({enriched: false}, {fields: {_id: 1}, limit: limit}).toArray((err, res) => {

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

function getAndlockAgent(driver, user, thing, lock, callback) {

    if(driver) {

        // Change behavior on uri existence
        let filter = {
            matchedBy: {$nin: [user]},
            skippedBy: {$nin: [user]},
            lock: null
        };
        if(thing) filter.thing = thing;

        // Take the lock on the selected document
        driver.collection('things').findOneAndUpdate(
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
    driver.collection('things').updateMany({}, {$set: {lock: null}}, (err, res) => {
        if(err) throw err;
        callback();
    });
}

function storeMatching(driver, user, option, thing) {

    // Store document
    let document = {thing: thing, user: user, option: option};

    // Upsert document and store matching
    return driver.collection('matches').updateOne(document, {$set: Object.assign(document, {timestamp: new Date()})}, {upsert: true}, (err, res) => {
        if(err) throw err;
        driver.collection('things').updateOne({_id: thing}, {$addToSet: {matchedBy: user}});
    });

}

function skipAgent(driver, user, thing) {

    // Store document
    let document = {thing: thing, user: user};

    // Upsert document and store skip
    return driver.collection('skipped').updateOne(document, {$set: Object.assign(document, {timestamp: new Date()})}, {upsert: true}, (err, res) => {
        if(err) throw err;
        driver.collection('things').updateOne({_id: thing}, {$addToSet: {skippedBy: user}});
    });

}

function getMatchingToValidate(driver, thing, callback) {
    // Get matches for the given thing
    driver.collection('things').findOne({validated: false, matchedBy: {$not: {$size: 0}}}, (err, enrichment) => {
        if(err) throw err;
        if(!enrichment) callback(null);
        else {
            driver.collection('matches').find({thing: enrichment._id}).project({option: 1}).toArray((err, matches) => {
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

function validateMatching(driver, thing, callback) {

    // Store document and do upsert
    let document = {thing: thing};

    // Set an thing as validate
    driver.collection('things').findOneAndUpdate({_id: thing}, {$set: {validated: true}}, (err, res) => {
        if(err) throw err;
        driver.collection('validations').updateOne(document, {$set: Object.assign(document, {timestamp: new Date()})}, {upsert: true}, (err, res) => {
            if(err) throw err;
            callback();
        });
    })

}

function insertThings(driver, uris, callback) {

    let documents = uris.map(uri => {
        return {
            _id: uri,
            thing: null,
            options: null,
            enriched: false,
            lock: null,
            matchedBy: [],
            skippedBy: [],
            validated: false
        }
    });

    driver.collection('things').insertMany(documents, (err, res) => {
        if(err) throw err;
        callback();
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
exports.insertThings            = insertThings;