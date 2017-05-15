var express  = require('express');

module.exports = function(app, passport) {

app.use('/',express.static('.'));
// normal routes ===============================================================
    app.get('/', function(req, res) {
        res.sendFile(__dirname + '/index.html');
    });

    app.get('/connect-cobis', isLoggedIn, function(req, res) {
        res.sendFile(__dirname + '/challenges/cobis/cobis.html');
    });

    app.get('/connect-leibniz', isLoggedIn, function(req, res) {
        res.sendFile(__dirname + '/challenges/leibniz/leibniz.html');
    });

    app.get('/search', function(req, res) {
        res.sendFile(__dirname + '/search.html');
    });

    // show the home page (will also have our login links)
    app.get('/auth', function(req, res) {
        res.render('index.ejs');
    });

    // PROFILE SECTION =========================
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user
        });
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

    // facebook -------------------------------

        // send to facebook to do the authentication
        app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

        // handle the callback after facebook has authenticated the user
        app.get('/auth/facebook/callback',
            passport.authenticate('facebook', {
                successRedirect : '/',
                failureRedirect : '/auth'
            }));

    // twitter --------------------------------

        // send to twitter to do the authentication
        app.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));

        // handle the callback after twitter has authenticated the user
        app.get('/auth/twitter/callback',
            passport.authenticate('twitter', {
                successRedirect : '/',
                failureRedirect : '/auth'
            }));


    // google ---------------------------------

        // send to google to do the authentication
        app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

        // the callback after google has authenticated the user
        app.get('/auth/google/callback',
            passport.authenticate('google', {
                successRedirect : '/',
                failureRedirect : '/auth'
            }));

// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================

    // locally --------------------------------
        app.get('/connect/local', function(req, res) {
            res.render('connect-local.ejs', { message: req.flash('loginMessage') });
        });
        app.post('/connect/local', passport.authenticate('local-signup', {
            successRedirect : '/', // redirect to the secure profile section
            failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

    // facebook -------------------------------

        // send to facebook to do the authentication
        app.get('/connect/facebook', passport.authorize('facebook', { scope : 'email' }));

        // handle the callback after facebook has authorized the user
        app.get('/connect/facebook/callback',
            passport.authorize('facebook', {
                successRedirect : '/',
                failureRedirect : '/auth'
            }));

    // twitter --------------------------------

        // send to twitter to do the authentication
        app.get('/connect/twitter', passport.authorize('twitter', { scope : 'email' }));

        // handle the callback after twitter has authorized the user
        app.get('/connect/twitter/callback',
            passport.authorize('twitter', {
                successRedirect : '/',
                failureRedirect : '/auth'
            }));


    // google ---------------------------------

        // send to google to do the authentication
        app.get('/connect/google', passport.authorize('google', { scope : ['profile', 'email'] }));

        // the callback after google has authorized the user
        app.get('/connect/google/callback',
            passport.authorize('google', {
                successRedirect : '/',
                failureRedirect : '/auth'
            }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // facebook -------------------------------
    app.get('/unlink/facebook', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.facebook.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // twitter --------------------------------
    app.get('/unlink/twitter', isLoggedIn, function(req, res) {
        var user           = req.user;
        user.twitter.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

    // google ---------------------------------
    app.get('/unlink/google', isLoggedIn, function(req, res) {
        var user          = req.user;
        user.google.token = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });


    var wikidata = require('./authorities/wikidata.js');
    var viaf = require('./authorities/viaf.js');

    var dbpedia = require('./authorities/dbpedia.js');
    var cobis = require('./challenges/cobis/cobis.js');
    var leibniz = require('./challenges/leibniz/leibniz.js');


    /* QUERY */
    app.get('/search/:label', function (request, response) {
      console.log("Asking Wikidata");
      wikidata.getWikidataHints(request.params.label, request.params.label, function (hints) {
          if (hints === null) {
             response.send({"no-results":true});
          } else if (hints) {
             response.send(hints);
          }
      });
    });

    app.get('/dbpedia/abstract/:label', function (request, response) {
      console.log("Asking DBpedia");
      dbpedia.getAbstract(request.params.label, function (abstract) {
          if (abstract !== "error") {
             response.send({"abstract":abstract});
          } else {
             response.send({"abstract":false});
          }
      });
    });

    app.get('/leibniz', isLoggedIn, function (request, response) {
        leibniz.launchSparqlLeibniz(leibniz.getRemains(request.user._id), function (total) {
            leibniz.launchSparqlLeibniz(leibniz.getRandomLeibnizItem(total.n.value, request.user._id), function (seed) {
                console.log(seed.s.value)
                wikidata.getWikidataHints(seed.label.value, seed, function (hints) {
                    if (hints === "rlm") {
                        setTimeout(function () {
                            response.send({"retry":true});
                        }, 1000)
                    } else if (hints) {
                       response.send(hints);
                    } else {
                       console.log("no hints")
                       leibniz.launchSparqlUpdateLeibniz(leibniz.noWikidataHints(seed.s.value), function () {
                           setTimeout(function () {
                               response.send({"retry":true});
                           }, 1000)
                       });
                    }
                });
            });
        });
    });

    app.get('/leibniz/forMeIsNo/:leib/', isLoggedIn, function (request, response) {
        leibniz.launchSparqlUpdateLeibniz(leibniz.forMeIsNo(request.params.leib, request.user._id), function () {
            response.send("ok");
        });
    });

    app.get('/leibniz/forMeIsYes/:leib/:wikidata/', isLoggedIn, function (request, response) {
        leibniz.launchSparqlUpdateLeibniz(leibniz.forMeIsYes(request.params.leib, request.params.wikidata, request.user._id), function () {
            response.send("ok");
        });
    });


    app.get('/cobis', isLoggedIn, function (request, response) {
        cobis.launchSparql(cobis.getRemains(request.user._id), function (total) {
            cobis.launchSparql(cobis.getRandomCobisItem (total.n.value, request.user._id), function (seed) {
                wikidata.getWikidataHints(seed.agentLabel.value, seed, function (hints) {
                    if (hints === "rlm") {
                        setTimeout(function () {
                            response.send({"retry":true});
                        }, 1000)
                    } else if (hints) {
                       viaf.getViafHints(seed.agentLabel.value, hints, function (hintsWithViaf) {
                          response.send(hintsWithViaf);
                        });
                    } else {
                       console.log("no hints")
                       cobis.launchSparqlUpdate(cobis.noWikidataHints(seed.agent.value), function () {
                           setTimeout(function () {
                               response.send({"retry":true});
                           }, 1000)
                       });
                    }
                });
            });
        });
    });

    app.get('/cobis/titles', function (request, response) {
        cobis.launchSparqlMultiple(cobis.getCobisDatasets(request.query.agent), "http://artemis.synapta.io:9000/blazegraph/namespace/AUTHORITY-GRAPH/sparql", function(datasetList) {
          var titleList = [];
          datasetList.forEach(function(element, index, datasetList){
            cobis.launchSparqlMultiple(cobis.getCobisTitles(request.query.agent), element.dataset, function(data){
              titleList = titleList.concat(data.filter(function (item) {
                return titleList.indexOf(item) < 0;
              }))
              if (index === datasetList.length - 1) {
                response.send(titleList);
              }
            });
          });
        });
    });

    app.get('/cobis/forMeIsNo/:cobis/', isLoggedIn, function (request, response) {
        cobis.launchSparqlUpdate(cobis.forMeIsNo(request.params.cobis, request.user._id), function () {
            response.send("ok");
        });
    });

    app.get('/cobis/forMeIsYes/:cobis/:wikidata/', isLoggedIn, function (request, response) {
        cobis.launchSparqlUpdate(cobis.forMeIsYes(request.params.cobis, request.params.wikidata, request.user._id), function () {
            response.send("ok");
        });
    });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/auth');
}
