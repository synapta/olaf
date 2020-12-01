const { User, Job, Source, Item, Candidate, Action } = require('./database');

async function runJob(job) {
    const sources = await Source.findAll({ where: { job_id: job.job_id, update_policy: 'once', last_update: null } });
    const core = require('./cores/' + job.job_type);

    for (let source of sources) {
        let data = null;

        try {
            data = parseSource(source);
        } catch (e) {
            console.error(e);
            console.error(source.dataValues);
        }

        if (data) {
            for await (const item_body of data) {
                let item = null;

                try {
                    item = await core.loadItem(item_body, source, job);
                } catch (e) {
                    // Could be a duplicate
                    // console.error(e);
                }

                if (item) {
                    try {
                        await core.loadCandidates(item, job);
                    } catch (e) {
                        console.log(e);
                    }
                }
            }
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

(async () => {
    const jobs = await Job.findAll({ where: { is_enabled: true } });

    for (let job of jobs) {
        console.log(job.alias);
        try {
            await runJob(job);
        } catch (e) {
            console.error(e);
            console.error(job.dataValues);
        }
    }

})();