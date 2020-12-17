const { Job, Source, Log } = require('./database');

async function runJob(job) {
    const sources = await Source.findAll({ where: { job_id: job.job_id, update_policy: 'once', last_update: null } });
    const core = require('./cores/' + job.job_type);

    for (let source of sources) {
        await Log.create({ job_id: job.job_id, description: { status: 'start', source: source.source_config, job: job.job_config } });

        let data = null;

        try {
            data = parseSource(source);
        } catch (e) {
            console.error(e);
            await Log.create({ job_id: job.job_id, description: { status: 'error', type: 'source', message: e.toString() } });
        }

        if (data) {
            const stats = {
                totalItems: 0,
                errorItems: 0,
                zeroItems: 0,
                skipItems: 0,
                validItems: 0,
                validCandidates: 0,
                errorCandidates: 0
            };

            for await (const item_body of data) {
                let item = null;

                try {
                    item = await core.loadItem(item_body, source, job);
                    stats.totalItems++;
                } catch (e) {
                    console.error(e);
                    await Log.create({ job_id: job.job_id, description: { status: 'error', type: 'item', message: e.toString(), context: item_body } });
                    stats.errorItems++;
                }

                if (item) {
                    try {
                        let numCandidates = await core.loadCandidates(item, job);
                        if (numCandidates === 0) {
                            stats.zeroItems++;
                        } else if (numCandidates > 0) {
                            stats.validItems++;
                            stats.validCandidates += numCandidates;
                        } else {
                            stats.skipItems++;
                        }
                    } catch (e) {
                        console.error(e);
                        await Log.create({ job_id: job.job_id, description: { status: 'error', type: 'candidate', message: e.toString(), context: item_body } });
                        stats.errorCandidates++;
                    }
                }
            }

            await Log.create({ job_id: job.job_id, description: { status: 'end', stats: stats } });
        }

        // Update source
        source.last_update = new Date();
        await source.save();
    }

    // Update job
    job.last_update = new Date();
    await job.save();
}

function parseSource(source) {
    const parser = require('./parsers/' + source.source_type);
    return parser.parse(source.source_config);
}

async function run() {
    const jobs = await Job.findAll({ where: { is_enabled: true } });

    for (let job of jobs) {
        try {
            await runJob(job);
        } catch (e) {
            console.error(e);
            console.error(job.dataValues);
        }
    }

    return Promise.resolve();
}

module.exports = {
    run
};