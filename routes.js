const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const express = require('express');
const LocalStrategy = require('passport-local').Strategy;

const api = require('./api');
const { User } = require('./database');

const rawParser = bodyParser.raw({ type: '*/*', limit: '100mb' });

module.exports = function (app, passport) {

    passport.serializeUser((user, done) => {
        done(null, user.user_id);
    });

    passport.deserializeUser((user_id, done) => {
        User.findOne({ where: { user_id: user_id } }).then((user) => done(null, user));
    });

    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    }, (email, password, done) => {
        User.findOne({ where: { email: email } }).then(async (user) => {
            if (user === null) {
                return done(null, false);
            } else if (await bcrypt.compare(password, user.password) == false) {
                return done(null, false);
            }
            return done(null, user);
        }).catch((e) => {
            return done(e);
        });
    }));

    app.all('*', (req, res, next) => {
        if (req.path.startsWith('/api/v2/user')) {
            // No need to authenticate
            next();
        } else if (req.path.startsWith('/api/')) {
            // All other APIs require a verified user
            if (req.user && req.user.is_verified) {
                next();
            } else {
                res.sendStatus(403);
            }
        } else {
            // Always return the frontend
            next();
        }
    });

    // Frontend
    app.get('/', (request, response) => {
        response.sendFile('index.html', { root: __dirname + '/app' });
    });

    app.get('/login', (request, response) => {
        response.sendFile('login.html', { root: __dirname + '/app/views' });
    });

    app.get('/info', (request, response) => {
        response.sendFile('info.html', { root: __dirname + '/app/views' });
    });

    app.get('/how-to', (request, response) => {
        response.sendFile('howto.html', { root: __dirname + '/app/views' });
    });

    app.get('/privacy-policy', (request, response) => {
        response.sendFile('privacy-policy.html', { root: __dirname + '/app/views' });
    });

    app.get('/new-job', (request, response) => {
      if (request.user && request.user.role === 'admin') {
        response.sendFile('new-job.html', { root: __dirname + '/app/views' });
      } else {
        response.redirect('/login');
      }        
    });

    app.get('/verify', (request, response) => {
        response.sendFile('verify-user.html', { root: __dirname + '/app/views' });
    });

    app.get('/verified', (request, response) => {
        response.sendFile('verified-user.html', { root: __dirname + '/app/views' });
    });

    app.get('/profile', (request, response) => {
        response.sendFile('profile.html', { root: __dirname + '/app/views' });
    });

    app.get('/password-reset', (request, response) => {
        response.sendFile('password-reset.html', { root: __dirname + '/app/views' });
    });

    app.get('/job/:alias', (request, response) => {
        response.sendFile('job.html', { root: __dirname + '/app/views' });
    });

    app.get('/match/:alias', (request, response) => {
        if (request.user) {
          response.sendFile('match.html', { root: __dirname + '/app/views' });
        } else {
          response.redirect('/login');
        }        
    });

    // Frontend libraries
    app.use('/libs/*', (req, res, next) => {
        res.set('Cache-control', 'public, max-age=31536000');
        next();
    });

    app.use('/libs/fontawesome', express.static(__dirname + '/node_modules/@fortawesome/fontawesome-free/js'));
    app.use('/libs/jquery', express.static(__dirname + '/node_modules/jquery/dist'));
    app.use('/libs/mustache', express.static(__dirname + '/node_modules/mustache'));
    app.use('/libs/semantic', express.static(__dirname + '/node_modules/semantic-ui-css'));

    // Upload
    app.post('/api/v2/upload', rawParser, (req, res) => {
        if (req.user.role == 'admin') {
            api.uploadFile(req, res);
        } else {
            res.sendStatus(403);
        }
    });

    // Job
    app.post('/api/v2/job', (req, res) => {
        if (req.user.role == 'admin') {
            api.createJob(req, res);
        } else {
            res.sendStatus(403);
        }
    });

    app.get('/api/v2/job/:alias', (req, res) => {
        api.getJob(req, res);
    });

    app.get('/api/v2/job/:alias/download', (req, res) => {
        if (req.user.role == 'admin') {
            api.downloadJob(req, res);
        } else {
            res.sendStatus(403);
        }
    });

    app.get('/api/v2/job/:alias/log', (req, res) => {
        if (req.user.role == 'admin') {
            api.getJobLog(req, res);
        } else {
            res.sendStatus(403);
        }
    });

    app.get('/api/v2/job/:alias/stats', (req, res) => {
        api.getJobStats(req, res);
    });

    // Source
    app.post('/api/v2/source', (req, res) => {
        if (req.user.role == 'admin') {
            api.createSource(req, res);
        } else {
            res.sendStatus(403);
        }
    });

    app.get('/api/v2/source/:id', (req, res) => {
        api.getSource(req, res);
    });

    app.get('/api/v2/source/:id/download', (req, res) => {
        if (req.user.role == 'admin') {
            api.downloadSource(req, res);
        } else {
            res.sendStatus(403);
        }
    });

    app.post('/api/v2/source/:id/reload', (req, res) => {
        if (req.user.role == 'admin') {
            api.reloadSource(req, res);
        } else {
            res.sendStatus(403);
        }
    });

    app.delete('/api/v2/source/:id', (req, res) => {
        if (req.user.role == 'admin') {
            api.deleteSource(req, res);
        } else {
            res.sendStatus(403);
        }
    });

    // Item
    app.get('/api/v2/item/:alias', (req, res) => {
        api.getItem(req, res);
    });

    app.post('/api/v2/item/:alias/:id', (req, res) => {
        api.saveItem(req, res);
    });

    app.post('/api/v2/item/:alias/:id/remove', (req, res) => {
        api.skipOrRemoveItem(req, res, true);
    });

    app.post('/api/v2/item/:alias/:id/skip', (req, res) => {
        api.skipOrRemoveItem(req, res, false);
    });

    // User
    app.post('/api/v2/user/signup', (req, res) => {
        api.createUser(req, res);
    });

    app.post('/api/v2/user/verify', (req, res) => {
        api.sendVerifyEmail(req, res);
    });

    app.get('/api/v2/user/verify/:token', (req, res) => {
        api.verifyEmail(req, res);
    });

    app.post('/api/v2/user/update', (req, res) => {
        api.updateUser(req, res);
    });

    app.post('/api/v2/user/reset', (req, res) => {
        api.sendResetEmail(req, res);
    });

    app.post('/api/v2/user/reset/:token', (req, res) => {
        api.resetPassword(req, res);
    });

    app.get('/api/v2/user/check/:email', (req, res) => {
        api.checkEmail(req, res);
    });

    app.post('/api/v2/user/login', passport.authenticate('local'), (req, res) => {
        res.status(200).json({ redirect: '/' });
    });

    app.get('/api/v2/user/logout', (req, res) => {
        req.logout();
        res.status(200).json({ redirect: '/' });
    });

    app.get('/api/v2/user', (req, res) => {
        if (req.user) {
            res.json({
                "email": req.user.email,
                "display_name": req.user.display_name,
                "role": req.user.role,
                "is_verified": req.user.is_verified
            });
        } else {
            res.json(null);
        }
    });

    app.get('/api/v2/user/stats', (req, res) => {
        if (req.user) {
            api.getUserStats(req, res);
        } else {
            res.sendStatus(403);
        }
    });

    app.get('/api/v2/user/history', (req, res) => {
        if (req.user) {
            api.getUserHistory(req, res);
        } else {
            res.sendStatus(403);
        }
    });

    app.use((req, res) => {
      res.status(404).sendFile('404.html', { root: __dirname + '/app' });
    });
};
