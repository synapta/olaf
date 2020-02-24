const db = require('./users');

// Import different login strategies
const LocalStrategy = require('passport-local').Strategy;

// Set up local strategy
module.exports = (passport, driver) => {

    // Used to serialize the user for the session
    passport.serializeUser((user, done) => {
        done(null, user['_id']);
    });

    // Used to deserialize the user
    passport.deserializeUser((email, done) => {
        db.findUserById(driver, email, (err, user) => {
            done(err, user);
        });
    });

    // Implement local strategy
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
            }
            
            return done(null, user, {});

        });
    }));

};
