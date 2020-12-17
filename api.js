const isValidUTF8 = require('utf-8-validate');
const fs = require('fs');
const fsPromises = fs.promises;
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const md5 = require('md5');
const stringify = require('csv-stringify');
const { Op } = require('sequelize');

const { sequelize, User, Job, Source, Item, Candidate, Action, Log } = require('./database');
const { JobTypes, SourceTypes } = require('./config');
const mailer = require('./mailer');

// Upload
const uploadFile = async (req, res) => {
    if (req.is('text/csv')) {
        if (isValidUTF8(req.body)) {
            const path = md5(req.body);
            const filehandle = await fsPromises.open('uploads/' + path, 'w');
            await filehandle.write(req.body);
            await filehandle.close();
            res.json({ "path": path });
        } else {
            res.sendStatus(400);
        }
    } else {
        res.sendStatus(412);
    }
};

// Job
const createJob = async (req, res) => {
    try {
        const job = await Job.create(req.body);
        res.json(job);
    } catch (e) {
        console.error(e);
        res.sendStatus(400);
    }
};

const getJob = async (req, res) => {
    if (req.params.alias === '_all') {
        const jobs = await Job.findAll();
        res.json(jobs);
    } else if (req.params.alias === '_types') {
        res.json(JobTypes);
    } else {
        const job = await Job.findOne({ where: { alias: req.params.alias }, include: Source });
        if (job === null) {
            res.sendStatus(404);
        } else {
            res.json(job);
        }
    }
};

const downloadJob = async (req, res) => {
    try {
        const job = await Job.findOne({ where: { alias: req.params.alias } });
        if (job === null) {
            res.sendStatus(404);
            return;
        }

        const items = await Item.findAll({
            where: { job_id: job.job_id, is_processed: true },
            include: [{ model: Candidate, where: { is_selected: true } }]
        });

        const stringifier = stringify({
            delimiter: ',',
            header: true
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=\"' + job.alias + '-' + Date.now() + '.csv\"');

        stringifier.pipe(res);

        for (let item of items) {
            for (let candidate of item.Candidates) {
                let row = { item_uri: item.item_uri, candidate_uri: candidate.candidate_uri, last_update: candidate.last_update.toISOString() };
                stringifier.write(row);
            }
        }

        stringifier.end();
    } catch (e) {
        console.error(e);
        res.sendStatus(500);
    }
};

const getJobLog = async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    try {
        const job = await Job.findOne({ where: { alias: req.params.alias } });
        if (job === null) {
            res.sendStatus(404);
            return;
        }
        const logs = await Log.findAll({ where: { job_id: job.job_id }, order: [['timestamp', 'DESC']], limit: limit, offset: offset });
        res.json(logs);
    } catch (e) {
        console.error(e);
        res.sendStatus(500);
    }
};

const getJobStats = async (req, res) => {
    try {
        const job = await Job.findOne({ where: { alias: req.params.alias } });
        if (job === null) {
            res.sendStatus(404);
            return;
        }
        const totalItems = await Item.count({ where: { job_id: job.job_id } });
        const todoItems = await Item.count({
            where: { job_id: job.job_id, is_processed: false },
            include: [{
                model: Candidate,
                where: { is_selected: false }
            }], distinct: true, col: 'item_id'
        });
        const toProcessItems = await Item.count({
            where: { job_id: job.job_id },
            include: [{
                model: Candidate,
                where: { is_selected: { [Op.ne]: null } }
            }], distinct: true, col: 'item_id'
        });
        const processedItems = await Item.count({ where: { job_id: job.job_id, is_processed: true } });
        const totalCandidates = await Candidate.count({ include: { model: Item, where: { job_id: job.job_id } } });
        const selectedCandidates = await Candidate.count({
            where: { is_selected: true },
            include: { model: Item, where: { job_id: job.job_id } }
        });
        res.json({
            totalItems: totalItems,
            todoItems: todoItems,
            toProcessItems: toProcessItems,
            processedItems: processedItems,
            totalCandidates: totalCandidates,
            selectedCandidates: selectedCandidates
        });
    } catch (e) {
        console.error(e);
        res.sendStatus(500);
    }
};

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
};

const downloadSource = async (req, res) => {
    const sourceId = parseInt(req.params.id);
    if (isNaN(sourceId)) {
        res.sendStatus(400);
        return;
    }
    const source = await Source.findOne({ where: { source_id: sourceId } });
    if (source === null) {
        res.sendStatus(404);
    } else {
        try {
            const file = await fsPromises.readFile('uploads/' + source.source_config.path);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=\"' + source.name + '\"');
            res.send(file);
        } catch {
            res.sendStatus(500);
        }
    }
};

const reloadSource = async (req, res) => {
    const sourceId = parseInt(req.params.id);
    if (isNaN(sourceId)) {
        res.sendStatus(400);
        return;
    }
    const source = await Source.findOne({ where: { source_id: sourceId } });
    if (source === null) {
        res.sendStatus(404);
    } else {
        try {
            source.last_update = null;
            await source.save();
            res.sendStatus(200);
        } catch {
            res.sendStatus(500);
        }
    }
};

const createSource = async (req, res) => {
    if (!req.body || !req.body.source_config || !req.body.source_config.path || req.body.source_config.path.includes('/')) {
        res.sendStatus(400);
        return;
    }
    try {
        const source = await Source.create(req.body);
        res.json(source);
    } catch (e) {
        console.error(e);
        res.sendStatus(400);
    }
};

const deleteSource = async (req, res) => {
    const sourceId = parseInt(req.params.id);
    if (isNaN(sourceId)) {
        res.sendStatus(400);
        return;
    }

    const t = await sequelize.transaction();

    try {
        // Delete only if there are no actions
        const actions = await Action.findAll({ include: { model: Item, where: { source_id: sourceId } } }, { transaction: t });
        if (actions.length === 0) {
            await Candidate.destroy({ where: { source_id: sourceId } }, { transaction: t });
            await Item.destroy({ where: { source_id: sourceId } }, { transaction: t });
            const source = await Source.findOne({ where: { source_id: sourceId } }, { transaction: t });
            await fsPromises.unlink('uploads/' + source.source_config.path);
            await Source.destroy({ where: { source_id: sourceId } }, { transaction: t });
            await t.commit();
            res.sendStatus(200);
        } else {
            await t.rollback();
            res.sendStatus(422);
        }
    } catch (e) {
        await t.rollback();
        console.error(e);
        res.sendStatus(500);
    }
};

// Item
const getItem = async (req, res) => {
    const jobAlias = req.params.alias;
    const job = await Job.findOne({ where: { alias: jobAlias } });
    if (job == null) {
        res.sendStatus(400);
        return;
    }
    const itemUri = req.query.uri;
    if (itemUri != null) {
        // Get a specific item
        const item = await Item.findOne({
            where: { job_id: job.job_id, item_uri: itemUri }, include: Candidate,
            order: [
                [Candidate, 'score', 'ASC']
            ]
        });
        if (item == null) {
            res.sendStatus(404);
        } else {
            res.json(item);
        }
    } else {
        // Get the next item
        const core = require('./cores/' + job.job_type);
        const nextItem = await core.nextItem(job);
        if (nextItem == null) {
            res.sendStatus(404);
        } else {
            nextItem.lock_timestamp = new Date();
            await nextItem.save();
            res.json(nextItem);
        }
    }
};

const saveItem = async (req, res) => {
    if (!Array.isArray(req.body)) {
        res.status(400).json({ error: '' });
        return;
    }

    // Create a transaction
    const t = await sequelize.transaction();

    try {
        const jobAlias = req.params.alias;
        const job = await Job.findOne({ where: { alias: jobAlias } }, { transaction: t });
        if (job == null) {
            res.status(400).json({ error: 'job-not-found' });
            return;
        }
        const core = require('./cores/' + job.job_type);

        const itemId = parseInt(req.params.id);
        if (isNaN(itemId)) {
            res.status(400).json({ error: 'invalid-idem_id' });
            return;
        }
        const item = await Item.findOne({ where: { item_id: itemId, job_id: job.job_id } }, { transaction: t });
        if (item == null || item.is_processed) {
            await t.rollback();
            res.status(400).json({ error: 'item-not-found-or-processed' });
            return;
        }

        if (req.body.length == 0) {
            // No candidates found
            await Action.create({
                item_id: item.item_id,
                user_id: req.user.user_id,
                is_orphan: true
            }, { transaction: t });
        } else {
            // For all the candidates
            for (let candidateId of req.body) {
                // Update the candidate
                const candidate = await Candidate.findOne({ where: { candidate_id: candidateId, item_id: item.item_id } }, { transaction: t });

                // Invalid candidate
                if (candidate == null) {
                    await t.rollback();
                    res.status(400).json({ error: 'invalid-candidate' });
                    return;
                }

                candidate.is_selected = true;
                candidate.last_update = new Date();
                await candidate.save({ transaction: t });

                // Create the action
                await Action.create({
                    item_id: item.item_id,
                    candidate_id: candidate.candidate_id,
                    user_id: req.user.user_id,
                }, { transaction: t });

                core.saveCandidate(job, item, candidate);
            }
        }

        // Update the item
        item.is_processed = true;
        item.lock_timestamp = null;
        item.last_update = new Date();
        await item.save({ transaction: t });

        // Commit transaction
        await t.commit();
        res.status(200).json({});
    } catch (e) {
        console.error(e);
        await t.rollback();
        res.status(400).json({ error: e });
    }
};

const skipItem = async (req, res) => {
    // Create a transaction
    const t = await sequelize.transaction();

    try {
        const jobAlias = req.params.alias;
        const job = await Job.findOne({ where: { alias: jobAlias } }, { transaction: t });
        if (job == null) {
            res.status(400).json({ error: 'job-not-found' });
            return;
        }

        const itemId = parseInt(req.params.id);
        if (isNaN(itemId)) {
            res.status(400).json({ error: 'not-valid-item_id' });
            return;
        }
        const item = await Item.findOne({ where: { item_id: itemId, job_id: job.job_id } }, { transaction: t });
        if (item == null || item.is_processed) {
            await t.rollback();
            res.status(400).json({ error: 'item-not-found-or-processed' });
            return;
        }

        await Action.create({
            item_id: item.item_id,
            user_id: req.user.user_id,
            is_skipped: true
        }, { transaction: t });

        // Update the item
        item.lock_timestamp = null;
        await item.save({ transaction: t });

        // Commit transaction
        await t.commit();
        res.status(200).json({});
    } catch (e) {
        console.error(e);
        await t.rollback();
        res.status(400).json({ error: e });
    }
};

// User
const createUser = async (req, res) => {
    // Password must be valid
    if (!req.body.password || req.body.password == '') {
        res.status(400).json({ error: 'empty-password' });
        return;
    }
    const hash = await bcrypt.hash(req.body.password, 10);
    const token = crypto.randomBytes(64).toString('hex');
    try {
        await User.create({
            email: req.body.email,
            password: hash,
            token: token,
            display_name: req.body.display_name
        });
        // Do not await this
        mailer.sendVerifyEmail(req.body.email, token).catch((e) => { console.error(e); });
        res.status(200).json({ redirect: '/verify' });
    } catch (e) {
        console.error(e);
        res.status(400).json({ error: 'user-creation-error' });
    }
};

const sendVerifyEmail = async (req, res) => {
    // Email must be valid
    if (!req.body.email || req.body.email == '') {
        res.status(400).json({ error: 'missing-email' });
        return;
    }
    const user = await User.findOne({ where: { email: req.body.email, is_verified: false } });
    if (user == null) {
        res.status(404).json({ error: 'user-error' });
    } else {
        // Do not await this
        mailer.sendVerifyEmail(user.email, user.token).catch((e) => { console.error(e); });
        res.status(200).json({});
    }
};

const verifyEmail = async (req, res) => {
    const user = await User.findOne({ where: { token: req.params.token, is_verified: false } });
    if (user == null) {
        res.sendStatus(404);
    } else {
        user.is_verified = true;
        await user.save();
        res.redirect('/verified');
    }
};

const updateUser = async (req, res) => {
    if (!req.user) {
        res.status(403).json({ error: 'missing-user' });
        return;
    }
    if (!req.body.old || req.body.old == '') {
        res.status(400).json({ error: 'missing-old-pwd' });
        return;
    }
    if (!req.body.new || req.body.new == '') {
        res.status(400).json({ error: 'missing-new-pwd' });
        return;
    }
    const user = await User.findOne({ where: { user_id: req.user.user_id } });
    // Check old password
    if (await bcrypt.compare(req.body.old, user.password) == false) {
        res.status(403).json({ error: 'wrong-old-pwd' });
        return;
    }
    user.password = await bcrypt.hash(req.body.new, 10);
    await user.save();
    res.status(200).json({});
};

const sendResetEmail = async (req, res) => {
    // Email must be valid
    if (!req.body.email || req.body.email == '') {
        res.status(400).json({ error: 'missing-email' });
        return;
    }
    const user = await User.findOne({ where: { email: req.body.email, is_verified: true } });
    if (user == null) {
        res.status(404).json({ error: 'user-not-found' });
    } else {
        user.token = crypto.randomBytes(64).toString('hex');
        user.is_password_reset = true;
        user.last_password_update = new Date();
        await user.save();
        // Do not await this
        mailer.sendResetEmail(user.email, user.token).catch((e) => { console.error(e); });
        res.status(200).json({});
    }
};

const resetPassword = async (req, res) => {
    // Password must be valid
    if (!req.body.password || req.body.password == '') {
        res.status(400).json({ error: 'missing-password' });
        return;
    }
    const token_limit = new Date();
    token_limit.setHours(token_limit.getHours() - 1);
    const user = await User.findOne({ where: { token: req.params.token, is_password_reset: true, last_password_update: { [Op.gt]: token_limit } } });
    if (user == null) {
        res.status(404).json({ error: 'user-not-found' });
    } else {
        user.password = await bcrypt.hash(req.body.password, 10);
        user.is_password_reset = false;
        user.last_password_update = new Date();
        await user.save();
        res.status(200).json({});
    }
};

const checkEmail = async (req, res) => {
    const user = await User.findOne({ where: { email: req.params.email } });
    if (user == null) {
        res.status(200).json({});
    } else {
        res.status(410).json({ error: 'mail-not-found' });
    }
};

const getUserStats = async (req, res) => {
    try {
        const validActions = await Action.count({ where: { user_id: req.user.user_id, candidate_id: { [Op.not]: null } } });
        const orphanActions = await Action.count({ where: { user_id: req.user.user_id, is_orphan: true } });
        const skipActions = await Action.count({ where: { user_id: req.user.user_id, is_skipped: true } });
        res.json({
            validActions: validActions,
            orphanActions: orphanActions,
            skipActions: skipActions
        });
    } catch (e) {
        console.error(e);
        res.sendStatus(500);
    }
};

module.exports = {
    uploadFile,
    createJob,
    getJob,
    downloadJob,
    getJobLog,
    getJobStats,
    getSource,
    downloadSource,
    reloadSource,
    createSource,
    deleteSource,
    getItem,
    saveItem,
    skipItem,
    createUser,
    sendVerifyEmail,
    verifyEmail,
    updateUser,
    sendResetEmail,
    resetPassword,
    checkEmail,
    getUserStats
};