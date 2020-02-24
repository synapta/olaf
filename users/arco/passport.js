const db = require('./db');

// Import different login strategies
const LocalStrategy = require('passport-local').Strategy;

// Set up local strategy
module.exports = (passport, driver) => {

    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    }, (username, password, done) => {
        db.retrieveUser(driver, username, password, (err, user) => {

            // Handle query result
            if (err) {
                return done(null, false, {
                    'message': 'genericError'
                });
            } else if (user === null) {
                return done(null, false, {
                    'message': 'notRegisteredUserError'
                });
            } else if (user === false) {
                return done(null, false, {
                    'message': 'incorrectPasswordError'
                });
            } else
                return done(null, user, {});

        });
    }));

};
