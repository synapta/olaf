const nodeRequest = require('request-promise');

// Enrich not enriched authors
function feedEnrichments(driver, callback, limit = 3) {
    driver.collection('enrichments').find({enriched: false}, {fields: {_id: 1}, limit: limit}).toArray((err, res) => {

        // Generate requests for each enrichment uri
        let requests = res.map(el => nodeRequest('http://localhost:3646/api/v1/arco/author/' + encodeURIComponent(el._id) + '/?enrichment=true'));
        //console.log(requests);
        Promise.all(requests).then((results) => {

            // Parse JSON result
            results = results.map(result => JSON.parse(result));

            // Store enrichment
            let queries = results.map(result => driver.collection('enrichments').findOneAndUpdate({_id: result.author.uri}, {
                $set: {
                    author: result.author,
                    options: result.options,
                    enriched: true
                },
            }));

            Promise.all(queries).then(callback);

        })

    })
}



function getAndlockAgent(driver, uri, callback) {

    // Change behavior on uri existance
    let filter = uri ? {_id: uri, lock: null} : {enriched: true, lock: null};

    // Take the lock on the selected document
    driver.collection('enrichments').findOneAndUpdate(
        filter,
        {$set: {lock: new Date()}},
        {returnOriginal: true},
        (err, res) => {
        callback(res.value);
    });

}

exports.feedEnrichments = feedEnrichments;
exports.getAndLockAgent = getAndlockAgent;
