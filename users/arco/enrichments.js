const nodeRequest = require('request-promise');

// Enrich not enriched authors
function storeEnrichment(driver, enrichment) {
    return driver.collection('enrichments').findOneAndUpdate({_id: enrichment.author.uri, enriched: false}, {
        $set: {
            author: enrichment.author,
            options: enrichment.options,
            enriched: true
        },
    })
}

function feedEnrichments(driver, callback, limit = 3) {
    driver.collection('enrichments').find({enriched: false}, {fields: {_id: 1}, limit: limit}).toArray((err, res) => {

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

function getAndlockAgent(driver, user, agent, callback) {

    if(driver) {

        // Change behavior on uri existance
        let filter = agent ? {_id: agent} : {enriched: true};
        //filter.lock = null;
        filter.matchedBy = {$nin: [user]};

        // Take the lock on the selected document
        driver.collection('enrichments').findOneAndUpdate(
            filter,
            {$set: {lock: new Date()}},
            {returnOriginal: true},
            (err, res) => {
                if (err) throw err;
                callback(res.value);
            });

    } else
        callback(null);

}

function resetLocks(driver, callback) {
    driver.collection('enrichments').update({}, {$set: {lock: null}}, {multi: true}, (err, res) => {
        if(err) throw err;
        callback();
    });
}

function storeMatching(driver, user, option, agent) {

    // Store document of with do the upsert
    let document = {user: user, option: option, timestamp: new Date()};

    // Upsert document and store matching
    return driver.collection('matchings').update(document, document, {upsert: true}, (err, res) => {
        if(err) throw err;
        driver.collection('enrichments').update({_id: agent}, {$addToSet: {matchedBy: user}});
    });

}

exports.storeEnrichment = storeEnrichment;
exports.feedEnrichments = feedEnrichments;
exports.getAndLockAgent = getAndlockAgent;
exports.resetLocks      = resetLocks;
exports.storeMatching   = storeMatching;