const { User, Job, Source, Item, Candidate, Action } = require('./database');
const { JobTypes, SourceTypes } = require('./config');

// Job
const getJob = async (req, res) => {
    if (req.params.id === '_all') {
        const jobs = await Job.findAll();
        res.json(jobs);
    } else if (req.params.id === '_types') {
        res.json(JobTypes);
    } else {
        const jobId = parseInt(req.params.id);
        if (isNaN(jobId)) {
            res.sendStatus(400);
            return;
        }
        const job = await Job.findOne({ where: { job_id: jobId }, include: Source });
        if (job === null) {
            res.sendStatus(404);
        } else {
            res.json(job);
        }
    }
}

const createJob = async (req, res) => {
    try {
        const job = await Job.create(req.body);
        res.json(job);
    } catch (e) {
        console.error(e);
        res.sendStatus(400);
    }
}

// Source
const getSource = async (req, res) => {
    if (req.params.id === '_types') {
        res.json(SourceTypes);
    } else {
        const sourceId = parseInt(req.params.id);
        if (isNaN(sourceId)) {
            res.sendStatus(400);
            return;
        }
        const source = await Source.findOne({ where: { source_id: sourceId }, include: Job });
        if (source === null) {
            res.sendStatus(404);
        } else {
            res.json(source);
        }
    }
}

const createSource = async (req, res) => {
    try {
        const source = await Source.create(req.body);
        res.json(source);
    } catch (e) {
        console.error(e);
        res.sendStatus(400);
    }
}

const deleteSource = async (req, res) => {
    const sourceId = parseInt(req.params.id);
    if (isNaN(sourceId)) {
        res.sendStatus(400);
        return;
    }
    try {
        await Source.destroy({ where: { source_id: sourceId } });
        res.sendStatus(200);
    } catch (e) {
        console.error(e);
        res.sendStatus(400);
    }
}

module.exports = {
    getJob,
    createJob,
    getSource,
    createSource,
    deleteSource
}