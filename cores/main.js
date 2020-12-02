const { User, Job, Source, Item, Candidate, Action } = require('../database');

async function loadItem(item_body, source, job) {
    const item_uri = job.job_config.item_uri || 'URI';
    const item_search = job.job_config.item_search || 'Search';

    let item;

    item = await Item.findOne({ where: { job_id: job.job_id, item_uri: item_body[item_uri] } });

    if (item == null) {
        item = await Item.create({
            source_id: source.source_id,
            job_id: job.job_id,
            item_uri: item_body[item_uri],
            item_search: item_body[item_search],
            item_body: item_body,
            last_update: new Date()
        });
    }

    return item;
}

async function loadCandidates(item, job) {
    // Check there are not candidates
    if (await Candidate.findOne({ where: { item_id: item.item_id } })) {
        return -1;
    }

    const query = require('../queries/wikidata');
    const candidates = await query.getCandidates(item.item_search);

    for (let candidate_body of candidates) {
        await Candidate.create({
            item_id: item.item_id,
            candidate_uri: candidate_body.id.value,
            candidate_body: candidate_body,
            score: 1,
            last_update: new Date()
        });
    }

    return candidates.length;
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
};