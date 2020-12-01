const { User, Job, Source, Item, Candidate, Action } = require('../database');

async function loadItem(item_body, source, job) {
    const item = {
        source_id: source.source_id,
        job_id: job.job_id,
        item_uri: item_body.Uri,
        item_search: item_body.Search,
        item_body: item_body,
        last_update: new Date()
    };
    return Item.create(item);
}

async function loadCandidates(item, job) {

}

function nextItem() {

}

function saveItem() {

}

module.exports = {
    loadItem,
    loadCandidates,
    nextItem,
    saveItem
}