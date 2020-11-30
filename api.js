const { User, Job, Source, Item, Candidate, Action } = require('./database');

// Job
const getJob = async (req, res) => {
    if (req.params.id === '_all') {
        const jobs = await Job.findAll();
        res.json(jobs);
    } else {
        const jobId = parseInt(req.params.id);
        if (isNaN(jobId)) {
            res.sendStatus(400);
            return;
        }
        const job = await Job.findByPk(jobId);
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

module.exports = {
    getJob,
    createJob
}